const fs = require('fs');
const { Kafka, logLevel } = require('kafkajs')
const crypto = require('crypto')


const kafka = new Kafka({
  clientId: 'camera-producer',
  brokers: ['bootstrap.devreus:443'],
  logLevel: logLevel.ERROR,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./root.pem', 'utf-8')
  }
});

let topic = 'my-topic';

const MyPartitioner = () => {
    return ({ topic, partitionMetadata, message }) => {
      let shasum = crypto.createHash('sha1');
      shasum.update(message.key);
      let group = Number(BigInt("0x" + shasum.digest('hex')) % 2n);
      console.log(group)
      return group
    }
}

const producer = kafka.producer({ createPartitioner: MyPartitioner })

const sendMessage = () => {
  return producer
    .send({
      topic,
      messages: [
        { key: 'grupo_2',value: 'Sin funciono' },
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
