from kafka import KafkaConsumer
from kafka import TopicPartition
import hashlib
import sys

# Fire up the Kafka Consumer
topic = "my-topic"
brokers = ["bootstrap.devreus:443"]

group = int(hashlib.sha1(f"{sys.argv[1]}".encode("utf-8")).hexdigest(), 16) % (2)

print(group)

consumer = KafkaConsumer(
    bootstrap_servers=brokers,
    security_protocol='SSL',
    ssl_cafile='root.pem',
    ssl_password='password')
#  auto_offset_reset='smallest')

consumer.assign([TopicPartition(topic, group)])


def get_video_stream():
    for msg in consumer:
        print(msg)


if __name__ == "__main__":
    get_video_stream()
