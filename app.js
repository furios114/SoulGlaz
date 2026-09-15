(() => {
  "use strict";

  const VERSION = "2.0.0";

  const state = {
    page: "home",
    currentApp: null,
    terminalHistory: [],
    calcValue: "0",
    calcPrevious: null,
    calcOperator: null,
    calcReset: false
  };

  const $ = (selector) => document.querySelector(selector);

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
      } catch {
        showToast("Storage unavailable");
      }
    }
  };

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 1800);
  }

  function addTimeline(event) {
    const timeline = storage.get("mindos_timeline", []);

    timeline.unshift({
      event,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    storage.set("mindos_timeline", timeline.slice(0, 30));
    renderTimeline();
  }

  function renderTimeline() {
    const timeline = $("#timeline");
    const data = storage.get("mindos_timeline", []);

    if (!data.length) {
      timeline.innerHTML = '<div class="empty">No activity yet.</div>';
      return;
    }

    timeline.innerHTML = data
      .slice(0, 8)
      .map(item => `
        <div class="timeline-item">
          <div class="timeline-time">${escapeHTML(item.time)}</div>
          <div class="timeline-event">${escapeHTML(item.event)}</div>
        </div>
      `)
      .join("");
  }

  function updateClock() {
    $("#clock").textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function updateNetwork() {
    const online = navigator.onLine;
    const dot = $("#networkDot");

    dot.classList.toggle("offline", !online);
    $("#networkText").textContent = online ? "ONLINE" : "OFFLINE";
    $("#metricNetwork").textContent = online ? "ONLINE" : "OFFLINE";
  }

  function updateMetrics() {
    $("#metricThreads").textContent =
      navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : "—";

    $("#metricMemory").textContent =
      navigator.deviceMemory
        ? `${navigator.deviceMemory} GB`
        : "N/A";
  }

  function updateGreeting() {
    const hour = new Date().getHours();

    let text = "SYSTEM";

    if (hour >= 5 && hour < 12) text = "GOOD MORNING";
    else if (hour >= 12 && hour < 18) text = "GOOD AFTERNOON";
    else if (hour >= 18 && hour < 24) text = "GOOD EVENING";

    $("#greeting").textContent = text;
  }

  function showPage(page) {
    state.page = page;

    $("#home").classList.toggle("hidden", page !== "home");
    $("#apps").classList.toggle("hidden", page !== "apps");
  }

  const apps = {
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
    const app = apps[name];

    if (!app) return;

    state.currentApp = name;

    $("#appHeaderLabel").textContent = app.label;
    $("#appHeaderTitle").textContent = app.title;
    $("#appView").classList.remove("hidden");

    $("#appContent").innerHTML = "";
    app.render($("#appContent"));

    addTimeline(`${app.title} opened`);

    requestAnimationFrame(() => {
      const focusTarget = $("#appContent input, #appContent textarea");
      if (focusTarget && name === "terminal") focusTarget.focus();
    });
  }

  function closeApp() {
    if (state.currentApp) {
      addTimeline(`${apps[state.currentApp].title} closed`);
    }

    state.currentApp = null;
    $("#appView").classList.add("hidden");
    $("#appContent").innerHTML = "";
  }

  function renderTerminal(root) {
    root.innerHTML = `
      <div class="terminal">
        <div id="terminalOutput" class="terminal-output">
MINDOS Terminal ${VERSION}
Type "help" to see available commands.
      </div>

        <form id="terminalForm" class="terminal-form">
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

    $("#terminalForm").addEventListener("submit", event => {
      event.preventDefault();

      const input = $("#terminalInput");
      const command = input.value.trim();

      if (!command) return;

      runCommand(command);
      input.value = "";
    });
  }

  function printTerminal(text) {
    const output = $("#terminalOutput");

    if (!output) return;

    output.innerHTML += `\n${escapeHTML(text)}`;
    output.scrollTop = output.scrollHeight;
  }

  function runCommand(raw) {
    const command = raw.toLowerCase();

    printTerminal(`\n> ${raw}`);

    if (command === "help") {
      printTerminal(
`apps
open <app>
status
version
theme dark
theme light
clear
about`
      );
      return;
    }

    if (command === "apps") {
      printTerminal(Object.keys(apps).join("\n"));
      return;
    }

    if (command.startsWith("open ")) {
      const name = command.slice(5).trim();

      if (apps[name]) {
        openApp(name);
      } else {
        printTerminal(`Unknown app: ${name}`);
      }

      return;
    }

    if (command === "status") {
      printTerminal(
`CORE: READY
NETWORK: ${navigator.onLine ? "ONLINE" : "OFFLINE"}
THREADS: ${navigator.hardwareConcurrency || "N/A"}
MEMORY: ${navigator.deviceMemory ? navigator.deviceMemory + " GB" : "N/A"}`
      );
      return;
    }

    if (command === "version") {
      printTerminal(`MINDOS ${VERSION}`);
      return;
    }

    if (command === "theme dark") {
      setTheme("dark");
      printTerminal("Theme set to dark.");
      return;
    }

    if (command === "theme light") {
      setTheme("light");
      printTerminal("Light theme is not enabled in this build.");
      return;
    }

    if (command === "clear") {
      $("#terminalOutput").textContent = "";
      return;
    }

    if (command === "about") {
      printTerminal(
"MINDOS is a lightweight browser operating system."
      );
      return;
    }

    printTerminal(`Command not found: ${raw}`);
  }

  function renderFiles(root) {
    const files = [
      ["system/core.mind", "System"],
      ["user/notes.mind", "Workspace"],
      ["user/settings.json", "Configuration"],
      ["logs/timeline.log", "System log"]
    ];

    root.innerHTML = `
      <div class="file-list">
        ${files.map(([name, type]) => `
          <div class="file">
            <div>
              <strong>${escapeHTML(name)}</strong>
              <small>${escapeHTML(type)}</small>
            </div>
            <span>›</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderNotes(root) {
    const saved = storage.get("mindos_notes", "");

    root.innerHTML = `
      <div class="notes">
        <textarea id="notesArea" placeholder="Write something...">${escapeHTML(saved)}</textarea>
        <button id="saveNotes" class="primary" type="button">Save note</button>
      </div>
    `;

    $("#saveNotes").addEventListener("click", () => {
      storage.set("mindos_notes", $("#notesArea").value);
      addTimeline("Note saved");
      showToast("Note saved");
    });
  }

  function renderCalculator(root) {
    root.innerHTML = `
      <div class="calc">
        <div id="calcDisplay" class="calc-display">0</div>

        <div class="calc-grid">
          <button type="button" data-calc="clear">C</button>
          <button type="button" data-calc="back">⌫</button>
          <button type="button" data-calc="operator">÷</button>
          <button type="button" data-calc="operator">×</button>

          <button type="button" data-calc="number">7</button>
          <button type="button" data-calc="number">8</button>
          <button type="button" data-calc="number">9</button>
          <button type="button" data-calc="operator">−</button>

          <button type="button" data-calc="number">4</button>
          <button type="button" data-calc="number">5</button>
          <button type="button" data-calc="number">6</button>
          <button type="button" data-calc="operator">+</button>

          <button type="button" data-calc="number">1</button>
          <button type="button" data-calc="number">2</button>
          <button type="button" data-calc="number">3</button>
          <button class="equal" type="button" data-calc="equal">=</button>

          <button type="button" data-calc="number">0</button>
          <button type="button" data-calc="decimal">.</button>
        </div>
      </div>
    `;

    root.querySelectorAll("[data-calc]").forEach(button => {
      button.addEventListener("click", () => {
        calculatorInput(button.dataset.calc, button.textContent);
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
    if (display) display.textContent = "0";
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

      display.textContent = state.calcValue;
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

      display.textContent = state.calcValue;
      return;
    }

    if (action === "decimal") {
      if (state.calcReset) {
        state.calcValue = "0.";
        state.calcReset = false;
      } else if (!state.calcValue.includes(".")) {
        state.calcValue += ".";
      }

      display.textContent = state.calcValue;
      return;
    }

    if (action === "operator") {
      const number = Number(state.calcValue);

      if (state.calcPrevious !== null && state.calcOperator) {
        state.calcPrevious = calculate(
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
      display.textContent = state.calcPrevious;
      return;
    }

    if (action === "equal") {
      if (state.calcPrevious === null || !state.calcOperator) return;

      const result = calculate(
        state.calcPrevious,
        Number(state.calcValue),
        state.calcOperator
      );

      state.calcValue = String(result);
      state.calcPrevious = null;
      state.calcOperator = null;
      state.calcReset = true;

      display.textContent = state.calcValue;
    }
  }

  function calculate(a, b, operator) {
    if (operator === "+") return a + b;
    if (operator === "-") return a - b;
    if (operator === "*") return a * b;

    if (operator === "/") {
      return b === 0 ? 0 : a / b;
    }

    return b;
  }

  function renderMonitor(root) {
    const connection = navigator.connection;

    const rows = [
      ["MINDOS", VERSION],
      ["ONLINE", navigator.onLine ? "YES" : "NO"],
      ["CORES", navigator.hardwareConcurrency || "N/A"],
      ["MEMORY", navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "N/A"],
      ["LANGUAGE", navigator.language || "N/A"],
      ["PLATFORM", navigator.platform || "N/A"],
      ["SCREEN", `${screen.width} × ${screen.height}`],
      ["DPR", window.devicePixelRatio || 1],
      ["NETWORK", connection?.effectiveType || "N/A"],
      ["REDUCED MOTION",
        matchMedia("(prefers-reduced-motion: reduce)").matches ? "YES" : "NO"]
    ];

    root.innerHTML = `
      <div class="diag-grid">
        ${rows.map(([name, value]) => `
          <div class="diag">
            <span>${escapeHTML(name)}</span>
            <strong>${escapeHTML(value)}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderSettings(root) {
    const noteSize = new Blob([
      storage.get("mindos_notes", "")
    ]).size;

    root.innerHTML = `
      <div class="settings-list">
        <div class="setting">
          <strong>MINDOS version</strong>
          <small>${VERSION}</small>
        </div>

        <div class="setting">
          <strong>Storage</strong>
          <small>Notes: ${noteSize} bytes</small>
        </div>

        <div class="setting">
          <strong>Theme</strong>
          <small>Dark system interface</small>
        </div>

        <div class="setting">
          <strong>Offline mode</strong>
          <small>Core applications do not require a server.</small>
        </div>

        <button id="clearData" class="primary" type="button">
          Reset local data
        </button>
      </div>
    `;

    $("#clearData").addEventListener("click", () => {
      const confirmed = confirm(
        "Delete MINDOS notes, timeline and local settings?"
      );

      if (!confirmed) return;

      localStorage.removeItem("mindos_notes");
      localStorage.removeItem("mindos_timeline");

      renderSettings(root);
      renderTimeline();

      showToast("Local data cleared");
    });
  }

  function setTheme(theme) {
    storage.set("mindos_theme", theme);
  }

  function clearTimeline() {
    storage.set("mindos_timeline", []);
    renderTimeline();
    showToast("Timeline cleared");
  }

  function renderSmartActions() {
    const box = $("#smartActions");
    const notes = storage.get("mindos_notes", "");

    if (notes.trim()) {
      box.classList.remove("hidden");

      box.innerHTML = `
        <div class="eyebrow">SMART ACTION</div>
        <div class="smart-title">Your workspace is ready.</div>
        <div class="smart-text">
          You have a saved note. Open it and continue where you stopped.
        </div>
        <button class="smart-action" data-app="notes" type="button">
          Open Notes →
        </button>
      `;

      return;
    }

    box.classList.add("hidden");
  }

  document.addEventListener("click", event => {
    const appButton = event.target.closest("[data-app]");

    if (appButton) {
      openApp(appButton.dataset.app);
      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) return;

    const action = actionButton.dataset.action;

    if (action === "home") showPage("home");
    if (action === "apps") showPage("apps");
    if (action === "clearTimeline") clearTimeline();
  });

  $("#backButton").addEventListener("click", closeApp);

  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
      await navigator.serviceWorker.register("sw.js");
    } catch (error) {
      console.warn("Service Worker:", error);
    }
  }

  function init() {
    updateClock();
    updateNetwork();
    updateMetrics();
    updateGreeting();
    renderTimeline();
    renderSmartActions();

    setInterval(updateClock, 30000);

    $("#boot").classList.add("hidden");
    $("#app").classList.remove("hidden");

    $("#jsStatus").textContent = "SYSTEM READY";
    $("#coreStatus").textContent = "CORE READY";
    $("#readyIndicator").textContent = "● READY";

    addTimeline("MINDOS started");

    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();