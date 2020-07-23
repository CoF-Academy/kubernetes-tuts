const io = require("socket.io-client");

const socket = io('http://localhost:3000', {
  transportOptions: {
    polling: {
      extraHeaders: {
        'x-clientid': 'abc'
      }
    }
  }
});


socket.on('message', (data) => {
  console.log(data);
});


