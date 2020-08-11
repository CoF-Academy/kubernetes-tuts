import { LoadBalancer } from  './loadbalancer/loadbalancer'
import * as http from "http"
import ioserver, { Socket } from 'socket.io';

const server = http.createServer()

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
  
  console.log(loadbalancer.getAllRoomsCopy());
  client.on('disconnecting', () => {
    let client_rooms = Object.keys(client.adapter.sids[client.id]);
    client_rooms.shift();
    client_rooms.forEach(room_name => loadbalancer.incrementByName(room_name));
    console.log(loadbalancer.getAllRoomsCopy());
    console.log(`Client ${client.id} disconnected`);
  });
});

server.listen(3000);
