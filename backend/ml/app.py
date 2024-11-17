from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
from datetime import datetime
import pandas as pd

app = Flask(__name__)
CORS(app)

class HydrateDetector:
    def __init__(self, window_size=60):  # Keep last 60 points for analysis
        self.window_size = window_size
        
        # Sliding windows for data
        self.volume_window = deque(maxlen=window_size)
        self.setpoint_window = deque(maxlen=window_size)
        self.valve_window = deque(maxlen=window_size)
        self.timestamp_window = deque(maxlen=window_size)
        
        # Event tracking
        self.current_event = None
        self.detected_events = []
        
        # Initial state
        self.last_status = {
            "is_hydrate": False,
            "event_status": None,
            "current_metrics": None
        }
    
    def detect_hydrate_formation(self, volume, valve, current_time):
        """Detect hydrate formation from current values"""
        volume_threshold = 50
        valve_threshold = 90
        
        is_hydrate_condition = volume < volume_threshold and valve > valve_threshold
        
        if is_hydrate_condition:
            if self.current_event is None:
                self.current_event = {
                    'start_time': current_time,
                    'initial_volume': volume,
                    'initial_valve': valve
                }
                return True, "ALERT: Hydrate formation detected!"
                
        elif self.current_event is not None:
            # End of hydrate event
            self.current_event['end_time'] = current_time
            self.current_event['final_volume'] = volume
            self.current_event['final_valve'] = valve
            self.current_event['duration'] = (current_time - self.current_event['start_time']).total_seconds()
            self.detected_events.append(self.current_event)
            self.current_event = None
            return True, "Hydrate event ended"
            
        return False, ""

    def process_data_point(self, timestamp, volume, setpoint, valve):
        """Process a single data point and return detection results"""
        # Add to sliding windows
        self.timestamp_window.append(timestamp)
        self.volume_window.append(volume)
        self.setpoint_window.append(setpoint)
        self.valve_window.append(valve)
        
        # Detect hydrate formation
        is_hydrate, message = self.detect_hydrate_formation(volume, valve, timestamp)

        query_timestamp = datetime.strptime(timestamp, '%m/%d/%Y %I:%M:%S %p')
        
        # Calculate current metrics
        metrics = {
            "volume": volume,
            "setpoint": setpoint,
            "valve": valve,
            "volume_deviation": setpoint - volume if setpoint is not None else None,
            "timestamp": query_timestamp.isoformat()
        }
        
        # Update status
        self.last_status = {
            "is_hydrate": is_hydrate,
            "event_status": message if message else "Normal operation",
            "current_metrics": metrics,
            "current_event": self.current_event,
            "recent_events": self.detected_events[-5:] if self.detected_events else []  # Last 5 events
        }
        
        return self.last_status

# Create global detector instance
detector = HydrateDetector()

@app.route('/api/detect-hydrate', methods=['POST'])
def detect_hydrate():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['timestamp', 'volume', 'setpoint', 'valve']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields. Required: timestamp, volume, setpoint, valve'
            }), 400
        
        # Parse timestamp
        try:
            timestamp = datetime.fromisoformat(data['timestamp'])
        except ValueError:
            timestamp = datetime.now()  # Fallback to current time if parsing fails
        
        # Process data point
        result = detector.process_data_point(
            timestamp=timestamp,
            volume=float(data['volume']),
            setpoint=float(data['setpoint']) if data['setpoint'] is not None else None,
            valve=float(data['valve'])
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'error': f'Error processing request: {str(e)}'
        }), 500

@app.route('/api/detector-status', methods=['GET'])
def get_status():
    """Get current detector status without processing new data"""
    return jsonify(detector.last_status)

@app.route('/api/recent-events', methods=['GET'])
def get_recent_events():
    """Get list of recent hydrate events"""
    return jsonify({
        'events': detector.detected_events[-10:]  # Last 10 events
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)