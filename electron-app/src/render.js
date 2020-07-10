const { desktopCapturer, remote } = require('electron');

const { writeFile, readFileSync } = require('fs');

const { dialog, Menu } = remote;

const { Kafka, logLevel } = require('kafkajs')

const crypto = require('crypto')

let msgKey = "grupo_1";
var loc = window.location.pathname;
var dir = loc.substring(0, loc.lastIndexOf('/'));
let pem_file = readFileSync(`${dir}/root.pem`, 'utf-8');

let topic = 'my-topic';
let partitionNumber = 2n;

const MyPartitioner = () => {
    return ({ topic, partitionMetadata, message }) => {
      let shasum = crypto.createHash('sha1');
      shasum.update(message.key);
      let group = Number(BigInt("0x" + shasum.digest('hex')) % partitionNumber);
      return group
    }
}

const kafka = new Kafka({
  clientId: 'camera-producer',
  brokers: ['bootstrap.devreus:443'],
  logLevel: logLevel.ERROR,
  ssl: {
    rejectUnauthorized: true,
    ca: pem_file
  }
});

const producer = kafka.producer({ createPartitioner: MyPartitioner })

// Function to connect to the cluster
const run = async () => {
  await producer.connect()
}
const stop = async () => {
  await producer.disconnect()
}

const blobToBase64 = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function () {
      resolve(reader.result);
    };
  });
};

const sendMessage = (key, msg) => {
  return producer
    .send({
      topic,
      messages: [
        { key, value: JSON.stringify(msg) },
      ],
    })
    .catch(e => console.error(`[sendMessage/producer] ${e.message}`, e))
}


// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

var desktopVideoInterval = null;
var imageCapture = null;

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  // start the producer
  run().catch(e => console.error(`[example/producer] ${e.message}`, e))
  desktopVideoInterval = setInterval(() => {
    console.log("Message sent");
    captureBitmapFrame(imageCapture)
  }, 700);
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  clearInterval(desktopVideoInterval);
  // Stop the producer
  stop().catch(e => console.error(`[stop/producer] ${e.message}`, e))
  if (mediaRecorder.state === 'recording') { 
    mediaRecorder.stop();
  }
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
  desktopVideoInterval = null;
  imageCapture = null;
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

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

// Change the videoSource window to record
async function selectSource(source) {

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;


  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  const desktopTrack = stream.getVideoTracks()[0];
  imageCapture = new ImageCapture(desktopTrack);
  // Updates the UI
}

// Function to capture frame from videostream
function captureBitmapFrame(imageCapture) {
   imageCapture.grabFrame()
  .then(function(imageBitmap) {
    return new Promise(res => {
      // create a canvas
      const canvas = document.createElement('canvas');
      // resize it to the size of our ImageBitmap
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      // try to get a bitmaprenderer context
      let ctx = canvas.getContext('bitmaprenderer');
      if(ctx) {
        // transfer the ImageBitmap to it
        ctx.transferFromImageBitmap(imageBitmap);
      }
      else {
        // in case someone supports createImageBitmap only
        // twice in memory...
        canvas.getContext('2d').drawImage(img,0,0);
      }
      // get it back as a Blob
      canvas.toBlob(res, "image/jpeg", 0.95);
    });
  })
  .then(blob => {
    blobToBase64(blob).then( b64 => sendMessage(msgKey, b64) );
  })
  .catch(function(error) {
    console.log('grabFrame() error: ', error);
  });
}
