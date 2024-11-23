from flask import Flask, request, jsonify # Import request from flask
from flask_socketio import SocketIO, emit, disconnect
from flask_cors import CORS
from datetime import datetime, timedelta
from jose import jwt
from passlib.hash import pbkdf2_sha256
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from logging import getLogger
from pythonjsonlogger import jsonlogger
import pika
import json
import sys
from ml.app import HydrateDetector
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import Optional, Union, List
import math


app = Flask(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, methods=["GET","POST"])  # Enable CORS for all routes

# Configure logging
logger = getLogger()
logHandler = jsonlogger.JsonFormatter()

# Database connection function
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USERNAME'),
        password=os.getenv('DB_PASSWORD'),
        cursor_factory=RealDictCursor
    )

hydrate_detector = HydrateDetector()

# Create users table if not exists
def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Create users table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create devices table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                device_id VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create streaming_data table with specific columns for the gas meter data
        cur.execute('''
            CREATE TABLE IF NOT EXISTS gas_meter_data (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                gas_meter_volume_instant FLOAT,
                gas_meter_volume_setpoint FLOAT,
                gas_valve_percent_open FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users(email)
            )
        ''')

        # Create index on timestamp for better query performance
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_gas_meter_timestamp
            ON gas_meter_data(timestamp)
        ''')

        conn.commit()
        print("Database initialized successfully!")

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        logger.error(f"Database initialization error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error initializing database: {e}")
        logger.error(f"General error during database initialization: {str(e)}")
        raise
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

# Generate JWT token
def generate_token(user_id, email):
    try:
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(
            payload,
            os.getenv('JWT_SECRET_KEY'),
            algorithm=os.getenv('JWT_ALGORITHM')
        )
        return token
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        return None

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        # Hash the password
        hashed_password = pbkdf2_sha256.hash(password)

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'error': 'User already exists'}), 409

        # Insert new user
        cur.execute(
            "INSERT INTO users (email, password, first_name, last_name) VALUES (%s, %s, %s, %s) RETURNING id",
            (email, hashed_password, first_name, last_name)
        )
        user_id = cur.fetchone()['id']
        conn.commit()

        # Generate token
        token = generate_token(user_id, email)
        if not token:
            return jsonify({'error': 'Error generating token'}), 500

        return jsonify({
            'message': 'User created successfully',
            'token': token
        }), 201

    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/validate', methods=['GET'])
def validate():
    try:
        # Check JWT token in header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401

        email = payload['email']


        conn = get_db_connection()
        cur = conn.cursor()

        # Get user from database
        cur.execute("SELECT first_name, last_name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        return jsonify({
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'message': 'Valid Token'
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Get user from database
        cur.execute("SELECT id, email, password, first_name, last_name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user or not pbkdf2_sha256.verify(password, user['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate token
        token = generate_token(user['id'], user['email'])
        if not token:
            return jsonify({'error': 'Error generating token'}), 500

        return jsonify({
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'message': 'Login successful',
            'token': token
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

# Middleware to verify JWT token
def verify_token(token):
    try:
        payload = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY'),
            algorithms=[os.getenv('JWT_ALGORITHM')]
        )
        return payload
    except:
        return None

@app.route('/api/historical-data', methods=['GET'])
def get_historical_data():
    try:
        # Check JWT token in header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401

        # Get query parameters
        device_id = request.args.get('device_id')
        timestamp_str = request.args.get('timestamp')
        query_limit = 1000 if request.args.get('query_limit') is None else int(request.args.get('query_limit'))

        if not device_id:
            return jsonify({'error': 'device_id is required'}), 400

        # Parse the timestamp if provided
        query_timestamp = None
        if timestamp_str:
            try:
                query_timestamp = datetime.strptime(timestamp_str, '%m/%d/%Y %I:%M:%S %p')
            except ValueError:
                return jsonify({'error': 'Invalid timestamp format. Use MM/DD/YYYY HH:MM:SS AM/PM'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Modify query based on whether timestamp is provided
        if query_timestamp:
            cur.execute("""
                SELECT
                    device_id,
                    timestamp,
                    gas_meter_volume_instant,
                    gas_meter_volume_setpoint,
                    gas_valve_percent_open,
                    created_at
                FROM gas_meter_data
                WHERE device_id = %s
                AND timestamp > %s
                AND user_email = %s
                ORDER BY timestamp ASC
                LIMIT %s
            """, (device_id, query_timestamp, payload['email'], query_limit))
        else:
            cur.execute("""
                SELECT
                    device_id,
                    timestamp,
                    gas_meter_volume_instant,
                    gas_meter_volume_setpoint,
                    gas_valve_percent_open,
                    created_at
                FROM gas_meter_data
                WHERE device_id = %s
                AND user_email = %s
                ORDER BY timestamp ASC
                LIMIT %s
            """, (device_id, payload['email'], query_limit))

        rows = cur.fetchall()

        # Convert the results to a list of dictionaries
        data = []
        for row in rows:
            converted_timestamp = datetime.fromisoformat(row['timestamp'].isoformat()).strftime("%m/%d/%Y %I:%M:%S %p")
            res = hydrate_detector.process_data_point(converted_timestamp, row['gas_meter_volume_instant'],row['gas_meter_volume_setpoint'],row['gas_valve_percent_open'] )
            hydrate = None
            if res["is_hydrate"] and res["event_status"] == "ALERT: Hydrate formation detected!":
                hydrate = "start"
            if res["is_hydrate"] and res["event_status"] == "Hydrate event ended":
                hydrate = "end"

            data.append({
                'device_id': row['device_id'],
                'timestamp': converted_timestamp,
                'gas_meter_volume_instant': None if math.isnan(float(res['current_metrics']['volume'])) else float(res['current_metrics']['volume']),
                'gas_meter_volume_setpoint': None if math.isnan(float(res['current_metrics']['setpoint'])) else float(res['current_metrics']['setpoint']),
                'gas_valve_percent_open': None if math.isnan(float(res['current_metrics']['valve'])) else float(res['current_metrics']['valve']),
                'created_at': datetime.fromisoformat(row['created_at'].isoformat()).strftime("%m/%d/%Y %I:%M:%S %p"),
                'is_hydration': hydrate
            })

        return jsonify({
            'device_id': device_id,
            'query_timestamp': datetime.fromisoformat(query_timestamp.isoformat()).strftime("%m/%d/%Y %I:%M:%S %p") if query_timestamp else None,
            'total_records': len(data),
            'data': data
        }), 200

    except Exception as e:
        logger.error(f"Error fetching historical data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


@app.route('/api/user/devices', methods=['GET'])
def get_user_devices():
    try:
        # Check JWT token in header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401

        # Extract email from JWT payload
        user_email = payload['email']

        conn = get_db_connection()
        cur = conn.cursor()

        # Get all devices for the user
        cur.execute("""
            SELECT
                id,
                email,
                device_id,
                created_at
            FROM devices
            WHERE email = %s
            ORDER BY created_at DESC
        """, (user_email,))

        rows = cur.fetchall()

        # Format the response
        devices = []
        for row in rows:
            devices.append({
                'id': row['id'],
                'email': row['email'],
                'device_id': row['device_id'],
                'created_at': row['created_at'].strftime('%m/%d/%Y %I:%M:%S %p')
            })

        response = {
            'email': user_email,
            'total_devices': len(devices),
            'devices': devices
        }

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error fetching user devices: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


socketio = SocketIO(app, cors_allowed_origins="*")
init_db()




def send_email(
    to_emails: Union[str, List[str]],
    subject: str,
    message: str,
    sender_email: str = "your-verified-sender@example.com",
    api_key: str = "your-sendgrid-api-key",
    html_content: Optional[str] = None
) -> dict:
    """
    Send an email using SendGrid.

    Args:
        to_emails: Single email address or list of email addresses
        subject: Email subject line
        message: Plain text message content
        sender_email: Verified sender email address
        api_key: SendGrid API key
        html_content: Optional HTML content for the email

    Returns:
        dict: Response containing success status and details

    Raises:
        Exception: If email sending fails
    """
    try:
        # Convert single email to list
        if isinstance(to_emails, str):
            to_emails = [to_emails]

        # Create email message
        email = Mail(
            from_email=Email(sender_email),
            to_emails=[To(email) for email in to_emails],
            subject=subject,
            plain_text_content=Content("text/plain", message)
        )

        # Add HTML content if provided
        if html_content:
            email.content = Content("text/html", html_content)

        # Send email
        sg = SendGridAPIClient(api_key)
        response = sg.send(email)

        return {
            'success': True,
            'status_code': response.status_code,
            'message': 'Email sent successfully'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to send email'
        }

# Store connected clients
authenticated_clients = set()

@socketio.on('authenticate')
def handle_authenticate(data):
    email = data['email']
    password = data['password']
    if not email or not password:
        disconnect()
        return False

    conn = get_db_connection()
    cur = conn.cursor()

    # Verify credentials
    cur.execute("SELECT email, password FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user or not pbkdf2_sha256.verify(password, user['password']):
        logger.error("Password was incorrect")
        disconnect()
        return False

    # Store authenticated client
    try:
        sid = request.sid
        print(sid)
        authenticated_clients.add(sid)
        emit('authentication_success', {'message': 'Successfully authenticated'})
    except Exception as e:
        print(str(e))
    return True


@socketio.on('connect')
def handle_connect():
    sid = request.sid if hasattr(request, 'sid') else request.namespace.socket.sid
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid if hasattr(request, 'sid') else request.namespace.socket.sid
    print('Client disconnected')
    if sid in authenticated_clients:
        authenticated_clients.remove(sid)
    else:
        print('Client not connected')

@socketio.on('data')
def handle_data(data):
    sid = request.sid if hasattr(request, 'sid') else request.namespace.socket.sid
    if sid in authenticated_clients:
        # print(f"Received data: {data}")
        # Validate and extract data fields
        user_email = data['email']
        device_id = data['device_id']


        try:
            timestamp_str = data['Time']
            try:
                # First try datetime.strptime with AM/PM format
                timestamp = datetime.strptime(timestamp_str, '%m/%d/%Y %I:%M:%S %p')
            except ValueError:
                # If that fails, try alternate format without AM/PM
                timestamp = datetime.strptime(timestamp_str, '%m/%d/%Y %H:%M:%S')
            gas_meter_volume_instant = float(data['Inj Gas Meter Volume Instantaneous'])
            gas_meter_volume_setpoint = float(data['Inj Gas Meter Volume Setpoint'])
            gas_valve_percent_open = float(data['Inj Gas Valve Percent Open'])
        except (KeyError, ValueError) as e:
            logger.error(f"Invalid data format: {str(e)}")
            return

        # Store data in database
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert data
        cur.execute("""
            INSERT INTO gas_meter_data (
                device_id,
                user_email,
                timestamp,
                gas_meter_volume_instant,
                gas_meter_volume_setpoint,
                gas_valve_percent_open
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING created_at
        """, (
            device_id,
            user_email,
            timestamp,
            gas_meter_volume_instant,
            gas_meter_volume_setpoint,
            gas_valve_percent_open
        ))


        cur.execute("""
        INSERT INTO devices (device_id, email)
        SELECT %s, %s
        WHERE NOT EXISTS (
            SELECT 1 FROM devices
            WHERE device_id = %s AND email = %s
        );
        """, (device_id, user_email, device_id, user_email))

        is_hydrate, message = hydrate_detector.detect_hydrate_formation(gas_meter_volume_instant, gas_valve_percent_open, timestamp)
        hydrate = None
        if is_hydrate and message == "ALERT: Hydrate formation detected!":
            hydrate = "start"
        if is_hydrate and message == "Hydrate event ended":
            hydrate = "end"

        if hydrate == "start":
            print("Calling Message queue to send out email")


        conn.commit()
        conn.close()


    else:
        print("Not authenticated")

if __name__ == '__main__':
    socketio.run(app, debug=True)