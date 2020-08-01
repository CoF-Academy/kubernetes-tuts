let mediaRecorder;

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
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(1000);
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  mediaRecorder = null;
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    console.log('handleDataAvailable', event.data.size);
    // recordedBlobs.push(event.data);
  }
}
