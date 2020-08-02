const fs = require('fs');

let mediaRecorder;
let wstream;

module.exports = function (stream) {
  let options = {mimeType: 'video/webm;codecs=vp9,opus'};
  // if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  //   console.error(`${options.mimeType} is not supported`);
  //   options = {mimeType: 'video/webm;codecs=vp8,opus'};
  //   if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  //     console.error(`${options.mimeType} is not supported`);
  //     options = {mimeType: 'video/webm'};
  //     if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  //       console.error(`${options.mimeType} is not supported`);
  //       options = {mimeType: ''};
  //     }
  //   }
  // }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
    wstream = fs.createWriteStream('/tmp/myBinaryFile');
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(1000);
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  wstream.end();
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    event.data.arrayBuffer().then(buffer => wstream.write(new Buffer(buffer)));
  }
}
