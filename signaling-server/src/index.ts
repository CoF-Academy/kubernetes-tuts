import { LoadBalancer } from  './loadbalancer/loadbalancer'
import * as http from "http"
import ioserver, { Socket } from 'socket.io';

const server = http.createServer()

interface CustomSocket extends Socket {
  id: string
  other_id: string | null
}

type LoginData = {
  id: string
}

type OfferData = {
  id: string
  offer: object
}

type AnswerData = {
  id: string
  answer: object
}

type CandidateData = {
  id: string
  candidate: object
}

type LeaveData = {
  id: string
  candidate: object
}


let users:  { [id: string] : CustomSocket} = {};

const io = ioserver(server);

// This is only to test loadbalancing
let room_names = ['grupo_1', 'grupo_2', 'grupo_3'];

let loadbalancer = new LoadBalancer(room_names, 30)

// Authenticate the user
io.use((socket, next) => {
  let clientId = socket.handshake.headers['x-clientid'];
  return next();
  // return next(new Error('authentication error'));
});

io.on('connection', client => {
  let room_id = loadbalancer.getGroup();
  client.join(room_id.toString());
  io.to(client.id).emit('message', `Hola ${client.id}, bienvenido al room ${room_id}`);

  client.on('login', login_data => {
    login(client as CustomSocket, login_data);
    // client.emit('login', 'can you hear me?', 1, 2, 'abc');
  });

  client.on('offer', offer_data => {
    offer(client as CustomSocket, offer_data);
  });

  client.on('answer', answer_data => {
    answer(client as CustomSocket, answer_data);
  });

  client.on('candidate', candidate_data => {
    answer(client as CustomSocket, candidate_data);
  });

  client.on('leave', leave_data => {
    leave(client as CustomSocket, leave_data);
  });

  client.on('disconnecting', () => {
    let client_rooms = Object.keys(client.adapter.sids[client.id]);
    client_rooms.shift();
    client_rooms.forEach(room_name => loadbalancer.incrementByName(room_name));
    console.log(loadbalancer.getAllRoomsCopy());
    disconnect(client as CustomSocket);
    console.log(`Client ${client.id} disconnected`);
  });
});

function login(client: CustomSocket, login_data: LoginData) {
  console.log(`User ${login_data.id} has logged in`);
  if (users[login_data.id]) {
    client.send({type: 'login', success: false });
  } else {
      users[login_data.id] = client;
      client.id = login_data.id;
      client.send({ type: 'login', success: true });
  }
}

function offer(client: CustomSocket, offer_data: OfferData) {
  console.log(`Sending offer to ${offer_data.id}`)
  let otherClient = users[offer_data.id];
  if (otherClient != null) {
    otherClient.other_id = offer_data.id
    otherClient.send({
      type: 'offer',
      offer: offer_data.offer,
      name: client.id
    });
  }
}

function answer(client: CustomSocket, answer_data: AnswerData) {
  let otherClient = users[answer_data.id];
  console.log(`Sending answer to ${answer_data.id}`);
  if (otherClient != null) {
      otherClient.other_id = answer_data.id;
      otherClient.send({
        type: 'answer',
        from: otherClient.id,
        answer: answer_data.answer
      });
  }
}

function candidate(client: CustomSocket, candidate_data: CandidateData) {
  console.log(`Sending candidate to ${candidate_data.id}`);
  let otherClient = users[candidate_data.id];
  if (otherClient != null) {
    otherClient.send({
        type: 'candidate',
        candidate: candidate_data.candidate
    });
  }
}

function leave(client: CustomSocket, leave_data: LeaveData) {
  console.log(`Disconnecting user from ${leave_data.id}`);
  let otherClient = users[leave_data.id];
  if (otherClient != null) {
    otherClient.other_id = null;
    otherClient.send({
      type: 'leave'
    });
  }
}

function disconnect(client: CustomSocket) {
  if (client.id) {
    delete users[client.id];

    if (client.other_id) {
      console.log(`Disconnecting user from ${client.other_id}`);
      let otherClient = users[client.other_id];

      if (otherClient != null) {
        otherClient.other_id = null;
        otherClient.send({
          type: 'leave'
        });
      }
    }
  }
}

server.listen(3000);
