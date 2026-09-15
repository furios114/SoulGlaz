(() => {
  "use strict";

  const VERSION = "2.0.1";

  const state = {
    currentApp: null,
    calcValue: "0",
    calcPrevious: null,
    calcOperator: null,
    calcReset: false
  };

  const $ = (selector) => document.querySelector(selector);

  /* =========================
     SAFE STORAGE
  ========================= */

  const storage = {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  };

  /* =========================
     HELPERS
  ========================= */

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toast(message) {
    const element = $("#toast");

    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 1800);
  }

  /* =========================
     BOOT
  ========================= */

  function finishBoot() {
    const boot = $("#boot");
    const app = $("#app");

    if (boot) boot.classList.add("hidden");
    if (app) app.classList.remove("hidden");

    const status = $("#jsStatus");

    if (status) {
      status.textContent = "SYSTEM READY";
    }
  }

  function safeBoot() {
    try {
      updateClock();
      updateNetwork();
      updateMetrics();
      updateGreeting();
      renderTimeline();
      renderSmartActions();
    } catch (error) {
      console.error("MINDOS boot:", error);
    }

    // Главное: загрузка НЕ зависит от остальных функций.
    finishBoot();

    try {
      addTimeline("MINDOS started");
    } catch {}

    try {
      registerServiceWorker();
    } catch {}
  }

  /* =========================
     CLOCK
  ========================= */

  function updateClock() {
    const clock = $("#clock");

    if (!clock) return;

    clock.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  /* =========================
     NETWORK
  ========================= */

  function updateNetwork() {
    const online = navigator.onLine;

    const dot = $("#networkDot");
    const text = $("#networkText");
    const metric = $("#metricNetwork");

    if (dot) {
      dot.classList.toggle("offline", !online);
    }

    if (text) {
      text.textContent = online ? "ONLINE" : "OFFLINE";
    }

    if (metric) {
      metric.textContent = online ? "ONLINE" : "OFFLINE";
    }
  }

  /* =========================
     DEVICE METRICS
  ========================= */

  function updateMetrics() {
    const threads = $("#metricThreads");
    const memory = $("#metricMemory");

    if (threads) {
      threads.textContent =
        navigator.hardwareConcurrency || "N/A";
    }

    if (memory) {
      memory.textContent =
        navigator.deviceMemory
          ? `${navigator.deviceMemory} GB`
          : "N/A";
    }
  }

  /* =========================
     GREETING
  ========================= */

  function updateGreeting() {
    const element = $("#greeting");

    if (!element) return;

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      element.textContent = "GOOD MORNING";
    } else if (hour >= 12 && hour < 18) {
      element.textContent = "GOOD AFTERNOON";
    } else if (hour >= 18 && hour < 24) {
      element.textContent = "GOOD EVENING";
    } else {
      element.textContent = "SYSTEM";
    }
  }

  /* =========================
     TIMELINE
  ========================= */

  function addTimeline(event) {
    const list = storage.get("mindos_timeline", []);

    list.unshift({
      event,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    storage.set(
      "mindos_timeline",
      list.slice(0, 30)
    );

    renderTimeline();
  }

  function renderTimeline() {
    const element = $("#timeline");

    if (!element) return;

    const list = storage.get("mindos_timeline", []);

    if (!Array.isArray(list) || list.length === 0) {
      element.innerHTML =
        '<div class="empty">No activity yet.</div>';
      return;
    }

    element.innerHTML = list
      .slice(0, 8)
      .map(item => `
        <div class="timeline-item">
          <div class="timeline-time">
            ${escapeHTML(item.time)}
          </div>

          <div class="timeline-event">
            ${escapeHTML(item.event)}
          </div>
        </div>
      `)
      .join("");
  }

  function clearTimeline() {
    storage.set("mindos_timeline", []);
    renderTimeline();
    toast("Timeline cleared");
  }

  /* =========================
     SMART ACTIONS
  ========================= */

  function renderSmartActions() {
    const element = $("#smartActions");

    if (!element) return;

    const notes = storage.get("mindos_notes", "");

    if (!notes || !String(notes).trim()) {
      element.classList.add("hidden");
      return;
    }

    element.classList.remove("hidden");

    element.innerHTML = `
      <div class="eyebrow">SMART ACTION</div>

      <div class="smart-title">
        Your workspace is ready.
      </div>

      <div class="smart-text">
        You have a saved note.
        Continue where you stopped.
      </div>

      <button
        class="smart-action"
        data-app="notes"
        type="button"
      >
        Open Notes →
      </button>
    `;
  }

  /* =========================
     PAGE NAVIGATION
  ========================= */

  function showPage(page) {
    const home = $("#home");
    const apps = $("#apps");

    if (home) {
      home.classList.toggle(
        "hidden",
        page !== "home"
      );
    }

    if (apps) {
      apps.classList.toggle(
        "hidden",
        page !== "apps"
      );
    }
  }

  /* =========================
     APPLICATION SYSTEM
  ========================= */

  const appDefinitions = {
    terminal: {
      label: "SYSTEM",
      title: "Terminal",
      render: renderTerminal
    },

    files: {
      label: "STORAGE",
      title: "Files",
      render: renderFiles
    },

    notes: {
      label: "WORKSPACE",
      title: "Notes",
      render: renderNotes
    },

    calculator: {
      label: "UTILITY",
      title: "Calculator",
      render: renderCalculator
    },

    monitor: {
      label: "DIAGNOSTICS",
      title: "System Monitor",
      render: renderMonitor
    },

    settings: {
      label: "SYSTEM",
      title: "Settings",
      render: renderSettings
    }
  };

  function openApp(name) {
    try {
      const definition = appDefinitions[name];

      if (!definition) {
        toast("Application not found");
        return;
      }

      const view = $("#appView");
      const content = $("#appContent");

      if (!view || !content) {
        toast("Application system unavailable");
        return;
      }

      state.currentApp = name;

      const label = $("#appHeaderLabel");
      const title = $("#appHeaderTitle");

      if (label) {
        label.textContent = definition.label;
      }

      if (title) {
        title.textContent = definition.title;
      }

      content.innerHTML = "";

      view.classList.remove("hidden");

      definition.render(content);

      addTimeline(`${definition.title} opened`);

      if (name === "terminal") {
        setTimeout(() => {
          const input = $("#terminalInput");
          if (input) input.focus();
        }, 50);
      }

    } catch (error) {
      console.error("MINDOS app error:", error);
      toast("Application error");

      const content = $("#appContent");

      if (content) {
        content.innerHTML = `
          <div class="empty">
            Application failed to start.
          </div>
        `;
      }
    }
  }

  function closeApp() {
    if (state.currentApp) {
      const definition =
        appDefinitions[state.currentApp];

      if (definition) {
        addTimeline(`${definition.title} closed`);
      }
    }

    state.currentApp = null;

    const view = $("#appView");
    const content = $("#appContent");

    if (view) {
      view.classList.add("hidden");
    }

    if (content) {
      content.innerHTML = "";
    }
  }

  /* =========================
     TERMINAL
  ========================= */

  function renderTerminal(root) {
    root.innerHTML = `
      <div class="terminal">

        <div id="terminalOutput"
             class="terminal-output">
MINDOS Terminal ${VERSION}
Core: READY

Type "help" for commands.
        </div>

        <form id="terminalForm"
              class="terminal-form">

          <span>mindos&gt;</span>

          <input
            id="terminalInput"
            class="terminal-input"
            autocomplete="off"
            spellcheck="false"
            aria-label="Terminal command"
          >

        </form>

      </div>
    `;

    const form = $("#terminalForm");

    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();

      const input = $("#terminalInput");

      if (!input) return;

      const command = input.value.trim();

      if (!command) return;

      runCommand(command);

      input.value = "";
    });
  }

  function terminalPrint(text) {
    const output = $("#terminalOutput");

    if (!output) return;

    output.textContent += `\n${text}`;

    output.scrollTop = output.scrollHeight;
  }

  function runCommand(raw) {
    const command = raw
      .trim()
      .toLowerCase();

    terminalPrint(`\n> ${raw}`);

    if (command === "help") {
      terminalPrint(
`help
apps
open <app>
status
version
clear
about`
      );
      return;
    }

    if (command === "apps") {
      terminalPrint(
        Object.keys(appDefinitions).join("\n")
      );
      return;
    }

    if (command.startsWith("open ")) {
      const name = command
        .slice(5)
        .trim();

      if (appDefinitions[name]) {
        openApp(name);
      } else {
        terminalPrint(
          `Unknown application: ${name}`
        );
      }

      return;
    }

    if (command === "status") {
      terminalPrint(
`CORE: READY
NETWORK: ${navigator.onLine ? "ONLINE" : "OFFLINE"}
THREADS: ${navigator.hardwareConcurrency || "N/A"}
MEMORY: ${navigator.deviceMemory || "N/A"}`
      );
      return;
    }

    if (command === "version") {
      terminalPrint(`MINDOS ${VERSION}`);
      return;
    }

    if (command === "clear") {
      const output = $("#terminalOutput");

      if (output) {
        output.textContent = "";
      }

      return;
    }

    if (command === "about") {
      terminalPrint(
        "MINDOS — lightweight browser operating system."
      );
      return;
    }

    terminalPrint(`Command not found: ${raw}`);
  }

  /* =========================
     FILES
  ========================= */

  function renderFiles(root) {
    const files = [
      ["system/core.mind", "System"],
      ["user/notes.mind", "Workspace"],
      ["user/settings.json", "Configuration"],
      ["logs/timeline.log", "System log"]
    ];

    root.innerHTML = `
      <div class="file-list">

        ${files.map(file => `
          <div class="file">

            <div>
              <strong>
                ${escapeHTML(file[0])}
              </strong>

              <small>
                ${escapeHTML(file[1])}
              </small>
            </div>

            <span>›</span>

          </div>
        `).join("")}

      </div>
    `;
  }

  /* =========================
     NOTES
  ========================= */

  function renderNotes(root) {
    const saved =
      storage.get("mindos_notes", "");

    root.innerHTML = `
      <div class="notes">

        <textarea
          id="notesArea"
          placeholder="Write something..."
        >${escapeHTML(saved)}</textarea>

        <button
          id="saveNotes"
          class="primary"
          type="button"
        >
          Save note
        </button>

      </div>
    `;

    const button = $("#saveNotes");

    if (!button) return;

    button.addEventListener("click", () => {
      const area = $("#notesArea");

      if (!area) return;

      storage.set(
        "mindos_notes",
        area.value
      );

      addTimeline("Note saved");

      renderSmartActions();

      toast("Note saved");
    });
  }

  /* =========================
     CALCULATOR
  ========================= */

  function renderCalculator(root) {
    root.innerHTML = `
      <div class="calc">

        <div
          id="calcDisplay"
          class="calc-display"
        >0</div>

        <div class="calc-grid">

          <button data-calc="clear" type="button">C</button>
          <button data-calc="back" type="button">⌫</button>
          <button data-calc="operator" type="button">÷</button>
          <button data-calc="operator" type="button">×</button>

          <button data-calc="number" type="button">7</button>
          <button data-calc="number" type="button">8</button>
          <button data-calc="number" type="button">9</button>
          <button data-calc="operator" type="button">−</button>

          <button data-calc="number" type="button">4</button>
          <button data-calc="number" type="button">5</button>
          <button data-calc="number" type="button">6</button>
          <button data-calc="operator" type="button">+</button>

          <button data-calc="number" type="button">1</button>
          <button data-calc="number" type="button">2</button>
          <button data-calc="number" type="button">3</button>
          <button
            class="equal"
            data-calc="equal"
            type="button"
          >=</button>

          <button data-calc="number" type="button">0</button>
          <button data-calc="decimal" type="button">.</button>

        </div>
      </div>
    `;

    root
      .querySelectorAll("[data-calc]")
      .forEach(button => {
        button.addEventListener("click", () => {
          calculatorInput(
            button.dataset.calc,
            button.textContent
          );
        });
      });

    resetCalculator();
  }

  function resetCalculator() {
    state.calcValue = "0";
    state.calcPrevious = null;
    state.calcOperator = null;
    state.calcReset = false;

    const display = $("#calcDisplay");

    if (display) {
      display.textContent = "0";
    }
  }

  function calculatorInput(action, value) {
    const display = $("#calcDisplay");

    if (!display) return;

    if (action === "clear") {
      resetCalculator();
      return;
    }

    if (action === "back") {
      state.calcValue =
        state.calcValue.length > 1
          ? state.calcValue.slice(0, -1)
          : "0";

      display.textContent =
        state.calcValue;

      return;
    }

    if (action === "number") {
      if (state.calcReset) {
        state.calcValue = value;
        state.calcReset = false;
      } else {
        state.calcValue =
          state.calcValue === "0"
            ? value
            : state.calcValue + value;
      }

      display.textContent =
        state.calcValue;

      return;
    }

    if (action === "decimal") {
      if (state.calcReset) {
        state.calcValue = "0.";
        state.calcReset = false;
      } else if (!state.calcValue.includes(".")) {
        state.calcValue += ".";
      }

      display.textContent =
        state.calcValue;

      return;
    }

    if (action === "operator") {
      const number =
        Number(state.calcValue);

      if (
        state.calcPrevious !== null &&
        state.calcOperator
      ) {
        state.calcPrevious =
          calculate(
            state.calcPrevious,
            number,
            state.calcOperator
          );
      } else {
        state.calcPrevious = number;
      }

      state.calcOperator =
        value === "×" ? "*" :
        value === "÷" ? "/" :
        value === "−" ? "-" :
        "+";

      state.calcReset = true;

      display.textContent =
        state.calcPrevious;

      return;
    }

    if (action === "equal") {
      if (
        state.calcPrevious === null ||
        !state.calcOperator
      ) {
        return;
      }

      const result =
        calculate(
          state.calcPrevious,
          Number(state.calcValue),
          state.calcOperator
        );

      state.calcValue =
        String(result);

      state.calcPrevious = null;
      state.calcOperator = null;
      state.calcReset = true;

      display.textContent =
        state.calcValue;
    }
  }

  function calculate(a, b, operator) {
    switch (operator) {
      case "+":
        return a + b;

      case "-":
        return a - b;

      case "*":
        return a * b;

      case "/":
        return b === 0 ? 0 : a / b;

      default:
        return b;
    }
  }

  /* =========================
     DIAGNOSTICS
  ========================= */

  function renderMonitor(root) {
    let connection = null;

    try {
      connection = navigator.connection;
    } catch {}

    const rows = [
      ["MINDOS", VERSION],
      ["CORE", "READY"],
      ["ONLINE", navigator.onLine ? "YES" : "NO"],
      ["CORES", navigator.hardwareConcurrency || "N/A"],
      ["MEMORY", navigator.deviceMemory
        ? `${navigator.deviceMemory} GB`
        : "N/A"],
      ["LANGUAGE", navigator.language || "N/A"],
      ["PLATFORM", navigator.platform || "N/A"],
      ["SCREEN", `${screen.width} × ${screen.height}`],
      ["DPR", window.devicePixelRatio || 1],
      ["NETWORK", connection?.effectiveType || "N/A"],
      ["REDUCED MOTION",
        matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches ? "YES" : "NO"]
    ];

    root.innerHTML = `
      <div class="diag-grid">

        ${rows.map(row => `
          <div class="diag">

            <span>
              ${escapeHTML(row[0])}
            </span>

            <strong>
              ${escapeHTML(row[1])}
            </strong>

          </div>
        `).join("")}

      </div>
    `;
  }

  /* =========================
     SETTINGS
  ========================= */

  function renderSettings(root) {
    let notes = "";

    try {
      notes =
        storage.get("mindos_notes", "") || "";
    } catch {}

    const noteSize =
      new Blob([String(notes)]).size;

    root.innerHTML = `
      <div class="settings-list">

        <div class="setting">
          <strong>MINDOS version</strong>
          <small>${VERSION}</small>
        </div>

        <div class="setting">
          <strong>Storage</strong>
          <small>
            Notes: ${noteSize} bytes
          </small>
        </div>

        <div class="setting">
          <strong>Theme</strong>
          <small>
            Dark system interface
          </small>
        </div>

        <div class="setting">
          <strong>Offline mode</strong>
          <small>
            Core applications work locally.
          </small>
        </div>

        <button
          id="clearData"
          class="primary"
          type="button"
        >
          Reset local data
        </button>

      </div>
    `;

    const clear = $("#clearData");

    if (!clear) return;

    clear.addEventListener("click", () => {
      if (
        !confirm(
          "Delete MINDOS local data?"
        )
      ) {
        return;
      }

      storage.remove("mindos_notes");
      storage.remove("mindos_timeline");

      renderTimeline();
      renderSmartActions();
      renderSettings(root);

      toast("Local data cleared");
    });
  }

  /* =========================
     SERVICE WORKER
  ========================= */

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.warn(
        "Service Worker unavailable:",
        error
      );
    }
  }

  /* =========================
     GLOBAL EVENTS
  ========================= */

  function setupEvents() {

    document.addEventListener("click", event => {

      const appButton =
        event.target.closest("[data-app]");

      if (appButton) {
        openApp(
          appButton.dataset.app
        );
        return;
      }

      const action =
        event.target.closest("[data-action]");

      if (!action) return;

      const name =
        action.dataset.action;

      if (name === "home") {
        showPage("home");
        return;
      }

      if (name === "apps") {
        showPage("apps");
        return;
      }

      if (name === "clearTimeline") {
        clearTimeline();
      }
    });

    const back = $("#backButton");

    if (back) {
      back.addEventListener(
        "click",
        closeApp
      );
    }

    window.addEventListener(
      "online",
      updateNetwork
    );

    window.addEventListener(
      "offline",
      updateNetwork
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape" &&
          state.currentApp
        ) {
          closeApp();
        }
      }
    );
  }

  /* =========================
     START
  ========================= */

  function start() {

    // Подключаем все кнопки.
    setupEvents();

    // Сразу убираем экран INITIALIZING CORE.
    finishBoot();

    // После первого кадра запускаем второстепенные функции.
    requestAnimationFrame(() => {
      safeBoot();
    });

    // Часы обновляем только раз в 30 секунд.
    // Это намного дешевле постоянного обновления.
    setInterval(updateClock, 30000);
  }

  /* =========================
     DOM READY
  ========================= */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );

  } else {

    start();

  }

})();