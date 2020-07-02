import datetime
from flask import Flask, Response
from kafka import KafkaConsumer
import base64
import time


# Fire up the Kafka Consumer
topic = "my-topic"
brokers = ["bootstrap.devreus:443"]


consumer = KafkaConsumer(
    topic,
    bootstrap_servers=brokers,
    security_protocol='SSL',
    ssl_cafile='root.pem',
    ssl_password='password')
#  auto_offset_reset='smallest')


# Set the consumer in a Flask App
app = Flask(__name__)


@app.route('/video', methods=['GET'])
def video():
    """
    This is the heart of our video display. Notice we set the mimetype to
    multipart/x-mixed-replace. This tells Flask to replace any old images with
    new values streaming through the pipeline.
    """
    return Response(
        get_video_stream(),
        mimetype='multipart/x-mixed-replace; boundary=frame')


def get_video_stream():
    """
    Here is where we recieve streamed images from the Kafka Server and convert
    them to a Flask-readable format.
    """
    #  while True:
    #      img = base64.b64decode(value.partition(b'base64,')[-1])
    #      yield (b'--frame\r\n'
    #             b'Content-Type: image/jpg\r\n\r\n' + img + b'\r\n\r\n')
    for msg in consumer:
        stripped = msg.value.strip(b'"')
        if stripped.startswith(b'data:'):
            img = base64.b64decode(stripped.partition(b'base64,')[-1])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpg\r\n\r\n' + img + b'\r\n\r\n')

        time.sleep(.3)

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
