const STORAGE_KEYS = {
  players: "impostorKids.players",
  settings: "impostorKids.settings",
  stats: "impostorKids.stats"
};

const state = {
  players: [],
  stats: {},
  round: 1,
  minutes: 3,
  currentDealIndex: 0,
  impostorIndex: -1,
  starterIndex: -1,
  lastImpostor: null,
  lastStarter: null,
  category: "",
  word: "",
  timerId: null,
  secondsLeft: 180,
  timerPaused: false,
  previousScreen: "setupScreen",
  soundsEnabled: true,
  theme: "light"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const screens = {
  setup: $("#setupScreen"),
  deal: $("#dealScreen"),
  round: $("#roundScreen"),
  vote: $("#voteScreen"),
  result: $("#resultScreen"),
  stats: $("#statsScreen")
};

let audioContext;

function loadState() {
  // LocalStorage trzyma imiona, ustawienia i statystyki osobno, żeby można było czyścić je niezależnie.
  const savedPlayers = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || "[]");
  const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}");
  state.players = savedPlayers.length ? savedPlayers : ["Maja", "Tomek", "Ola", "Kuba"];
  state.stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || "{}");
  state.minutes = savedSettings.minutes || 3;
  state.round = savedSettings.round || 1;
  state.soundsEnabled = savedSettings.soundsEnabled !== false;
  state.theme = savedSettings.theme || "light";
}

function savePlayers() {
  localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(state.players));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
    minutes: state.minutes,
    round: state.round,
    soundsEnabled: state.soundsEnabled,
    theme: state.theme
  }));
}

function saveStats() {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(state.stats));
}

function ensureStats(name) {
  if (!state.stats[name]) {
    state.stats[name] = { points: 0, impostor: 0, starter: 0, rounds: 0 };
  }
  return state.stats[name];
}

function playSound(type) {
  if (!state.soundsEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  // Krótkie dźwięki są generowane Web Audio API, więc PWA nie potrzebuje dodatkowych plików audio.
  audioContext = audioContext || new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const tones = {
    reveal: [620, 0.12],
    next: [420, 0.08],
    start: [520, 0.18],
    end: [180, 0.55],
    result: [760, 0.22]
  };
  const [frequency, duration] = tones[type] || tones.next;

  oscillator.frequency.value = frequency;
  oscillator.type = type === "end" ? "sawtooth" : "sine";
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  if (name !== "stats") state.previousScreen = screens[name].id;
}

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
  $("#themeToggle").textContent = state.theme === "dark" ? "☾" : "☀";
  document.querySelector('meta[name="theme-color"]').setAttribute("content", state.theme === "dark" ? "#12151f" : "#ffda6b");
}

function updateSoundButton() {
  $("#soundToggle").textContent = state.soundsEnabled ? "♪" : "×";
  $("#soundToggle").setAttribute("aria-label", state.soundsEnabled ? "Wyłącz dźwięki" : "Włącz dźwięki");
}

function renderSetup() {
  $("#roundCounter").textContent = `Runda ${state.round}`;
  $("#playerCount").value = state.players.length;
  $("#playerCountLabel").textContent = `${state.players.length} graczy`;
  $$(".segmented button").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.minutes) === state.minutes);
  });

  const grid = $("#playersGrid");
  grid.innerHTML = "";
  state.players.forEach((name, index) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = name;
    input.placeholder = `Gracz ${index + 1}`;
    input.maxLength = 18;
    input.addEventListener("input", () => {
      state.players[index] = input.value.trim();
      savePlayers();
    });
    grid.append(input);
  });
}

function setPlayerCount(count) {
  const names = state.players.slice(0, count);
  while (names.length < count) names.push(`Gracz ${names.length + 1}`);
  state.players = names;
  savePlayers();
  renderSetup();
}

function randomIndex(length, forbiddenIndex) {
  // Ogranicza powtórki tej samej osoby jako impostora lub rozpoczynającego w kolejnych rundach.
  if (length <= 1) return 0;
  let index = Math.floor(Math.random() * length);
  while (index === forbiddenIndex) {
    index = Math.floor(Math.random() * length);
  }
  return index;
}

function chooseRoundData() {
  const categories = Object.keys(window.IMPOSTOR_WORDS);
  state.category = categories[Math.floor(Math.random() * categories.length)];
  const words = window.IMPOSTOR_WORDS[state.category];
  state.word = words[Math.floor(Math.random() * words.length)];
  state.impostorIndex = randomIndex(state.players.length, state.lastImpostor);
  state.starterIndex = randomIndex(state.players.length, state.lastStarter);
  state.lastImpostor = state.impostorIndex;
  state.lastStarter = state.starterIndex;
}

function startDeal() {
  state.players = state.players.map((name, index) => name.trim() || `Gracz ${index + 1}`);
  savePlayers();
  chooseRoundData();
  state.currentDealIndex = 0;
  renderDeal();
  playSound("start");
  showScreen("deal");
}

function renderDeal() {
  const player = state.players[state.currentDealIndex];
  $("#passOrder").textContent = `Gracz ${state.currentDealIndex + 1} z ${state.players.length}`;
  $("#currentPlayerName").textContent = player;
  hideRole();
}

function revealRole() {
  const isImpostor = state.currentDealIndex === state.impostorIndex;
  const roleCard = $("#roleCard");
  roleCard.classList.remove("hidden-role", "impostor");
  roleCard.classList.toggle("impostor", isImpostor);
  $("#roleLabel").textContent = isImpostor ? "Jesteś impostorem" : "Twoje hasło";
  $("#roleValue").textContent = isImpostor ? "IMPOSTOR" : state.word;
  $("#roleHint").textContent = isImpostor ? `Kategoria: ${state.category}` : `Kategoria: ${state.category}`;
  playSound("reveal");
}

function hideRole() {
  $("#revealSlider").value = 0;
  $("#roleCard").className = "role-card hidden-role";
  $("#roleLabel").textContent = "Tajna rola";
  $("#roleValue").textContent = "Ukryta";
  $("#roleHint").textContent = "Przesuń suwak do końca";
}

function nextPlayer() {
  playSound("next");
  if (state.currentDealIndex < state.players.length - 1) {
    state.currentDealIndex += 1;
    renderDeal();
    return;
  }
  startRound();
}

function startRound() {
  // Statystyki rund zapisujemy od razu po rozpoczęciu, nawet jeśli głosowanie nastąpi przed końcem czasu.
  ensureStats(state.players[state.impostorIndex]).impostor += 1;
  ensureStats(state.players[state.starterIndex]).starter += 1;
  state.players.forEach((name) => ensureStats(name).rounds += 1);
  saveStats();

  $("#categoryLabel").textContent = `Kategoria: ${state.category}`;
  $("#starterName").textContent = state.players[state.starterIndex];
  state.secondsLeft = state.minutes * 60;
  state.timerPaused = false;
  $("#pauseTimer").textContent = "Pauza";
  updateTimer();
  clearInterval(state.timerId);
  state.timerId = setInterval(tickTimer, 1000);
  playSound("start");
  showScreen("round");
}

function tickTimer() {
  // Timer działa prosto i przewidywalnie na telefonie: jedna sekunda, jeden zapis ekranu.
  if (state.timerPaused) return;
  state.secondsLeft -= 1;
  updateTimer();
  if (state.secondsLeft <= 0) {
    clearInterval(state.timerId);
    playSound("end");
    renderVote();
    showScreen("vote");
  }
}

function updateTimer() {
  const minutes = Math.max(0, Math.floor(state.secondsLeft / 60));
  const seconds = Math.max(0, state.secondsLeft % 60);
  $("#timerDisplay").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  $("#timerDisplay").classList.toggle("warning", state.secondsLeft <= 20);
}

function renderVote() {
  clearInterval(state.timerId);
  const list = $("#voteList");
  list.innerHTML = "";
  state.players.forEach((name, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.addEventListener("click", () => finishGame(index));
    list.append(button);
  });
}

function finishGame(chosenIndex) {
  // Punktacja jest czytelna dla dzieci: drużyna dostaje po punkcie albo impostor dostaje dwa.
  const crewWon = chosenIndex === state.impostorIndex;
  if (crewWon) {
    state.players.forEach((name, index) => {
      if (index !== state.impostorIndex) ensureStats(name).points += 1;
    });
  } else {
    ensureStats(state.players[state.impostorIndex]).points += 2;
  }

  saveStats();
  $("#resultBadge").textContent = crewWon ? "Impostor złapany" : "Impostor uciekł";
  $("#resultText").textContent = crewWon ? "Drużyna zdobywa punkty!" : "Impostor zdobywa 2 punkty!";
  $("#finalCategory").textContent = state.category;
  $("#finalWord").textContent = state.word;
  $("#finalImpostor").textContent = state.players[state.impostorIndex];
  renderRanking();
  playSound("result");
  showScreen("result");
}

function sortedPlayers() {
  return state.players
    .map((name) => ({ name, ...ensureStats(name) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pl"));
}

function renderRanking() {
  const medals = ["🥇", "🥈", "🥉"];
  $("#rankingList").innerHTML = sortedPlayers().map((player, index) => `
    <li>
      <span class="medal">${medals[index] || `${index + 1}.`}</span>
      <strong>${escapeHtml(player.name)}</strong>
      <span class="score">${player.points} pkt</span>
    </li>
  `).join("");
}

function renderStats() {
  const names = Object.keys(state.stats).sort((a, b) => state.stats[b].points - state.stats[a].points || a.localeCompare(b, "pl"));
  $("#statsList").innerHTML = names.length ? names.map((name) => {
    const stats = state.stats[name];
    return `
      <article class="stat-card">
        <strong>${escapeHtml(name)}</strong>
        <div class="stat-grid">
          <span><b>${stats.points}</b>punkty</span>
          <span><b>${stats.impostor}</b>impostor</span>
          <span><b>${stats.starter}</b>zaczynał</span>
          <span><b>${stats.rounds}</b>rundy</span>
        </div>
      </article>
    `;
  }).join("") : `<p class="muted">Po pierwszej rundzie pojawią się tutaj wyniki.</p>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function nextRound() {
  state.round += 1;
  saveSettings();
  renderSetup();
  startDeal();
}

function bindEvents() {
  $("#playerCount").addEventListener("input", (event) => setPlayerCount(Number(event.target.value)));
  $$(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      state.minutes = Number(button.dataset.minutes);
      saveSettings();
      renderSetup();
    });
  });
  $("#startDeal").addEventListener("click", startDeal);
  $("#revealSlider").addEventListener("input", (event) => {
    if (Number(event.target.value) >= 98) revealRole();
  });
  $("#hideRole").addEventListener("click", hideRole);
  $("#nextPlayer").addEventListener("click", nextPlayer);
  $("#pauseTimer").addEventListener("click", () => {
    state.timerPaused = !state.timerPaused;
    $("#pauseTimer").textContent = state.timerPaused ? "Wznów" : "Pauza";
  });
  $("#finishRound").addEventListener("click", () => {
    renderVote();
    showScreen("vote");
  });
  $("#nextRound").addEventListener("click", nextRound);
  $("#backToSetup").addEventListener("click", () => {
    renderSetup();
    showScreen("setup");
  });
  $("#statsOpen").addEventListener("click", () => {
    renderStats();
    showScreen("stats");
  });
  $("#closeStats").addEventListener("click", () => {
    document.getElementById(state.previousScreen).classList.add("active");
    $("#statsScreen").classList.remove("active");
  });
  $("#resetStats").addEventListener("click", () => {
    if (confirm("Wyczyścić wszystkie statystyki?")) {
      state.stats = {};
      saveStats();
      renderStats();
    }
  });
  $("#themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveSettings();
  });
  $("#soundToggle").addEventListener("click", () => {
    state.soundsEnabled = !state.soundsEnabled;
    updateSoundButton();
    saveSettings();
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

loadState();
applyTheme();
updateSoundButton();
renderSetup();
bindEvents();
registerServiceWorker();
