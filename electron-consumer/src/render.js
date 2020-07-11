const { desktopCapturer, remote } = require('electron');

const { writeFile, readFileSync } = require('fs');

const { dialog, Menu } = remote;

const { Kafka, logLevel, AssignerProtocol: { MemberMetadata, MemberAssignment } } = require('kafkajs')

const crypto = require('crypto')


var loc = window.location.pathname;
// Kafka
var dir = loc.substring(0, loc.lastIndexOf('/'));
let pem_file = readFileSync(`${dir}/root.pem`, 'utf-8');
let topic = 'my-topic';
var consumer;
var groupId = null;

function calculateHash(groupId) {
  return BigInt('0x' + crypto.createHash('sha1').update(groupId).digest('hex'));
}

const MyPartitionAssigner = ({ cluster }) => ({
    name: 'CustomPartitionerAssigner',
    version: 1,
    async assign({ members, topics }) {
        const membersCount = members.length
        const assignment = {}
        const sortedMembers = members.map(({ memberId }) => memberId).sort()
        
        sortedMembers.forEach(memberId => {
          assignment[memberId] = {}
        })
        
        // Get partitions of topic
        const partitionMetadata = cluster.findTopicPartitionMetadata(topic)
        const partitions = partitionMetadata.map(m => m.partitionId)
        // Calculate the partition id
        let digest = calculateHash(groupId);
        let partitionId = Number(digest % BigInt(partitions.length));
        sortedMembers.forEach((memberId, i) => {
          if (!assignment[memberId][topic]) {
            assignment[memberId][topic] = []
          }
          assignment[memberId][topic].push(partitionId)
        })
        console.log(assignment);
        let arr =  Object.keys(assignment).map(memberId => ({
            memberId,
            memberAssignment: MemberAssignment.encode({
                version: this.version,
                assignment: assignment[memberId],
            })
        }));
      return arr;
    },

    protocol({ topics }) {
        return {
            name: this.name,
            metadata: MemberMetadata.encode({
            version: this.version,
            topics,
            }),
        }
    }
});

const kafka = new Kafka({
  clientId: 'camera-consumer',
  brokers: ['bootstrap.devreus:443'],
  logLevel: logLevel.ERROR,
  ssl: {
    rejectUnauthorized: true,
    ca: pem_file
  }
});


const run = async () => {
    groupId = document.getElementById('groupId').value;
    consumer = kafka.consumer({
      groupId,
      partitionAssigners: [
          MyPartitionAssigner,
      ]
  });
  await consumer.connect();
  await consumer.subscribe({ topic });
  await consumer.run({
      eachMessage: async ({ msgTopic, partition, message }) => {
          console.log({
              key: message.key.toString(),
              // value: message.value.toString(),
          })
      },
  })
}

const stop = async () => {
  await consumer.disconnect()
}

// HTML queries
const mainDiv = document.getElementsByClassName("main");
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

startBtn.onclick = e => {
  // start the consumer
  const groupId = document.getElementById('groupId').value;
  run().catch(e => console.error(`[stop/consumer] ${e.message}`, e))
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recieving';
};


stopBtn.onclick = e => {
  // Stop the producer
  stop().catch(e => console.error(`[stop/consumer] ${e.message}`, e))
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};
