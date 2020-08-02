const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;
const socket = require('socket.io-client')('http://localhost:3000');
const streamSaver = require('./stream_saver');

var loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    callPage = document.querySelector('#call-page'),
    theirUsernameInput = document.querySelector('#their-username'),
    callButton = document.querySelector('#call'),
    hangUpButton = document.querySelector('#hang-up'),
    sendButton = document.querySelector('#send'),
    messageInput = document.querySelector('#message'),
    received = document.querySelector('#received');

var name, connectedUser;

let mediaSource;

var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, connectedUser, stream;


var dataChannel;


function onDataChannel() {
  console.log("On data channel");
    dataChannel.onerror = function (error) {
    console.log("Data Channel Error:", error);
  };

  dataChannel.onmessage = function (event) {
    console.log("Got Data Channel Message:", event.data);

    received.innerHTML += "recv: " + event.data + "<br />";
    received.scrollTop = received.scrollHeight;
  };

  dataChannel.onopen = function () {
    dataChannel.send(name + " has connected.");
  };

  dataChannel.onclose = function () {
    console.log("The Data Channel is Closed");
  };
}


// Bind our text input and received area
sendButton.addEventListener("click", function (event) {
  let val = messageInput.value;
  received.innerHTML += "send: " + val + "<br />";
  received.scrollTop = received.scrollHeight;
  console.log("Chat message sent");
  dataChannel.send(val);
});

const videoSelectBtn = document.getElementById('videoSelectBtn');

videoSelectBtn.onclick = async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });


  let videoSources = await navigator.mediaDevices.enumerateDevices().then(function (devices) {
    return devices.filter(device => device.kind === 'videoinput').map(dev => ({id: dev.id, name: dev.label}));
  });


  inputSources.push(...videoSources);


  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );
  videoOptionsMenu.popup();
}

async function selectSource(source) {
  mediaSource = source;
}



callPage.style.display = "none";

// Login when the user clicks the button
loginButton.addEventListener("click", function (event) {
  name = usernameInput.value;


  if (name.length > 0) {
    send({
      type: "login",
      name: name
    });
  }
});


function startConnection() {
  if (hasUserMedia()) { 
    let constrains = { 
      audio: false, 
      video: {
        width: { exact: 320 },
        height: { exact: 240 },
        frameRate: 20,
        deviceId: mediaSource.id
      }
    };
    navigator.mediaDevices.getUserMedia(constrains)
      .then(function (myStream) {
      // let videoTrack = myStream.getVideoTracks()[0];
      // console.log(videoTrack.getSettings());
      stream = myStream;
      yourVideo.srcObject = stream;

      // Save stream
      streamSaver(stream);

      if (hasRTCPeerConnection()) {
        setupPeerConnection(stream);
      } else {
        alert("Sorry, your browser does not support WebRTC.");
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}


function setupPeerConnection(stream) {
  console.log("Starting peer connection");
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
  };
  yourConnection = new RTCPeerConnection(configuration,  {optional: [{RtpDataChannels: true}]});

  // Setup stream listening
  yourConnection.addStream(stream);
  yourConnection.onaddstream = function (e) {
    theirVideo.srcObject = e.stream;
  };

  // Setup ice handling
  yourConnection.onicecandidate = function (event) {
    if (event.candidate) {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

   openDataChannel();
}


function openDataChannel() {
  var dataChannelOptions = {
    reliable: true
  };
  dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions);

  dataChannel.onerror = function (error) {
    console.log("Data Channel Error:", error);
  };

  dataChannel.onmessage = function (event) {
    console.log("Got Data Channel Message:", event.data);

    received.innerHTML += event.data + "<br />";
    received.scrollTop = received.scrollHeight;
  };

  dataChannel.onopen = function () {
    dataChannel.send(name + " has connected.");
  };

  dataChannel.onclose = function () {
    console.log("The Data Channel is Closed");
  };
}


function hasUserMedia() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}

function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    loginPage.style.display = "none";
    callPage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
};


callButton.addEventListener("click", function () {
  var theirUsername = theirUsernameInput.value;

  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});


hangUpButton.addEventListener("click", function () {
  send({
    type: "leave"
  });

  onLeave();
});

function onLeave() {
  connectedUser = null;
  theirVideo.src = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  yourConnection.onaddstream = null;
  // Set the connection again to change it to open state
  setupPeerConnection(stream);
};

function startPeerConnection(user) {
  connectedUser = user;

  // Begin the offer
  yourConnection.createOffer(function (offer) {
    send({
      type: "offer",
      offer: offer
    });
    yourConnection.setLocalDescription(offer);
  }, function (error) {
    alert("An error has occurred.");
  });
};

function onOffer(offer, name) {
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

  yourConnection.createAnswer(function (answer) {
    yourConnection.setLocalDescription(answer);
    send({
      type: "answer",
      answer: answer
    });
  }, function (error) {
    alert("An error has occurred");
  });
};

function onAnswer(answer) {
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate) {
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

socket.on('connect', conn =>  {
  console.log("Connected");
});


socket.on('message', message =>  {
  console.log("Got message");
  let data = JSON.parse(message);

  switch(data.type) {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
});


socket.on('error', error =>  {
  console.log(`Error ${error}`);
});

function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }

  socket.send(JSON.stringify(message));
  console.log("message sent");
};

