const { desktopCapturer, remote } = require('electron');

const { writeFile, readFileSync } = require('fs');

const { dialog, Menu } = remote;

const { Kafka, logLevel } = require('kafkajs')

const { ProducerStream } = require('kafkajs-stream');

const { rxToStream } = require('rxjs-stream');

const Jimp = require('jimp');


var loc = window.location.pathname;
var dir = loc.substring(0, loc.lastIndexOf('/'));


let topic = 'my-topic';
const kafka = new Kafka({
  clientId: 'camera-producer',
  brokers: ['bootstrap.devreus:443'],
  logLevel: logLevel.DEBUG,
  ssl: {
    rejectUnauthorized: true,
    ca: readFileSync(`${dir}/root.pem`, 'utf-8')
  }
});

const producerStream = new ProducerStream(kafka, { topic });


// Function to connect to the cluster
// const run = async () => {
//   await producer.connect()
// }
// const stop = async () => {
//   await producer.disconnect()
// }
// const sendMessage = (msg) => {
//   return producer
//     .send({
//       topic,
//       messages: [
//         { value: msg },
//       ],
//     })
//     .then(console.log)
//     .catch(e => console.error(`[example/producer] ${e.message}`, e))
// }


// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');


const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
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
    frameRate: { max: 5 },
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
  let imageCapture = new ImageCapture(desktopTrack);

  setInterval(() => {
    captureBitmapFrame(imageCapture)
  }, 700);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

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
      canvas.toBlob(res);
    });
  })
  .then(blob => {
    console.log(blob);
  })
  .catch(function(error) {
    console.log('grabFrame() error: ', error);
  });
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  // sendMessage("k");
  // recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  console.log("Stopped");
  // const blob = new Blob(recordedChunks, {
  //   type: 'video/webm; codecs=vp9'
  // });
  //
  // const buffer = Buffer.from(await blob.arrayBuffer());
  //
  // const { filePath } = await dialog.showSaveDialog({
  //   buttonLabel: 'Save video',
  //   defaultPath: `vid-${Date.now()}.webm`
  // });
  //
  // if (filePath) {
  //   writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  // }

}
