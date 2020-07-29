"use strict";

const server = require('http').createServer();
const io = require('socket.io')(server);

// Authenticate the user
io.use((socket, next) => {
  let clientId = socket.handshake.headers['x-clientid'];
  return next();
  // return next(new Error('authentication error'));
});

let clients_per_room = 1;

let rooms = {};

function init_rooms() {
  let rooms_names = ['grupo_1', 'grupo_2', 'grupo_3']
  for (const name of rooms_names) {
    const room = io.sockets.in(name);
    rooms[name] = {count: 0};
  }
}

function assign_room(client, fx) {
  let client_assigned = false;
  let room_id;
  while (!client_assigned) {
    room_id = fx(client);
    console.log(room_id);
    let room = rooms[room_id];
    if (room.count < clients_per_room) {
      client.join(room_id);
      room.count++;
      console.log(rooms);
      client_assigned = true;
    }
  }
  return room_id;
}

init_rooms();
io.on('connection', client => {
  let rooms_keys = Object.keys(rooms);
  let random_room = rooms_keys[Math.floor(Math.random() * rooms_keys.length)];
  let room_id = assign_room(client, client => random_room);
    let client_rooms = Object.keys(client.adapter.sids[client.id]);
    console.log(client_rooms);

  // assign_room(client, client => rooms[Math.floor(Math.random() * rooms.length)]);
  // client.to(groups[0]).emit('message');
  // console.log(Object.keys(client.adapter.sids[client.id]));
  // console.log(io.sockets.clients());
  // io.to(client.metadata.room_id).emit('message', `Hi ${client.id}`);
  // console.log(Object.keys(io.sockets.sockets));
  io.to(client.id).emit('message', `Hola ${client.id}, bienvenido al room ${room_id}`);
  client.on('disconnecting', () => {
    // console.log(`Client ${client.id} disconnected`);

    let client_rooms = Object.keys(client.rooms);
    client_rooms.shift();
    for (const room_id of client_rooms) {
     rooms[room_id].count--;
    }
    console.log(rooms);
  });
});

server.listen(3000);

