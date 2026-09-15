// ==========================================
// MINDOS
// ==========================================


// ==========================================
// CLOCK
// ==========================================

const clock =
  document.getElementById("clock");


function updateClock() {

  const now =
    new Date();

  clock.textContent =
    now.toLocaleTimeString(
      "ru-RU",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

}


updateClock();

setInterval(
  updateClock,
  1000
);


// ==========================================
// WINDOWS
// ==========================================

const windows =
  document.getElementById("windows");


let windowCounter = 0;


function createWindow(
  title,
  content
) {

  windowCounter++;

  const id =
    "window-" +
    windowCounter;


  const win =
    document.createElement("div");

  win.className =
    "window";

  win.id =
    id;


  win.innerHTML = `

    <div class="window-header">

      <span class="window-title">
        ${title}
      </span>

      <button
        class="window-close"
        data-close="${id}">
        ×
      </button>

    </div>

    <div class="window-content">
      ${content}
    </div>

  `;


  windows.appendChild(win);


  win.querySelector(
    ".window-close"
  ).addEventListener(
    "click",
    () => {

      win.remove();

    }
  );


  return win;

}


// ==========================================
// TERMINAL
// ==========================================

function openTerminal() {

  const win =
    createWindow(
      "TERMINAL",
      `

      <div class="terminal">

        <div
          class="terminal-output"
          id="terminalOutput">

          <div class="green">
            MINDOS TERMINAL v1.0
          </div>

          <div>
            Type "help" to see commands.
          </div>

          <br>

        </div>

        <div class="terminal-input-line">

          <span class="terminal-prompt">
            mind@os:~$
          </span>

          <input
            class="terminal-input"
            id="terminalInput"
            autocomplete="off"
            spellcheck="false">

        </div>

      </div>

      `
    );


  const input =
    win.querySelector(
      "#terminalInput"
    );

  const output =
    win.querySelector(
      "#terminalOutput"
    );


  input.focus();


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Enter"
      ) {
        return;
      }


      const command =
        input.value
          .trim()
          .toLowerCase();


      input.value = "";


      if (!command) {
        return;
      }


      const line =
        document.createElement("div");

      line.textContent =
        "mind@os:~$ " +
        command;

      output.appendChild(line);


      let result = "";


      if (
        command === "help"
      ) {

        result =
          "Commands: help, clear, date, about, status";

      }

      else if (
        command === "clear"
      ) {

        output.innerHTML = "";

        return;

      }

      else if (
        command === "date"
      ) {

        result =
          new Date()
            .toLocaleString(
              "ru-RU"
            );

      }

      else if (
        command === "about"
      ) {

        result =
          "MINDOS — personal digital environment.";

      }

      else if (
        command === "status"
      ) {

        result =
          "SYSTEM ONLINE / ALL SYSTEMS NOMINAL";

      }

      else {

        result =
          "Command not found: " +
          command;

      }


      const resultElement =
        document.createElement("div");

      resultElement.className =
        "green";

      resultElement.textContent =
        result;

      output.appendChild(
        resultElement
      );


      output.scrollTop =
        output.scrollHeight;

    }
  );

}


// ==========================================
// FILES
// ==========================================

function openFiles() {

  createWindow(
    "FILES",
    `

    <div class="file-grid">

      <div class="file">
        <div class="file-icon">▰</div>
        <div class="file-name">Documents</div>
      </div>

      <div class="file">
        <div class="file-icon">▰</div>
        <div class="file-name">Downloads</div>
      </div>

      <div class="file">
        <div class="file-icon">▰</div>
        <div class="file-name">Projects</div>
      </div>

      <div class="file">
        <div class="file-icon">▰</div>
        <div class="file-name">Pictures</div>
      </div>

      <div class="file">
        <div class="file-icon">▰</div>
        <div class="file-name">System</div>
      </div>

      <div class="file">
        <div class="file-icon">▰</div>
        <div class="file-name">MINDOS</div>
      </div>

    </div>

    `
  );

}


// ==========================================
// NOTES
// ==========================================

function openNotes() {

  const saved =
    localStorage.getItem(
      "mindos_notes"
    ) || "";


  const win =
    createWindow(
      "NOTES",
      `

      <textarea
        class="notes-area"
        placeholder="Начните писать...">${saved}</textarea>

      `
    );


  const textarea =
    win.querySelector(
      ".notes-area"
    );


  textarea.addEventListener(
    "input",
    () => {

      localStorage.setItem(
        "mindos_notes",
        textarea.value
      );

    }
  );

}


// ==========================================
// CALCULATOR
// ==========================================

function openCalculator() {

  const win =
    createWindow(
      "CALCULATOR",
      `

      <div class="calculator">

        <div
          class="calc-display"
          id="calcDisplay">
          0
        </div>

        <div class="calc-grid">

          <button data-calc="C">C</button>
          <button data-calc="(">(</button>
          <button data-calc=")">)</button>
          <button data-calc="/">÷</button>

          <button data-calc="7">7</button>
          <button data-calc="8">8</button>
          <button data-calc="9">9</button>
          <button data-calc="*">×</button>

          <button data-calc="4">4</button>
          <button data-calc="5">5</button>
          <button data-calc="6">6</button>
          <button data-calc="-">−</button>

          <button data-calc="1">1</button>
          <button data-calc="2">2</button>
          <button data-calc="3">3</button>
          <button data-calc="+">+</button>

          <button data-calc="0">0</button>
          <button data-calc=".">.</button>
          <button data-calc="=" class="equal">=</button>

        </div>

      </div>

      `
    );


  const display =
    win.querySelector(
      "#calcDisplay"
    );


  let expression = "";


  win.querySelectorAll(
    "[data-calc]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const value =
            button.dataset.calc;


          if (value === "C") {

            expression = "";

            display.textContent =
              "0";

            return;

          }


          if (value === "=") {

            try {

              if (
                !/^[0-9+\-*/().\s]+$/
                  .test(expression)
              ) {

                throw new Error();

              }


              expression =
                String(
                  Function(
                    "return " +
                    expression
                  )()
                );


              display.textContent =
                expression;

            } catch {

              expression = "";

              display.textContent =
                "ERROR";

            }

            return;

          }


          expression +=
            value;

          display.textContent =
            expression;

        }
      );

    }
  );

}


// ==========================================
// SYSTEM MONITOR
// ==========================================

function openMonitor() {

  createWindow(
    "SYSTEM MONITOR",
    `

    <div class="monitor-card">

      <div class="monitor-card-header">
        <span>CPU</span>
        <span>42%</span>
      </div>

      <div class="progress">
        <span style="width:42%"></span>
      </div>

    </div>


    <div class="monitor-card">

      <div class="monitor-card-header">
        <span>MEMORY</span>
        <span>61%</span>
      </div>

      <div class="progress">
        <span style="width:61%"></span>
      </div>

    </div>


    <div class="monitor-card">

      <div class="monitor-card-header">
        <span>STORAGE</span>
        <span>28%</span>
      </div>

      <div class="progress">
        <span style="width:28%"></span>
      </div>

    </div>


    <div class="monitor-card">

      <div class="monitor-card-header">
        <span>NETWORK</span>
        <span>ONLINE</span>
      </div>

      <div class="progress">
        <span style="width:78%"></span>
      </div>

    </div>

    `
  );

}


// ==========================================
// SETTINGS
// ==========================================

function openSettings() {

  createWindow(
    "SETTINGS",
    `

    <div class="setting">

      <div class="setting-name">
        System
      </div>

      <div class="setting-value">
        MINDOS 1.0
      </div>

    </div>


    <div class="setting">

      <div class="setting-name">
        Interface
      </div>

      <div class="setting-value">
        DARK
      </div>

    </div>


    <div class="setting">

      <div class="setting-name">
        Accent
      </div>

      <div class="setting-value">
        LIME
      </div>

    </div>


    <div class="setting">

      <div class="setting-name">
        Storage
      </div>

      <div class="setting-value">
        LOCAL
      </div>

    </div>


    <div class="setting">

      <div class="setting-name">
        Version
      </div>

      <div class="setting-value">
        1.0.0
      </div>

    </div>

    `
  );

}


// ==========================================
// APP OPENER
// ==========================================

function openApp(
  app
) {

  if (app === "terminal") {
    openTerminal();
  }

  if (app === "files") {
    openFiles();
  }

  if (app === "notes") {
    openNotes();
  }

  if (app === "calculator") {
    openCalculator();
  }

  if (app === "monitor") {
    openMonitor();
  }

  if (app === "settings") {
    openSettings();
  }

}


// ==========================================
// APP BUTTONS
// ==========================================

document
  .querySelectorAll(
    "[data-app]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          openApp(
            button.dataset.app
          );

          appMenu.classList.remove(
            "open"
          );

        }
      );

    }
  );


// ==========================================
// APP MENU
// ==========================================

const appMenu =
  document.getElementById(
    "appMenu"
  );

const appsButton =
  document.getElementById(
    "appsButton"
  );

const closeMenu =
  document.getElementById(
    "closeMenu"
  );


appsButton.addEventListener(
  "click",
  () => {

    appMenu.classList.toggle(
      "open"
    );

  }
);


closeMenu.addEventListener(
  "click",
  () => {

    appMenu.classList.remove(
      "open"
    );

  }
);


// ==========================================
// DOCK
// ==========================================

document
  .getElementById(
    "homeButton"
  )
  .addEventListener(
    "click",
    () => {

      document
        .querySelectorAll(
          ".window"
        )
        .forEach(
          window => window.remove()
        );

      appMenu.classList.remove(
        "open"
      );

    }
  );


document
  .getElementById(
    "terminalButton"
  )
  .addEventListener(
    "click",
    () => {

      openTerminal();

    }
  );


document
  .getElementById(
    "settingsButton"
  )
  .addEventListener(
    "click",
    () => {

      openSettings();

    }
  );


// ==========================================
// KEYBOARD
// ==========================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      appMenu.classList.remove(
        "open"
      );

    }

  }
);