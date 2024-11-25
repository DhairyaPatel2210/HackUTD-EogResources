#!/usr/bin/env python
import pika, sys, os, json
from datetime import datetime
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import socket
import docker

def send_email(message_dict):
    # Get the current date and time
    to_email = message_dict['email']

    current_datetime = datetime.now()

    # Format date and time together
    formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gas Meter Data</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 20px;
            }}
            h1 {{
                color: #333;
            }}
            .data-container {{
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 8px;
                background-color: #f9f9f9;
                width: 350px;
            }}
            .data-container p {{
                margin: 8px 0;
            }}
            .label {{
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <h1>Gas Meter Data</h1>
        <div class="data-container">
            <p><span class="label">Email:</span> <span id="email">{to_email}</span></p>
            <p><span class="label">Gas Meter Volume (Instant):</span> <span id="gas_meter_volume_instant">{message_dict['gas_meter_volume_instant']}</span></p>
            <p><span class="label">Gas Valve Open (%):</span> <span id="gas_valve_percent_open">{message_dict['gas_valve_percent_open']}</span></p>
            <p><span class="label">Timestamp:</span> <span id="timestamp">{message_dict['timestamp']}</span></p>
            <p><span class="label">Device ID:</span> <span id="device_id">{message_dict['device_id']}</span></p>
        </div>
    </body>
    </html>
    """

    message = Mail(
    from_email=os.getenv('SENDGRID_FROM_EMAIL'),
    to_emails=to_email,
    subject=f'Hydrate is being Caused at {formatted_datetime}',
    html_content=html_content)
    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        if 200 <= int(response.status_code) <= 299:
            print(f"{datetime.now()} - Sent Email to {to_email}")
    except Exception as e:
        print(f"{datetime.now()} - Error generate while sending email to {to_email}")

def main():
    print("Rabbit Port Value found : ", os.getenv('RABBIT_PORT'))
    print("Rabbit Host Value found : ", os.getenv('RABBIT_HOST'))
    try:
        if os.getenv('RABBIT_PORT') != None:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.getenv('RABBIT_HOST'), port=int(os.getenv('RABBIT_PORT'))))
        else:
            connection = pika.BlockingConnection(
                        pika.ConnectionParameters(host=os.getenv('RABBIT_HOST')))
        print(f"({datetime.now()})(connection) : Connection successfull to rabbitmq")
    except Exception as e:
        raise e
    
    channel = connection.channel()

    channel.queue_declare(queue='email')

    def callback(ch, method, properties, body):
        message_dict = json.loads(body.decode('utf-8'))
        send_email(message_dict)

    channel.basic_consume(queue='email', on_message_callback=callback, auto_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()

if __name__ == '__main__':
    try:
        print("Inside the email worker")
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
    except Exception as e:
        print(f"Error in Worker : {e}")