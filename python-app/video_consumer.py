from flask import Flask, Response
from kafka import KafkaConsumer
from kafka import TopicPartition
import base64
import time
import hashlib


# Fire up the Kafka Consumer
topic = "my-topic"
brokers = ["bootstrap.devreus:443"]

group = int(hashlib.sha1(f"{sys.argv[1]}".encode("utf-8")).hexdigest(), 16) % (2)

consumer = KafkaConsumer(
    bootstrap_servers=brokers,
    security_protocol='SSL',
    ssl_cafile='root.pem',
    ssl_password='password')

consumer.assign([TopicPartition(topic, group)])

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
    for msg in consumer:
        stripped = msg.value.strip(b'"')
        print(msg.key)
        if stripped.startswith(b'data:'):
            img = base64.b64decode(stripped.partition(b'base64,')[-1])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpg\r\n\r\n' + img + b'\r\n\r\n')

        time.sleep(.3)


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
