const server = require('http').createServer();
const io = require('socket.io')(server);

users = {};

io.on('connection', client => {
  client.on('message', data => {  
    console.log("Recieved message");
    let jsonBody;
    try {
      jsonBody = JSON.parse(data);
    } catch (e) {
      jsonBody = {};
    }
    switch(jsonBody.type) {
      case 'login':
        login(client, jsonBody);
        break;
      case 'offer':
        offer(client, jsonBody);
        break;
      case 'answer':
        answer(client, jsonBody);
        break;
      case 'candidate':
        candidate(client, jsonBody);
        break;
      case 'leave':
        leave(client, jsonBody);
        break;
      default: 
        sendTo(client, {
          type: 'error',
          message: `Unrecognized command ${data.type}`
        });
  
    }
  });
  client.on('disconnect', () => { disconnect(client) });
});
server.listen(3000);

function offer(client, data) {
  console.log(`Sending offer to ${data.name}`)
  otherClient = users[data.name];
  if (otherClient != null) {
    otherClient.otherName = data.name
    sendTo(otherClient, {
      type: 'offer',
      offer: data.offer,
      name: client.name
    });
  }
}

function candidate(client, data) {
  console.log(`Sending candidate to ${data.name}`);
  let otherClient = users[data.name];
  if (otherClient != null) {
      sendTo(otherClient, {
        type: 'candidate',
        candidate: data.candidate
    });
  }
}

function answer(client, data) {
  let otherClient = users[data.name];
  console.log(`Sending answer to ${data.name}`);
  if (otherClient != null) {
      otherClient.otherName = data.name;
      sendTo(otherClient, {
        type: 'answer',
        from: otherClient.name,
        answer: data.answer
      });
  }
}

function login(client, data) {
  console.log(`User logged in as ${data.name}`);
  if (users[data.name]) {
    sendTo(client, {
      type: 'login',
      success: false
    });
  } else {
      users[data.name] = client;
      client.name = data.name;
      sendTo(client, {
      type: 'login',
      success: true
    });
  }
}

function leave(client, data) {
  console.log(`Disconnecting user from ${data.name}`);
  let otherClient = users[data.name];
  otherClient.otherName = null;
  if (conn != null) {
    sendTo(otherClient, {
      type: 'leave'
    });
  }
}

function disconnect(client) {
  if (client.name) {
    delete users[client.name];

    if (client.otherName) {
      console.log(`Disconnecting user from ${client.otherName}`);
      let otherClient = users[client.otherName];
      otherClient.otherName = null;

      if (otherClient != null) {
        sendTo(otherClient, {
          type: 'leave'
        });
      }
    }
  }
}

function sendTo(client, message) {
  client.send(JSON.stringify(message));
}
