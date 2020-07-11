const crypto = require('crypto')

const { Kafka, logLevel, AssignerProtocol: { MemberMetadata } } = require('kafkajs');

const { readFileSync } = require('fs');

const { AssignerProtocol: { MemberAssignment } } = require('kafkajs');

let pem_file = readFileSync(`./root.pem`, 'utf-8');
let topic = 'my-topic';
let groupId = 'grupo_1';

// Calculate the digest of the groupId
let digest = BigInt('0x' + crypto.createHash('sha1').update(groupId).digest('hex'));


const MyPartitionAssigner = ({ cluster }) => ({
      name: 'MyPartitionAssigner',

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


const consumer = kafka.consumer({
    groupId: 'grupo_1',
    partitionAssigners: [
        MyPartitionAssigner,
    ]
});

const run = async () => {
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

run().catch(e => console.error(`[start/consumer] ${e.message}`, e))

