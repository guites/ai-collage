// declare global variable
let video = null; // video element
let detector = null; // detector object
let detections = []; // store detection result
let videoVisibility = true;
let detecting = false;

// global HTML element
const toggleVideoEl = document.getElementById("toggleVideoEl");
const toggleDetectingEl = document.getElementById("toggleDetectingEl");
const cropsWrapper = document.getElementById("snapshots");
const collageWrapper = document.getElementById("collage-wrapper");
const collageSnapshots = document.getElementById("collage-snapshots");
const createCollageBtn = document.getElementById("create-collage-btn");
const catNameEl = document.getElementById("cat-name");
const catNameHeadingEl = document.getElementById("cat-name-heading");

// initializes the masonry for the collage
const msnry = new Masonry(collageSnapshots, {
  itemSelector: ".cat-snapshot",
  columnWidth: 205,
});

// set cursor to wait until video elment is loaded
document.body.style.cursor = "wait";

// The preload() function if existed is called before the setup() function
function preload() {
  // create detector object from "cocossd" model
  detector = ml5.objectDetector("cocossd");
  console.log("detector object is loaded");
}

// The setup() function is called once when the program starts.
function setup() {
  // create canvas element with 640 width and 480 height in pixel
  const canvas = createCanvas(640, 480);
  canvas.parent("canvasWrapper");
  // Creates a new HTML5 <video> element that contains the audio/video feed from a webcam.
  // The element is separate from the canvas and is displayed by default.
  video = createCapture(VIDEO);
  video.parent("videoWrapper");
  video.size(640, 480);
  console.log("video element is created");
  video.elt.addEventListener("loadeddata", function () {
    // set cursor back to default
    if (video.elt.readyState >= 2) {
      document.body.style.cursor = "default";
      console.log(
        'video element is ready! Click "Start Detecting" to see the magic!'
      );
    }
  });
}

// the draw() function continuously executes until the noLoop() function is called
function draw() {
  if (!video || !detecting) return;
  // draw video frame to canvas and place it at the top-left corner
  // image(video, 0, 0);
  background(0, 0, 0);
  // draw all detected objects to the canvas
  for (let i = 0; i < detections.length; i++) {
    const detection = detections[i];
    if (detection.label != "cat") continue;
    drawResult(detection);
  }
}

/*
Exaple of an detect object
{
    "label": "person",
    "confidence": 0.8013999462127686,
    "x": 7.126655578613281,
    "y": 148.3782720565796,
    "width": 617.7880859375,
    "height": 331.60210132598877,
}
*/
function drawResult(object) {
  const detectedObject = video.get(
    object.x,
    object.y,
    object.width,
    object.height
  );
  drawDetectedObject(detectedObject, object);
  drawBoundingBox(object);
  drawLabel(object);
  saveCrop(detectedObject);
}

function stagedImageDiv(imgSrc) {
  const div = document.createElement("div");
  const img = document.createElement("img");
  const btnDelete = document.createElement("button");
  const deleteIcon = document.createElement("span");

  div.classList.add("cat-snapshot");
  img.src = imgSrc;

  btnDelete.classList.add("action");
  deleteIcon.classList.add("material-symbols-outlined", "delete");
  deleteIcon.innerText = "delete";

  btnDelete.addEventListener("click", (e) => {
    e.target.closest(".cat-snapshot").remove();
    msnry.layout();
    const croppedHtml = croppedImageDiv(imgSrc);
    cropsWrapper.prepend(croppedHtml);
  });

  btnDelete.appendChild(deleteIcon);
  div.appendChild(img);
  div.appendChild(btnDelete);

  return div;
}

function croppedImageDiv(imgSrc) {
  const div = document.createElement("div");
  const img = document.createElement("img");
  const btnCheck = document.createElement("button");
  const checkIcon = document.createElement("span");
  const btnDelete = document.createElement("button");
  const deleteIcon = document.createElement("span");

  div.classList.add("cat-snapshot");
  img.src = imgSrc;
  btnCheck.classList.add("action");
  checkIcon.classList.add("material-symbols-outlined", "check");
  checkIcon.innerText = "check";
  btnDelete.classList.add("action");
  deleteIcon.classList.add("material-symbols-outlined", "delete");
  deleteIcon.innerText = "delete";

  btnCheck.addEventListener("click", (e) => {
    if (collageSnapshots.childElementCount >= 9) {
      alert("Você só pode selecionar 9 imagens para a sua montagem!");
      return;
    }
    e.target.closest(".cat-snapshot").remove();
    const staged = stagedImageDiv(imgSrc);
    collageSnapshots.appendChild(staged);
    msnry.appended(staged);
  });

  btnDelete.addEventListener("click", (e) => {
    e.target.closest(".cat-snapshot").remove();
  });

  btnCheck.appendChild(checkIcon);
  btnDelete.appendChild(deleteIcon);
  div.appendChild(img);
  div.appendChild(btnCheck);
  div.appendChild(btnDelete);

  return div;
}

// saves crop as html element
function saveCrop(detectedObject) {
  const croppedHtml = croppedImageDiv(detectedObject.canvas.toDataURL());
  cropsWrapper.prepend(croppedHtml);
}

// draws the rectangle with the object's pixels
function drawDetectedObject(detectedObject, object) {
  image(detectedObject, object.x, object.y);
}

function imageWithBtns() {}

// draw bounding box around the detected object
function drawBoundingBox(object) {
  // Sets the color used to draw lines.
  stroke("green");
  // width of the stroke
  strokeWeight(4);
  // Disables filling geometry
  noFill();
  // draw an rectangle
  // x and y are the coordinates of upper-left corner, followed by width and height
  rect(object.x, object.y, object.width, object.height);
}

// draw label of the detected object (inside the box)
function drawLabel(object) {
  // Disables drawing the stroke
  noStroke();
  // sets the color used to fill shapes
  fill("white");
  // set font size
  textSize(24);
  // draw string to canvas
  text(object.label, object.x + 10, object.y + 24);
}

// callback function. it is called when object is detected
function onDetected(error, results) {
  if (error) {
    console.error(error);
  }
  detections = results;
  // keep detecting object
  if (detecting) {
    detect();
  }
}

function detect() {
  // instruct "detector" object to start detect object from video element
  // and "onDetected" function is called when object is detected
  detector.detect(video, onDetected);
}

function toggleVideo() {
  if (!video) return;
  if (videoVisibility) {
    video.elt.style.visibility = "hidden";
    toggleVideoEl.innerText = "Show Video";
  } else {
    video.elt.style.visibility = "visible";
    toggleVideoEl.innerText = "Hide Video";
  }
  videoVisibility = !videoVisibility;
}

function toggleDetecting() {
  if (!video || !detector) return;
  if (!detecting) {
    detect();
    toggleDetectingEl.innerText = "Stop Detecting";
  } else {
    toggleDetectingEl.innerText = "Start Detecting";
  }
  detecting = !detecting;
}

catNameEl.addEventListener("input", (e) => {
  catNameHeadingEl.innerText = e.target.value;
});

createCollageBtn.addEventListener("click", () => {
  const catName = catNameEl.value;
  if (!catName || catName === "") {
    alert("Digite o nome do seu gato!");
    return;
  }
  if (collageSnapshots.childElementCount < 1) {
    alert("Selecione ao menos uma imagem capturada pela webcam!");
    return;
  }
});
