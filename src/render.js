const { desktopCapturer, remote } = require('electron');

const { writeFile } = require('fs');

const { dialog, Menu } = remote;

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
  document.getElementById('stopBtn').style.display = "inline-block";
  document.getElementById('rec_now').style.display = "flex";
  document.getElementById('startBtn').style.display = "none";
  timeReset();
  timeStart();
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
  document.getElementById('startBtn').style.display = "inline-block";
  document.getElementById('stopBtn').style.display = "none";
  document.getElementById('rec_now').style.display = "none";
  timeStop();
};

document.getElementById('stopBtn').style.display = "none";
document.getElementById('rec_now').style.display = "none";
document.getElementById('startBtn').style.display = "none";

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

  videoSelectBtn.innerText = 'Source: ' + source.name;
  document.getElementById('startBtn').style.display = "inline-block";

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

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  document
  .getElementById("recording_video")
  .classList.remove("no_selected_video");

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `recording-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('Video saved successfully!'));
  }

}

// Timer
const watch = document.querySelector("#stopwatch");
let millisecound = 0;
let timer;
function timeStart(){
  clearInterval(timer);
  timer = setInterval(() => {
    millisecound += 10;
    let dateTimer = new Date(millisecound);
    watch.innerHTML = 
    ('0'+dateTimer.getUTCHours()).slice(-2) + ':' +
    ('0'+dateTimer.getUTCMinutes()).slice(-2) + ':' +
    ('0'+dateTimer.getUTCSeconds()).slice(-2) + ':' +
    ('0'+dateTimer.getUTCMilliseconds()).slice(-3,-1);
  }, 10);
}
function timeReset(){
  setInterval(timer)
  millisecound = 0;
  watch.innerHTML = "00:00:00:00";
}
