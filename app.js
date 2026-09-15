const map = L.map("map", {

    zoomControl: true,

    minZoom: 2,

    maxZoom: 18

}).setView([50.0755, 14.4378], 5);


/*
    REAL WORLD MAP

    OpenStreetMap
*/

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);


/*
    AIRCRAFT STORAGE
*/

const aircraftMarkers = new Map();


/*
    COUNTERS
*/

const aircraftCount =
    document.getElementById("aircraftCount");

const objectCount =
    document.getElementById("objectCount");


/*
    CREATE AIRCRAFT MARKER
*/

function createAircraftMarker(aircraft) {

    const heading =
        aircraft.heading || 0;


    const icon = L.divIcon({

        className: "aircraft-marker",

        html: `
            <div
                class="aircraft"
                style="transform: rotate(${heading}deg)"
                title="${aircraft.callsign || "UNKNOWN"}"
            >
                ✈
            </div>
        `,

        iconSize: [26, 26],

        iconAnchor: [13, 13]

    });


    const marker =
        L.marker(
            [
                aircraft.latitude,
                aircraft.longitude
            ],
            {
                icon
            }
        );


    marker.bindPopup(`

        <div class="aircraft-popup">

            <b>
                ${aircraft.callsign || "UNKNOWN"}
            </b>

            <br><br>

            ICAO:
            ${aircraft.icao || "UNKNOWN"}

            <br>

            Altitude:
            ${Math.round(aircraft.altitude || 0)} m

            <br>

            Speed:
            ${Math.round(
                (aircraft.speed || 0) * 3.6
            )} km/h

            <br>

            Heading:
            ${Math.round(heading)}°

        </div>

    `);


    marker.addTo(map);


    return marker;

}


/*
    GET REAL AIRCRAFT DATA
    FROM OPENSKY
*/

async function loadAircraft() {

    try {

        /*
            Bounding box:

            Europe

            latitude:
            35 → 60

            longitude:
            -10 → 35
        */

        const url =
            "https://opensky-network.org/api/states/all" +
            "?lamin=35" +
            "&lomin=-10" +
            "&lamax=60" +
            "&lomax=35";


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "OpenSky HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        const states =
            data.states || [];


        /*
            ICAO INDEX
        */

        const visibleIds =
            new Set();


        let aircraftTotal = 0;


        states.forEach((state) => {

            /*
                OpenSky state vector:

                0 icao24
                1 callsign
                2 country
                3 time position
                4 last contact
                5 longitude
                6 latitude
                7 baro altitude
                8 on ground
                9 velocity
                10 true track
            */


            const icao =
                state[0];

            const callsign =
                (state[1] || "")
                .trim();


            const longitude =
                state[5];

            const latitude =
                state[6];


            if (
                latitude === null ||
                longitude === null
            ) {

                return;

            }


            visibleIds.add(icao);

            aircraftTotal++;


            const aircraft = {

                icao,

                callsign,

                country:
                    state[2],

                longitude,

                latitude,

                altitude:
                    state[7],

                speed:
                    state[9],

                heading:
                    state[10]

            };


            /*
                UPDATE EXISTING
                MARKER
            */

            if (
                aircraftMarkers.has(icao)
            ) {

                const marker =
                    aircraftMarkers.get(icao);


                marker.setLatLng([
                    latitude,
                    longitude
                ]);


                const element =
                    marker.getElement();


                if (element) {

                    const plane =
                        element.querySelector(
                            ".aircraft"
                        );


                    if (plane) {

                        plane.style.transform =
                            `rotate(${aircraft.heading || 0}deg)`;

                    }

                }


                marker.setPopupContent(`

                    <div class="aircraft-popup">

                        <b>
                            ${callsign || "UNKNOWN"}
                        </b>

                        <br><br>

                        ICAO:
                        ${icao}

                        <br>

                        Country:
                        ${aircraft.country}

                        <br>

                        Altitude:
                        ${Math.round(
                            aircraft.altitude || 0
                        )} m

                        <br>

                        Speed:
                        ${Math.round(
                            (aircraft.speed || 0) * 3.6
                        )} km/h

                        <br>

                        Heading:
                        ${Math.round(
                            aircraft.heading || 0
                        )}°

                    </div>

                `);


            } else {

                /*
                    CREATE NEW
                */

                const marker =
                    createAircraftMarker(
                        aircraft
                    );


                aircraftMarkers.set(
                    icao,
                    marker
                );

            }

        });


        /*
            REMOVE AIRCRAFT
            THAT DISAPPEARED
        */

        for (
            const [
                icao,
                marker
            ] of aircraftMarkers
        ) {

            if (
                !visibleIds.has(icao)
            ) {

                map.removeLayer(marker);

                aircraftMarkers.delete(
                    icao
                );

            }

        }


        aircraftCount.textContent =
            aircraftTotal.toLocaleString();


        objectCount.textContent =
            `OBJECTS: ${aircraftTotal.toLocaleString()}`;


        console.log(
            "SoulGlaz:",
            aircraftTotal,
            "aircraft"
        );


    } catch (error) {

        console.error(
            "SoulGlaz aircraft error:",
            error
        );

        objectCount.textContent =
            "DATA ERROR";

    }

}


/*
    INITIAL LOAD
*/

loadAircraft();


/*
    UPDATE

    Don't hammer the API.
*/

setInterval(
    loadAircraft,
    30000
);


/*
    SHOW MAP POSITION
*/

map.on(
    "mousemove",
    function (event) {

        document.getElementById(
            "mapPosition"
        ).textContent =

            event.latlng.lat.toFixed(4) +
            "° N / " +

            event.latlng.lng.toFixed(4) +
            "° E";

    }
);