const fs = require('fs');
const { Kafka, logLevel } = require('kafkajs')
const screencapture = require('screencapture')


const kafka = new Kafka({
  clientId: 'camera-producer',
  brokers: ['bootstrap.dev:443'],
  logLevel: logLevel.DEBUG,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./root.pem', 'utf-8')
  }
});

let topic = 'my-topic';
const producer = kafka.producer()

const sendMessage = () => {
  return producer
    .send({
      topic,
      messages: [
        { value: 'Hello KafkaJS user!' },
      ],
    })
    .then(console.log)
    .catch(e => console.error(`[example/producer] ${e.message}`, e))
}

const run = async () => {
  await producer.connect()
  sendMessage()
  // setInterval(sendMessage, 3000)
}

run().catch(e => console.error(`[example/producer] ${e.message}`, e))

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async () => {
    try {
      console.log(`process.on ${type}`)
      await producer.disconnect()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  })
})

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await producer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})
