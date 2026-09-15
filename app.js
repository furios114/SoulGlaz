// ===============================
// SOULGLAZ
// RADAR + VISION
// ===============================


// ===============================
// RADAR
// ===============================

const map = L.map("map").setView([59.93, 30.31], 7);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap"
  }
).addTo(map);


const aircraftMarkers = {};

const objectCountElement =
  document.getElementById("objectCount");

const latElement =
  document.getElementById("lat");

const lonElement =
  document.getElementById("lon");


async function loadAircraft() {

  try {

    const url =
      "https://opensky-network.org/api/states/all" +
      "?lamin=35&lomin=-10&lamax=70&lomax=40";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("OpenSky HTTP " + response.status);
    }

    const data = await response.json();

    const states = data.states || [];

    const currentAircraft = new Set();

    states.forEach(state => {

      const icao = state[0];
      const callsign = (state[1] || "UNKNOWN").trim();

      const longitude = state[5];
      const latitude = state[6];

      const altitude = state[7];
      const velocity = state[9];
      const heading = state[10];

      if (
        longitude === null ||
        latitude === null
      ) {
        return;
      }

      currentAircraft.add(icao);

      const popup = `
        <b>${callsign}</b><br>
        ICAO: ${icao}<br>
        Country: ${state[2] || "UNKNOWN"}<br>
        Altitude: ${Math.round(altitude || 0)} m<br>
        Speed: ${Math.round((velocity || 0) * 3.6)} km/h<br>
        Heading: ${Math.round(heading || 0)}°
      `;

      if (!aircraftMarkers[icao]) {

        const marker =
          L.circleMarker(
            [latitude, longitude],
            {
              radius: 6,
              color: "#00ff66",
              fillColor: "#00ff66",
              fillOpacity: 0.8
            }
          )
          .addTo(map)
          .bindPopup(popup);

        aircraftMarkers[icao] = marker;

      } else {

        aircraftMarkers[icao]
          .setLatLng([latitude, longitude])
          .setPopupContent(popup);

      }

    });


    Object.keys(aircraftMarkers).forEach(icao => {

      if (!currentAircraft.has(icao)) {

        map.removeLayer(
          aircraftMarkers[icao]
        );

        delete aircraftMarkers[icao];

      }

    });


    objectCountElement.textContent =
      Object.keys(aircraftMarkers).length;

  } catch (error) {

    console.error(
      "Aircraft API error:",
      error
    );

  }

}


loadAircraft();

setInterval(
  loadAircraft,
  30000
);


map.on("mousemove", event => {

  latElement.textContent =
    event.latlng.lat.toFixed(6);

  lonElement.textContent =
    event.latlng.lng.toFixed(6);

});


// ===============================
// VISION
// ===============================

const video =
  document.getElementById("camera");

const canvas =
  document.getElementById("visionCanvas");

const ctx =
  canvas.getContext("2d");

const startButton =
  document.getElementById("startCamera");

const switchButton =
  document.getElementById("switchCamera");

const cameraMessage =
  document.getElementById("cameraMessage");

const visionStatus =
  document.getElementById("visionStatus");

const peopleCount =
  document.getElementById("peopleCount");

const detectedCount =
  document.getElementById("detectedCount");

const detectionList =
  document.getElementById("detectionList");


let cameraStream = null;

let currentCamera = "environment";

let model = null;

let detecting = false;


// ===============================
// START CAMERA
// ===============================

async function startCamera() {

  try {

    if (cameraStream) {

      cameraStream
        .getTracks()
        .forEach(track => track.stop());

    }


    cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: currentCamera,
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        },

        audio: false

      });


    video.srcObject =
      cameraStream;

    cameraMessage.style.display =
      "none";

    visionStatus.textContent =
      "LOADING MODEL";


    if (!model) {

      model =
        await cocoSsd.load();

    }


    visionStatus.textContent =
      "ONLINE";

    detecting = true;

    detectObjects();

  } catch (error) {

    console.error(error);

    visionStatus.textContent =
      "ERROR";

    cameraMessage.style.display =
      "flex";

    cameraMessage.textContent =
      "CAMERA ACCESS DENIED";

  }

}


// ===============================
// SWITCH CAMERA
// ===============================

switchButton.addEventListener(
  "click",
  async () => {

    currentCamera =
      currentCamera === "environment"
        ? "user"
        : "environment";

    await startCamera();

  }
);


// ===============================
// START BUTTON
// ===============================

startButton.addEventListener(
  "click",
  startCamera
);


// ===============================
// OBJECT DETECTION
// ===============================

async function detectObjects() {

  if (!detecting || !model) {
    return;
  }

  if (
    video.readyState <
    HTMLMediaElement.HAVE_ENOUGH_DATA
  ) {

    requestAnimationFrame(
      detectObjects
    );

    return;

  }


  canvas.width =
    video.videoWidth;

  canvas.height =
    video.videoHeight;


  const predictions =
    await model.detect(video);


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  let people = 0;

  const detectedNames = [];


  predictions.forEach(
    prediction => {

      const [
        x,
        y,
        width,
        height
      ] = prediction.bbox;


      const score =
        prediction.score;


      if (score < 0.55) {
        return;
      }


      const name =
        prediction.class;


      if (name === "person") {
        people++;
      }


      detectedNames.push(
        `${name} ${Math.round(score * 100)}%`
      );


      // BOX

      ctx.strokeStyle =
        "#00ff66";

      ctx.lineWidth = 3;

      ctx.strokeRect(
        x,
        y,
        width,
        height
      );


      // LABEL

      const label =
        `${name} ${Math.round(score * 100)}%`;

      ctx.font =
        "16px monospace";


      const textWidth =
        ctx.measureText(label).width;


      ctx.fillStyle =
        "#00ff66";

      ctx.fillRect(
        x,
        Math.max(0, y - 24),
        textWidth + 10,
        24
      );


      ctx.fillStyle =
        "#000";

      ctx.fillText(
        label,
        x + 5,
        Math.max(17, y - 7)
      );

    }
  );


  peopleCount.textContent =
    people;

  detectedCount.textContent =
    detectedNames.length;


  if (detectedNames.length === 0) {

    detectionList.textContent =
      "Nothing detected";

  } else {

    detectionList.innerHTML =
      detectedNames
        .map(
          item =>
            `<div class="detection-item">${item}</div>`
        )
        .join("");

  }


  requestAnimationFrame(
    detectObjects
  );

}