# client.py
import socketio
import pandas as pd
import time

class CSVStreamer:
    def __init__(self, csv_path, email, password, device_id, server_url='http://0.0.0.0:9090'):
        self.sio = socketio.Client()
        self.csv_path = csv_path
        self.server_url = server_url
        self.email = email
        self.password = password
        self.authenticated = False
        self.device_id = device_id
        
        # Set up Socket.IO event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('authentication_success', self.on_authentication_success)
        
    def on_connect(self):
        self.sio.emit('authenticate', {
            'email': self.email,
            'password': self.password
        })
    
    def on_authentication_success(self, data) :
        print('Authentication successful')
        self.authenticated = True
    
        
    def on_disconnect(self):
        print('Disconnected from server')
        
    def connect_to_server(self):
        try:
            self.sio.connect(self.server_url)
            time.sleep(1)
            print(self.authenticated)
            if not self.authenticated:
                print("Authentication failed, check Email and Password")
        except Exception as e:
            print(f"Failed to connect to server: {e}")
            return False
        return self.authenticated
    
    def stream_data(self, interval=1.0):
        """
        Read CSV file and stream data row by row
        interval: Time between sending each row (in seconds)
        """
        try:
            # Read CSV file
            df = pd.read_csv(self.csv_path)
            # df['Time'] = pd.to_datetime(df['Time'], format='%m/%d/%Y %I:%M:%S %p')

            # Fill missing values
            df['Inj Gas Meter Volume Setpoint'] = df['Inj Gas Meter Volume Setpoint'].ffill()
            df['Inj Gas Valve Percent Open'] = df['Inj Gas Valve Percent Open'].interpolate()
            
            # Stream each row
            for _, row in df.iterrows():
                if not self.sio.connected:
                    print("Connection lost. Stopping stream.")
                    break
                    
                # Convert row to dictionary and send
                data = row.to_dict()
                data['email'] = self.email
                data['device_id'] = self.device_id
                self.sio.emit('data', data)
                print(f"Sent data: {data}")
                
                # Wait for the specified interval
                time.sleep(interval)
                
        except Exception as e:
            print(f"Error streaming data: {e}")
        finally:
            if self.sio.connected:
                self.sio.disconnect()

if __name__ == '__main__':
    # Example usage
    csv_path = '../data/Gallant_102H-10_04-10_11.csv'  # Replace with your CSV file path
    email = "sampleuser@example.com"
    password="SampleUser@123"
    device_id = "abcd1234"
    streamer = CSVStreamer(csv_path, email, password, device_id)
    
    if streamer.connect_to_server():
        streamer.stream_data(interval=1.0)  # Stream data with 1 second interval