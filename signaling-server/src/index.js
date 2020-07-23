const server = require('http').createServer();
const io = require('socket.io')(server);

users = {};

// Authenticate the user
io.use((socket, next) => {
  let clientId = socket.handshake.headers['x-clientid'];
  console.log(clientId);
  return next();
  // return next(new Error('authentication error'));
});

groups = ['grupo_1', 'grupo_2']

io.on('connection', client => {
  client.join(groups[0]);
  client.to(groups[0]).emit('message');
  io.to('grupo_1').emit('message', `Hi ${client.id}`);

  client.on('disconnect', () => { console.log(`Client ${client.id} disconnected`) });
});

server.listen(3000);

