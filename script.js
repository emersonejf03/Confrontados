/* =========================================================
   CULTO JOVEM — CONTAGEM REGRESSIVA
   script.js

   Organização:
   1. Configurações gerais
   2. Referências do DOM
   3. Estado global
   4. Controle de vídeos (crossfade)
   5. Cronômetro / motor de tempo
   6. Intensidade progressiva
   7. Momentos cinematográficos (frases)
   8. Últimos 30s (flash cuts)
   9. Contagem final 10 → 1
   10. Sequência final 00:00
   11. Fullscreen
   12. Atalhos de teclado
   13. Cursor automático
   14. Inicialização
   ========================================================= */

/* =========================================================
   1. CONFIGURAÇÕES GERAIS
   ========================================================= */
const CONFIG = {
  totalSeconds: 10 * 60, // duração total da contagem: 10 minutos

  videos: [
    "videos/video1.mp4",
    "videos/video2.mp4",
    "videos/video3.mp4",
    "videos/video4.mp4",
    "videos/video5.mp4",
    "videos/video6.mp4",
    "videos/video7.mp4",
    "videos/video8.mp4",
    "videos/video9.mp4",
    "videos/video10.mp4",
    "videos/video11.mp4",
    "videos/video12.mp4",
  ],

  crossfadeDuration: 1200, // ms — precisa bater com a transition do CSS (.bg-video)

  // Momentos cinematográficos: em qual segundo restante disparar,
  // frase exibida, duração em cena (ms) e se aplica zoom no vídeo.
  // "phrase" é HTML: envolva a parte que deve ficar em fonte script
  // com <span class="accent-script">...</span> (minúsculas) e o
  // destaque em caixa alta com <span class="accent-bold">...</span>,
  // seguindo o estilo do vídeo de referência (script + condensada).
  cinematicMoments: [
    {
      atSecond: 9 * 60,
      phrase: '<span class="accent-script">Todo mundo tem uma opinião.</span> <span class="accent-bold">TODO MUNDO ESCOLHE UM LADO.</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 8 * 60,
      phrase: '<span class="accent-script">O mundo diz quem você deve ser.</span> <span class="accent-bold">MAS QUEM DEFINE VOCÊ?</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 6 * 60,
      phrase: '<span class="accent-script">Existem momentos em que fugir é mais fácil...</span> <span class="accent-bold">MAS ATÉ QUANDO?</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 4 * 60 + 30,
      phrase: '<span class="accent-script confrontation-words">TRISTEZA. ARREPENDIMENTOS. MEDO. ORGULHO. DESÂNIMO.</span> <span class="accent-bold">TUDO ISSO NOS CONFRONTA.</span> <span class="accent-question">MAS A QUESTÃO É: COMO VOCÊ VAI RESPONDER?</span>',
      duration: 15000, zoom: true, special: 'confrontation',
    },
    {
      atSecond: 2 * 60 + 30,
      phrase: '<span class="accent-script">Talvez tenham dito que...</span> <span class="accent-bold">NOSSA GERAÇÃO ESTÁ PERDIDA.</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 2 * 60 + 20,
      phrase: '<span class="accent-script">ou talvez esteja sendo</span> <span class="accent-bold">DESPERTADA.</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 45,
      phrase: '<span class="accent-script">A pergunta não é se o confronto virá...</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 35,
      phrase: '<span class="accent-bold">ELE JÁ COMEÇOU.</span>',
      duration: 15000, zoom: true,
    },
    {
      atSecond: 20,
      phrase: '<span class="accent-script">Então só resta uma pergunta...</span> <span class="accent-bold">QUAL SERÁ A SUA POSIÇÃO?</span>',
      duration: 15000, zoom: true,
    },
  ],

  // Momentos em que o vídeo vira protagonista. Os dois vídeos novos e o video3
  // foram escolhidos por serem horizontais e preencherem melhor o telão.
  videoHighlights: [
    { atSecond: 8 * 60 + 15, src: "videos/video11.mp4", duration: 8500, word: "" },
    { atSecond: 5 * 60 + 30, src: "videos/video12.mp4", duration: 8500, word: "ESCOLHAS." },
    { atSecond: 2 * 60, src: "videos/video3.mp4", duration: 8500, word: "POSIÇÃO." },
  ],

  // Momentos de "check-in" do cronômetro: ele sai do canto discreto,
  // volta grande ao centro por alguns segundos, e depois volta a ser discreto.
  timerReveal: {
    atSeconds: [7 * 60, 5 * 60, 3 * 60, 1 * 60 + 30],
    duration: 10000,
  },

  // Limiares (em segundos restantes) que definem as fases de intensidade
  intensity: {
    calmUntil: 5 * 60,       // 10:00 -> 05:00 : calmo
    risingUntil: 1 * 60,     // 05:00 -> 01:00 : subindo energia
    finalUntil: 10,          // 01:00 -> 00:10 : expectativa alta
    // abaixo de 00:10        : contagem final 10 -> 1
  },

  // Duração de cada vídeo por fase (ms) — vídeos mais curtos = cortes mais rápidos
  videoDurationByPhase: {
    calm: 45000,
    rising: 28000,
    final: 16000,
  },

  // Flash cuts nos últimos 30 segundos
  lastSeconds: {
    threshold: 30,
    flashEveryMs: 4000,
  },

  // Textos da sequência final (00:00 em diante)
  // "text" também aceita HTML com accent-script / accent-bold
  finalSequence: [
    {
      text: '<span class="accent-script">o culto</span> <span class="accent-bold">VAI COMEÇAR</span>',
      size: "normal",
      hold: 2200,
    },
    {
      text: '<span class="accent-script">seja</span> <span class="accent-bold">BEM-VINDO</span>',
      size: "normal",
      hold: 2200,
    },
    {
      // sem span aqui de propósito: o gradiente de texto (.msg-huge) precisa
      // pintar o texto diretamente, sem um <span> filho com cor própria por cima
      text: "VAMOSSS COM TUDOOOOO!",
      size: "huge",
      hold: 2600,
    },
  ],
};

/* =========================================================
   2. REFERÊNCIAS DO DOM
   ========================================================= */
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");

const stage = document.getElementById("stage");
const videoA = document.getElementById("video-a");
const videoB = document.getElementById("video-b");

const timerWrapper = document.getElementById("timer-wrapper");
const timerCornerEl = document.getElementById("timer-corner");
const timerHeroEl = document.getElementById("timer-hero");

const cornerLogo = document.getElementById("corner-logo");
const flashOverlay = document.getElementById("flash-overlay");

const phraseDisplay = document.getElementById("phrase-display");
const videoHighlight = document.getElementById("video-highlight");
const highlightVideo = document.getElementById("highlight-video");
const highlightWord = document.getElementById("highlight-word");
const finalCountEl = document.getElementById("final-count");

const finalScreen = document.getElementById("final-screen");
const finalMessageEl = document.getElementById("final-message");

const progressTrack = document.getElementById("progress-bar-track");
const progressFill = document.getElementById("progress-bar-fill");

/* =========================================================
   3. ESTADO GLOBAL
   ========================================================= */
const state = {
  secondsLeft: CONFIG.totalSeconds,
  running: false,
  intervalId: null,

  videos: [...CONFIG.videos],
  videoIndex: 0,
  activeVideoEl: videoA,
  idleVideoEl: videoB,
  videoTimeoutId: null,

  triggeredMoments: new Set(), // evita disparar o mesmo momento 2x
  inCinematicMoment: false,
  inVideoHighlight: false,
  triggeredVideoHighlights: new Set(),

  triggeredTimerReveals: new Set(),
  timerPeriodicReveal: false, // true enquanto um "check-in" do cronômetro está ativo

  lastFlashTime: 0,
  finalSequenceStarted: false,
  finalCountdownTimeoutId: null,

  cursorTimeoutId: null,

  // incrementado a cada restartPresentation(); os setTimeout longos de
  // playCinematicMoment/checkTimerReveal/playVideoHighlight guardam a
  // geração vigente no início e conferem antes de cada passo, assim uma
  // cadeia antiga (de antes de um "R") nunca mexe no estado da nova sessão.
  generation: 0,

  // timestamp (Date.now()) em que a contagem deve chegar a zero; é a partir
  // dele que cada tick recalcula secondsLeft, então pequenos atrasos do
  // setInterval não acumulam ao longo dos 10 minutos.
  endTime: null,
};

/* =========================================================
   4. CONTROLE DE VÍDEOS (crossfade entre 2 <video>)
   ========================================================= */

function currentPhase() {
  const s = state.secondsLeft;
  if (s > CONFIG.intensity.calmUntil) return "calm";
  if (s > CONFIG.intensity.risingUntil) return "rising";
  return "final";
}

// Carrega uma fonte de vídeo em um elemento sem trocar o que está visível
function preload(videoEl, src) {
  if (videoEl.dataset.src === src) return; // já carregado
  videoEl.src = src;
  videoEl.dataset.src = src;
  videoEl.load();
}

function nextVideoSrc() {
  state.videoIndex = (state.videoIndex + 1) % state.videos.length;
  return state.videos[state.videoIndex];
}

// Faz o crossfade do vídeo ativo para o próximo, e agenda o seguinte
function playNextVideo() {
  const incoming = state.idleVideoEl;
  const outgoing = state.activeVideoEl;

  incoming.currentTime = 0;
  incoming.play().catch(() => {});

  incoming.classList.add("active");
  outgoing.classList.remove("active");

  // troca os papéis
  state.activeVideoEl = incoming;
  state.idleVideoEl = outgoing;

  // depois do crossfade, pausa o vídeo escondido para poupar recursos
  setTimeout(() => {
    outgoing.pause();
  }, CONFIG.crossfadeDuration);

  // pré-carrega o PRÓXIMO vídeo (o que ainda não é nem o ativo nem o que acabou de sair)
  const upcomingSrc = state.videos[(state.videoIndex + 1) % state.videos.length];
  preload(state.idleVideoEl, upcomingSrc);

  scheduleNextVideoSwap();
}

function scheduleNextVideoSwap() {
  clearTimeout(state.videoTimeoutId);
  const phase = currentPhase();
  const duration = CONFIG.videoDurationByPhase[phase];

  state.videoTimeoutId = setTimeout(() => {
    if (!state.running) return;
    nextVideoSrc();
    playNextVideo();
  }, duration);
}

function handleVideoEnded(event) {
  if (!state.running || event.currentTarget !== state.activeVideoEl) return;
  clearTimeout(state.videoTimeoutId);
  nextVideoSrc();
  playNextVideo();
}

videoA.addEventListener('ended', handleVideoEnded);
videoB.addEventListener('ended', handleVideoEnded);

function initVideos() {
  // vídeo A começa tocando o primeiro da lista
  preload(videoA, state.videos[0]);
  videoA.play().catch(() => {});

  // vídeo B já prepara o segundo, em segundo plano
  preload(videoB, state.videos[1] ?? state.videos[0]);

  scheduleNextVideoSwap();
}

// Usado pelos atalhos de seta (operador troca manualmente)
function forceVideoChange(direction) {
  clearTimeout(state.videoTimeoutId);
  if (direction === "next") {
    nextVideoSrc();
  } else {
    state.videoIndex =
      (state.videoIndex - 1 + state.videos.length) % state.videos.length;
  }
  playNextVideo();
}

/* =========================================================
   5. CRONÔMETRO / MOTOR DE TEMPO
   ========================================================= */

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  const text = formatTime(state.secondsLeft);
  timerCornerEl.textContent = text;
  timerHeroEl.textContent = text;

  const urgent = state.secondsLeft <= 60;
  timerHeroEl.classList.toggle("urgent", urgent);

  // Revelado (grande, centralizado, via crossfade) quando: estamos no
  // último minuto (urgente) OU um check-in periódico está em andamento.
  const shouldReveal = state.timerPeriodicReveal;
  timerHeroEl.classList.toggle("show", shouldReveal);
  timerCornerEl.classList.toggle("faded", shouldReveal);
}

// Faz o cronômetro grande fazer um crossfade sobre o pequeno por alguns
// segundos (sem zoom: só opacidade + leve desfoque/deslocamento), depois
// volta ao estado discreto.
function prepareLetterDissolve() {
  const targets = [
    document.querySelector('.theme-title'),
    document.querySelector('.theme-kicker'),
    document.querySelector('#timer-wrapper small')
  ].filter(Boolean);

  targets.forEach((el) => {
    if (!el.dataset.originalText) el.dataset.originalText = el.textContent;
    const text = el.dataset.originalText;
    el.innerHTML = [...text].map((char, i) => {
      const safe = char === ' ' ? '&nbsp;' : char;
      return `<span class="dissolve-letter" style="--i:${i}">${safe}</span>`;
    }).join('');
  });
}

function restoreDissolveText() {
  document.querySelectorAll('[data-original-text]').forEach((el) => {
    el.textContent = el.dataset.originalText;
    el.classList.remove('letter-dissolve');
  });
}

function checkTimerReveal() {
  const { atSeconds, duration } = CONFIG.timerReveal;

  if (
    atSeconds.includes(state.secondsLeft) &&
    !state.triggeredTimerReveals.has(state.secondsLeft)
  ) {
    state.triggeredTimerReveals.add(state.secondsLeft);
    const gen = state.generation;

    // 1) desmonta a identidade letra por letra e escurece a cena
    prepareLetterDissolve();
    stage.classList.add('focus-transition');
    document.querySelectorAll('[data-original-text]').forEach((el) => {
      requestAnimationFrame(() => el.classList.add('letter-dissolve'));
    });

    // 2) o relógio do canto viaja suavemente em direção ao centro.
    // Só então trocamos para o relógio hero, evitando o congelamento no canto.
    setTimeout(() => {
      if (gen !== state.generation) return;
      state.timerPeriodicReveal = false;
      updateTimerDisplay();

      setTimeout(() => {
        if (gen !== state.generation) return;
        stage.classList.remove('focus-transition');
        stage.classList.add('timer-focus');
        updateTimerDisplay();

        // o cronômetro fica sozinho por ~10 s, respirando no centro
        setTimeout(() => {
          if (gen !== state.generation) return;
          state.timerPeriodicReveal = false;
          stage.classList.add('focus-return');
          stage.classList.remove('timer-focus');
          updateTimerDisplay();

          setTimeout(() => {
            if (gen !== state.generation) return;
            restoreDissolveText();
            stage.classList.remove('focus-return');
          }, 1100);
        }, duration);
      }, 1250);
    }, 180);
  }
}

function updateProgressBar() {
  const elapsed = CONFIG.totalSeconds - state.secondsLeft;
  const pct = (elapsed / CONFIG.totalSeconds) * 100;
  progressFill.style.width = `${pct}%`;
  progressTrack.classList.toggle("emphasized", state.secondsLeft <= 60);
}

function tick() {
  if (!state.running) return;

  // recalcula a partir do relógio real (não apenas "secondsLeft--"), para
  // que atrasos do setInterval (aba em segundo plano, thread ocupada etc.)
  // não acumulem ao longo dos 10 minutos.
  state.secondsLeft = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));

  updateTimerDisplay();
  updateProgressBar();
  checkCinematicMoments();
  checkVideoHighlights();
  checkTimerReveal();
  checkLastSecondsEffects();

  if (state.secondsLeft <= 10 && !state.finalSequenceStarted) {
    startFinalCountdown();
    return; // a contagem final assume o controle do "tick" a partir daqui
  }

  if (state.secondsLeft <= 0) {
    stopTimer();
  }
}

// (re)inicia o relógio de referência a partir do secondsLeft atual e liga o
// motor de tick. Chamado tanto no início quanto ao voltar de uma pausa.
function startTimer() {
  state.running = true;
  state.endTime = Date.now() + state.secondsLeft * 1000;
  clearInterval(state.intervalId);
  state.intervalId = setInterval(tick, 1000);
  updateTimerDisplay();
  updateProgressBar();
}

function stopTimer() {
  state.running = false;
  clearInterval(state.intervalId);
}

function updatePauseButton() {
  if (!pauseButton) return;
  pauseButton.innerHTML = state.running ? "❚❚ &nbsp; PAUSAR" : "▶ &nbsp; CONTINUAR";
  pauseButton.classList.toggle("paused", !state.running);
}

function pausePresentation() {
  stopTimer();
  clearTimeout(state.videoTimeoutId);
  videoA.pause();
  videoB.pause();
  updatePauseButton();
}

function resumePresentation() {
  startTimer();
  state.activeVideoEl.play().catch(() => {});
  scheduleNextVideoSwap();
  updatePauseButton();
}

function toggleTimer() {
  if (state.running) pausePresentation();
  else resumePresentation();
}

function restartPresentation() {
  stopTimer();
  clearTimeout(state.videoTimeoutId);
  clearTimeout(state.finalCountdownTimeoutId);
  state.generation++; // invalida qualquer setTimeout de efeito ainda pendente

  state.secondsLeft = CONFIG.totalSeconds;
  state.triggeredMoments.clear();
  state.triggeredVideoHighlights.clear();
  state.triggeredTimerReveals.clear();
  state.timerPeriodicReveal = false;
  stage.classList.remove("timer-focus");
  state.inCinematicMoment = false;
  state.finalSequenceStarted = false;
  state.videoIndex = 0;

  finalScreen.classList.remove("show");
  finalCountEl.innerHTML = "";
  phraseDisplay.innerHTML = "";
  timerWrapper.classList.remove("hidden");
  if (cornerLogo) cornerLogo.classList.remove("hidden");

  updateTimerDisplay();
  updateProgressBar();
  initVideos();
  startTimer();
}

/* =========================================================
   6. INTENSIDADE PROGRESSIVA
   (a duração dos vídeos já muda via videoDurationByPhase;
    aqui tratamos os ajustes puramente visuais do timer/barra) 
   ========================================================= */
// A maior parte da "intensidade" já é resolvida por:
// - updateTimerDisplay() -> classe .urgent nos últimos 60s (CSS aumenta e colore)
// - updateProgressBar()  -> classe .emphasized deixa a barra mais grossa
// - scheduleNextVideoSwap() -> vídeos mais curtos conforme a fase avança
// Isso mantém a lógica de "fases" centralizada em CONFIG, fácil de ajustar.

/* =========================================================
   7. MOMENTOS CINEMATOGRÁFICOS
   ========================================================= */

function checkCinematicMoments() {
  if (state.inCinematicMoment) return;

  const moment = CONFIG.cinematicMoments.find(
    (m) => m.atSecond === state.secondsLeft && !state.triggeredMoments.has(m.atSecond)
  );

  if (moment) {
    state.triggeredMoments.add(moment.atSecond);
    playCinematicMoment(moment);
  }
}

function playCinematicMoment(moment) {
  state.inCinematicMoment = true;
  const gen = state.generation;

  // 1. durante a frase, toda a composição some, mas SEM ativar
  // o modo reservado exclusivamente aos 10 segundos finais.
  // Na V16, final-countdown-focus era ativado aqui e nunca removido,
  // deixando a tela vazia justamente ao chegar em 08:00.
  stage.classList.remove("timer-focus", "video-focus", "final-countdown-focus");
  stage.classList.add("phrase-focus");
  timerWrapper.classList.add("hidden");
  if (cornerLogo) cornerLogo.classList.add("hidden");
  phraseDisplay.innerHTML = "";
  phraseDisplay.classList.remove("visible", "cinematic-active");

  // 2. zoom cinematográfico no vídeo ativo
  if (moment.zoom) {
    state.activeVideoEl.classList.add("zoomed");
  }

  // 3. monta a mensagem palavra por palavra, preservando as duas tipografias
  const scene = document.createElement("span");
  scene.className = "phrase-scene";
  if (moment.special) scene.classList.add(`special-${moment.special}`);
  const source = document.createElement("div");
  source.innerHTML = moment.phrase;

  [...source.children].forEach((line, lineIndex) => {
    const lineEl = document.createElement("span");
    lineEl.className = `phrase-line ${line.className}`;
    const words = line.textContent.trim().split(/\s+/);
    words.forEach((word, wordIndex) => {
      const wordEl = document.createElement("span");
      wordEl.className = "phrase-word";
      wordEl.textContent = word;
      let delay = (lineIndex * 1.15) + (wordIndex * 0.34);
      if (moment.special === "confrontation") {
        if (lineIndex === 0) delay = wordIndex * 0.78;
        if (lineIndex === 1) delay = 4.7 + wordIndex * 0.18;
        if (lineIndex === 2) delay = 8.1 + wordIndex * 0.16;
      }
      wordEl.style.setProperty("--word-delay", `${delay}s`);
      wordEl.style.setProperty("--word-index", wordIndex);
      lineEl.appendChild(wordEl);
    });
    scene.appendChild(lineEl);
  });

  phraseDisplay.innerHTML = "";
  phraseDisplay.appendChild(scene);
  phraseDisplay.classList.add("cinematic-active");

  requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.add("show")));

  // 4. nos últimos 3s, as palavras se desfazem em sequência antes do cenário voltar
  setTimeout(() => {
    if (gen !== state.generation) return; // sessão foi reiniciada nesse meio tempo
    scene.classList.add("leaving");
    phraseDisplay.classList.remove("cinematic-active");

    setTimeout(() => {
      if (gen !== state.generation) return;
      phraseDisplay.innerHTML = "";
      state.activeVideoEl.classList.remove("zoomed");
      timerWrapper.classList.remove("hidden");
      if (cornerLogo) cornerLogo.classList.remove("hidden");
      stage.classList.remove("phrase-focus", "final-countdown-focus");
      state.inCinematicMoment = false;
    }, 2800);
  }, Math.max(1000, moment.duration - 3000));
}

function checkVideoHighlights() {
  if (state.inVideoHighlight || state.inCinematicMoment) return;
  const moment = CONFIG.videoHighlights.find(m => m.atSecond === state.secondsLeft && !state.triggeredVideoHighlights.has(m.atSecond));
  if (!moment) return;
  state.triggeredVideoHighlights.add(moment.atSecond);
  playVideoHighlight(moment);
}

function playVideoHighlight(moment) {
  state.inVideoHighlight = true;
  const gen = state.generation;
  stage.classList.add("video-focus");
  highlightVideo.src = moment.src;
  highlightVideo.muted = true; highlightVideo.volume = 0; highlightVideo.currentTime = 0;
  highlightWord.textContent = moment.word || "";
  videoHighlight.classList.add("active");
  const restoreVideoHighlight = () => {
    highlightWord.classList.remove("show");
    videoHighlight.classList.remove("active", "leaving");
    highlightWord.textContent = "";
    stage.classList.remove("video-focus");
    state.inVideoHighlight = false;
  };
  highlightVideo.onended = restoreVideoHighlight;
  highlightVideo.onerror = restoreVideoHighlight;
  highlightVideo.play().catch(restoreVideoHighlight);
  if (moment.word) setTimeout(()=>{ if (gen === state.generation) highlightWord.classList.add("show"); }, 1800);
  setTimeout(()=>{
    if (gen !== state.generation) return;
    highlightWord.classList.remove("show");
    videoHighlight.classList.add("leaving");
    setTimeout(()=>{
      if (gen !== state.generation) return;
      highlightVideo.pause(); videoHighlight.classList.remove("active","leaving");
      highlightWord.textContent=""; stage.classList.remove("video-focus"); state.inVideoHighlight=false;
    }, 1500);
  }, Math.max(2500,moment.duration-1500));
}

/* =========================================================
   8. ÚLTIMOS 30 SEGUNDOS — FLASH CUTS DISCRETOS
   ========================================================= */

function checkLastSecondsEffects() {
  if (state.secondsLeft > CONFIG.lastSeconds.threshold) return;
  if (state.secondsLeft <= 10) return; // essa faixa já é tratada pela contagem final

  const now = Date.now();
  if (now - state.lastFlashTime >= CONFIG.lastSeconds.flashEveryMs) {
    state.lastFlashTime = now;
    flashOverlay.classList.remove("flash");
    void flashOverlay.offsetWidth; // força reflow para poder repetir a animação
    flashOverlay.classList.add("flash");
  }
}

/* =========================================================
   9. CONTAGEM FINAL 10 → 1
   ========================================================= */

function startFinalCountdown() {
  state.finalSequenceStarted = true;
  clearInterval(state.intervalId);

  stage.classList.remove("timer-focus", "phrase-focus", "video-focus");
  stage.classList.add("final-countdown-focus");
  timerWrapper.classList.add("hidden");
  if (cornerLogo) cornerLogo.classList.add("hidden");
  phraseDisplay.innerHTML = "";
  phraseDisplay.classList.remove("visible", "cinematic-active");

  let n = 10;
  finalCountEl.innerHTML = "";
  const gen = state.generation;

  const step = () => {
    if (gen !== state.generation) return; // reiniciado no meio da contagem 10→0

    if (n < 0) {
      startFinalSequence();
      return;
    }

    finalCountEl.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = n;
    finalCountEl.appendChild(span);

    n--;
    state.finalCountdownTimeoutId = setTimeout(step, 1000);
  };

  step();
}

/* =========================================================
   10. SEQUÊNCIA FINAL — 00:00
   ========================================================= */

function startFinalSequence() {
  finalCountEl.innerHTML = "";
  state.running = false;

  // Encerra toda a apresentação e deixa somente a arte oficial.
  stage.classList.remove("final-countdown-focus", "timer-focus", "phrase-focus", "video-focus");
  document.querySelectorAll(".bg-video").forEach((video) => {
    video.pause();
    video.style.opacity = "0";
  });
  highlightVideo.pause();

  finalMessageEl.innerHTML = "";
  finalScreen.className = "show logo-only";
}


/* =========================================================
   11. FULLSCREEN
   ========================================================= */

function enterFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    enterFullscreen();
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

/* =========================================================
   12. ATALHOS DE TECLADO (uso exclusivo do operador)
   ========================================================= */

function handleKeydown(e) {
  switch (e.code) {
    case "Space":
      e.preventDefault();
      toggleTimer();
      break;
    case "KeyR":
      restartPresentation();
      break;
    case "KeyF":
      toggleFullscreen();
      break;
    case "ArrowRight":
      forceVideoChange("next");
      break;
    case "ArrowLeft":
      forceVideoChange("prev");
      break;
    case "KeyC":
      timerWrapper.classList.toggle("hidden");
      break;
  }
}

/* =========================================================
   13. CURSOR AUTOMÁTICO (esconde após inatividade)
   ========================================================= */

function resetCursorTimer() {
  document.body.classList.remove("hide-cursor");
  clearTimeout(state.cursorTimeoutId);
  state.cursorTimeoutId = setTimeout(() => {
    document.body.classList.add("hide-cursor");
  }, 3000);
}

/* =========================================================
   14. INICIALIZAÇÃO
   ========================================================= */

function startExperience() {
  enterFullscreen();

  startScreen.classList.add("hidden");
  stage.setAttribute("aria-hidden", "false");
  stage.classList.add("visible");

  initVideos();
  updateTimerDisplay();
  updateProgressBar();
  startTimer();
  updatePauseButton();

  resetCursorTimer();
}

startButton.addEventListener("click", startExperience);
pauseButton.addEventListener("click", toggleTimer);
document.addEventListener("keydown", handleKeydown);
document.addEventListener("mousemove", resetCursorTimer);

// Controles discretos: aparecem ao mover o mouse e somem após inatividade.
let controlsHideTimer;
function revealControls(){
  document.body.classList.add('controls-visible');
  clearTimeout(controlsHideTimer);
  controlsHideTimer=setTimeout(()=>document.body.classList.remove('controls-visible'),1600);
}
document.addEventListener('mousemove',revealControls);
document.addEventListener('mouseenter',revealControls);
revealControls();
