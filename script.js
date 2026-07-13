document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("beat-grid");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const diceOverlay = document.getElementById("dice-overlay");
  const dieFive = diceOverlay?.querySelector(".die-5") ?? null;
  const dieSix = diceOverlay?.querySelector(".die-6") ?? null;
  const globalAudioPlayer = new Audio();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let currentlyPlayingBtn = null;
  let currentlyPlayingCard = null;
  let currentProgressBar = null;
  let revealTimerId = null;
  let finishTimerId = null;
  let shuffleAnimationId = null;

  const clearRunningTimers = () => {
    if (revealTimerId !== null) {
      clearTimeout(revealTimerId);
      revealTimerId = null;
    }
    if (finishTimerId !== null) {
      clearTimeout(finishTimerId);
      finishTimerId = null;
    }
    if (shuffleAnimationId !== null) {
      cancelAnimationFrame(shuffleAnimationId);
      shuffleAnimationId = null;
    }
  };

  const setDieState = (die, state) => {
    if (!die) {
      return;
    }
    die.style.setProperty("--tx", `${state.x}px`);
    die.style.setProperty("--ty", `${state.y}px`);
    die.style.setProperty("--tz", `${state.z}px`);
    die.style.setProperty("--rx", `${state.rx}deg`);
    die.style.setProperty("--ry", `${state.ry}deg`);
    die.style.setProperty("--rz", `${state.rz}deg`);
    die.style.setProperty("--scale", `${state.scale}`);
    die.style.setProperty("--die-opacity", `${state.opacity}`);
  };

  const runDicePhysicsAnimation = () =>
    new Promise((resolve) => {
      if (!dieFive || !dieSix) {
        resolve();
        return;
      }

      const durationMs = 2000;
      const gravity = 3200;
      const drag = 0.994;
      const zDrag = 0.989;
      const baseDistance = 50;
      const restitutionProfile = [0.42, 0.32];
      const physicsStep = 1 / 120;
      const randomInRange = (min, max) => min + Math.random() * (max - min);
      const smoothstep = (edge0, edge1, value) => {
        const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
      };

      const states = [
        {
          die: dieFive,
          offset: -baseDistance,
          restRx: 16,
          restRy: -20,
          restRz: 6,
          x: window.innerWidth * 0.5 - baseDistance,
          y: window.innerHeight * 0.34,
          z: 220,
          vx: -(window.innerWidth * randomInRange(0.69, 0.76)),
          vy: -randomInRange(1180, 1300),
          vz: -randomInRange(280, 360),
          rx: 24,
          ry: -38,
          rz: 12,
          vrx: randomInRange(760, 980),
          vry: randomInRange(1150, 1450),
          vrz: randomInRange(1620, 1930),
          spinPhase: randomInRange(0, Math.PI * 2),
          spinBias: randomInRange(0.92, 1.1),
          bounces: 0,
          settled: false,
          renderX: 0,
          renderY: 0,
          renderZ: 0,
          renderRx: 0,
          renderRy: 0,
          renderRz: 0,
        },
        {
          die: dieSix,
          offset: baseDistance,
          restRx: -14,
          restRy: 22,
          restRz: -8,
          x: window.innerWidth * 0.54 + baseDistance,
          y: window.innerHeight * 0.37,
          z: 240,
          vx: -(window.innerWidth * randomInRange(0.73, 0.82)),
          vy: -randomInRange(1260, 1410),
          vz: -randomInRange(250, 330),
          rx: -18,
          ry: 28,
          rz: -28,
          vrx: randomInRange(920, 1160),
          vry: randomInRange(1240, 1560),
          vrz: randomInRange(1490, 1810),
          spinPhase: randomInRange(0, Math.PI * 2),
          spinBias: randomInRange(0.88, 1.08),
          bounces: 0,
          settled: false,
          renderX: 0,
          renderY: 0,
          renderZ: 0,
          renderRx: 0,
          renderRy: 0,
          renderRz: 0,
        },
      ];

      let lastTs = null;
      let accumulator = 0;
      const startedAt = performance.now();
      states.forEach((state) => {
        state.renderX = state.x;
        state.renderY = state.y;
        state.renderZ = state.z;
        state.renderRx = state.rx;
        state.renderRy = state.ry;
        state.renderRz = state.rz;
      });

      const stepState = (state, dt, elapsed) => {
        if (!state.settled) {
          state.vy += gravity * dt;
          state.vx *= drag;
          state.vz *= zDrag;
          state.x += state.vx * dt;
          state.y += state.vy * dt;
          state.z += state.vz * dt;
          state.rx += state.vrx * dt;
          state.ry += state.vry * dt;
          state.rz += state.vrz * dt;

          const wobble = Math.sin(elapsed * 0.009 + state.spinPhase) * 18;
          state.vrx += wobble * dt * state.spinBias;
          state.vry += Math.cos(elapsed * 0.008 + state.spinPhase) * 14 * dt;
          state.vrz += Math.sin(elapsed * 0.0065 + state.spinPhase * 0.8) * 12 * dt;

          state.vrx *= 0.995;
          state.vry *= 0.995;
          state.vrz *= 0.995;
        }

        if (!state.settled && state.y > 0 && state.vy > 0) {
          const impactVy = state.vy;
          state.y = 0;
          if (state.bounces < restitutionProfile.length) {
            const restitution = restitutionProfile[state.bounces];
            state.vy = -Math.max(165, impactVy * restitution * randomInRange(0.97, 1.03));
            state.vx *= 0.64;
            state.vz *= 0.57;
            state.vrx *= 0.76;
            state.vry *= 0.76;
            state.vrz *= 0.78;
            state.bounces += 1;
          } else {
            state.settled = true;
            state.vx = 0;
            state.vy = 0;
            state.vz = 0;
            state.vrx = 0;
            state.vry = 0;
            state.vrz = 0;
          }
        }
      };

      const tick = (ts) => {
        if (lastTs === null) {
          lastTs = ts;
        }
        const dt = Math.min((ts - lastTs) / 1000, 0.033);
        lastTs = ts;
        const elapsed = ts - startedAt;
        const progress = Math.min(elapsed / durationMs, 1);
        accumulator += dt;

        while (accumulator >= physicsStep) {
          states.forEach((state) => stepState(state, physicsStep, elapsed));
          accumulator -= physicsStep;
        }

        states.forEach((state) => {
          // Keep both dice settling exactly in screen center region.
          if (state.settled || progress > 0.78) {
            const easeStrength = state.settled ? 0.24 : 0.1;
            state.x += (state.offset - state.x) * easeStrength;
            state.y += (0 - state.y) * easeStrength;
            state.z += (0 - state.z) * (easeStrength + 0.03);
            state.rx += (state.restRx - state.rx) * (easeStrength + 0.04);
            state.ry += (state.restRy - state.ry) * (easeStrength + 0.04);
            state.rz += (state.restRz - state.rz) * (easeStrength + 0.04);
          }

          // Render-level interpolation removes sharp micro-jitters between physics steps.
          const renderLerp = 0.26;
          state.renderX += (state.x - state.renderX) * renderLerp;
          state.renderY += (state.y - state.renderY) * renderLerp;
          state.renderZ += (state.z - state.renderZ) * renderLerp;
          state.renderRx += (state.rx - state.renderRx) * renderLerp;
          state.renderRy += (state.ry - state.renderRy) * renderLerp;
          state.renderRz += (state.rz - state.renderRz) * renderLerp;

          const fadeIn = smoothstep(0, 0.07, progress);
          const fadeOut = 1 - smoothstep(0.9, 1, progress);
          let opacity = Math.max(0, Math.min(1, fadeIn * fadeOut));
          let scale = 1;
          if (progress > 0.9) {
            const fadeProgress = smoothstep(0.9, 1, progress);
            scale = 1 + 0.12 * fadeProgress;
          }

          setDieState(state.die, {
            x: state.renderX,
            y: state.renderY,
            z: state.renderZ,
            rx: state.renderRx,
            ry: state.renderRy,
            rz: state.renderRz,
            scale,
            opacity,
          });
        });

        if (progress < 1) {
          shuffleAnimationId = requestAnimationFrame(tick);
          return;
        }

        shuffleAnimationId = null;
        resolve();
      };

      shuffleAnimationId = requestAnimationFrame(tick);
    });

  if (grid) {
    fetch("beats.json")
      .then((response) => response.json())
      .then((beatsFiles) => {
        beatsFiles.forEach((filename, index) => {
          const regex = /^(.*?)_(\d+)(?:bppm|bpm)?(?:@janko)?\.mp3$/i;
          const match = filename.match(regex);
          const title = match ? match[1] : filename.replace(".mp3", "");
          const bpm = match ? match[2] : "N/A";

          const beatId = `B${(index + 1).toString().padStart(3, "0")}`;
          const card = document.createElement("div");
          card.className = "beat-card";
          card.setAttribute("data-beat-id", beatId);

          card.innerHTML = `
            <div class="beat-card-inner">
              <div class="beat-card-front">
                <svg viewBox="0 0 24 24" class="music-icon">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div class="beat-card-back">
                <h3>${title}</h3>
                <p class="beat-stats">${bpm} BPM | Key: [TBD]</p>
                <p class="beat-genre">Genre: [TBD]</p>
                <div class="player-controls">
                  <button class="play-pause-btn" data-audio-src="${filename}">▶</button>
                  <input type="range" class="progress-bar" value="0" max="100">
                </div>
                <button class="inquire-btn" onclick="sendInquiry('${beatId}', '${title}')">Inquire</button>
              </div>
            </div>
          `;
          grid.appendChild(card);
        });
      })
      .catch((error) => console.error("Błąd ładowania listy bitów:", error));

    grid.addEventListener("click", (e) => {
      if (!e.target.classList.contains("play-pause-btn")) {
        return;
      }

      const btn = e.target;
      const cardInner = btn.closest(".beat-card-back");
      const card = btn.closest(".beat-card");
      const progressBar = cardInner?.querySelector(".progress-bar");
      const audioSrc = btn.getAttribute("data-audio-src");

      if (!card || !progressBar || !audioSrc) {
        return;
      }

      if (currentlyPlayingBtn === btn) {
        if (globalAudioPlayer.paused) {
          globalAudioPlayer.play().catch((err) => console.warn(err));
        } else {
          globalAudioPlayer.pause();
        }
        return;
      }

      if (currentlyPlayingBtn) {
        currentlyPlayingBtn.textContent = "▶";
      }
      if (currentlyPlayingCard) {
        currentlyPlayingCard.classList.remove("is-playing");
      }
      if (currentProgressBar) {
        currentProgressBar.value = 0;
      }

      currentlyPlayingBtn = btn;
      currentlyPlayingCard = card;
      currentProgressBar = progressBar;
      globalAudioPlayer.src = encodeURI(audioSrc);
      globalAudioPlayer.play().catch((err) => console.warn(err));
    });

    grid.addEventListener("input", (e) => {
      if (!e.target.classList.contains("progress-bar")) {
        return;
      }
      if (currentProgressBar !== e.target || !globalAudioPlayer.duration) {
        return;
      }
      const seekTime = (e.target.value / 100) * globalAudioPlayer.duration;
      globalAudioPlayer.currentTime = seekTime;
    });
  }

  globalAudioPlayer.addEventListener("play", () => {
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.textContent = "⏸";
    }
    if (currentlyPlayingCard) {
      currentlyPlayingCard.classList.add("is-playing");
    }
  });

  globalAudioPlayer.addEventListener("pause", () => {
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.textContent = "▶";
    }
    if (currentlyPlayingCard) {
      currentlyPlayingCard.classList.remove("is-playing");
    }
  });

  globalAudioPlayer.addEventListener("timeupdate", () => {
    if (currentProgressBar && globalAudioPlayer.duration) {
      const progressPercent = (globalAudioPlayer.currentTime / globalAudioPlayer.duration) * 100;
      currentProgressBar.value = progressPercent;
    }
  });

  globalAudioPlayer.addEventListener("ended", () => {
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.textContent = "▶";
    }
    if (currentlyPlayingCard) {
      currentlyPlayingCard.classList.remove("is-playing");
    }
    if (currentProgressBar) {
      currentProgressBar.value = 0;
    }
    currentlyPlayingBtn = null;
    currentlyPlayingCard = null;
    currentProgressBar = null;
  });

  if (shuffleBtn && diceOverlay) {
    shuffleBtn.addEventListener("click", async () => {
      if (shuffleBtn.disabled) {
        return;
      }

      const allCards = Array.from(document.querySelectorAll(".beat-card"));
      if (allCards.length === 0) {
        return;
      }

      shuffleBtn.disabled = true;
      clearRunningTimers();
      allCards.forEach((card) => card.classList.remove("force-flip"));

      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      diceOverlay.classList.add("rolling");

      revealTimerId = window.setTimeout(() => {
        randomCard.scrollIntoView({ behavior: "smooth", block: "center" });
        revealTimerId = null;
      }, 1200);

      if (prefersReducedMotion.matches) {
        setDieState(dieFive, { x: -50, y: 0, z: 0, rx: 16, ry: -20, rz: 0, scale: 1, opacity: 0 });
        setDieState(dieSix, { x: 50, y: 0, z: 0, rx: -14, ry: 22, rz: 0, scale: 1, opacity: 0 });
        await new Promise((resolve) => setTimeout(resolve, 120));
      } else {
        await runDicePhysicsAnimation();
      }

      finishTimerId = window.setTimeout(() => {
        diceOverlay.classList.remove("rolling");
        randomCard.classList.add("force-flip");
        shuffleBtn.disabled = false;
        finishTimerId = null;

        randomCard.addEventListener(
          "mouseleave",
          () => {
            randomCard.classList.remove("force-flip");
          },
          { once: true },
        );
      }, 0);
    });
  }

  const door = document.getElementById("garage-door");
  const introContainer = document.getElementById("intro-container");
  const tunnel = document.getElementById("dark-tunnel");
  const mainContent = document.getElementById("main-content");
  const neonSign = document.querySelector(".neon-sign");
  const body = document.body;

  let startY = 0;
  let isDragging = false;
  let isOpened = false;

  const triggerOpenSequence = () => {
    if (isOpened || !door || !introContainer || !tunnel || !mainContent || !neonSign) {
      return;
    }
    isOpened = true;
    door.style.transform = "translateY(-100%)";

    setTimeout(() => {
      tunnel.style.opacity = "1";
    }, 800);

    setTimeout(() => {
      introContainer.style.display = "none";
      mainContent.classList.remove("hidden");
      mainContent.classList.add("visible");
      body.style.overflow = "auto";

      setTimeout(() => {
        neonSign.style.transition = "opacity 1s ease";
        neonSign.style.opacity = "1";
      }, 500);
    }, 3000);
  };

  if (door) {
    door.addEventListener("mousedown", (e) => {
      startY = e.clientY;
      isDragging = true;
    });

    door.addEventListener("touchstart", (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    });
  }

  window.addEventListener("mousemove", (e) => {
    if (!isDragging || isOpened) {
      return;
    }
    const deltaY = e.clientY - startY;
    if (deltaY < -(window.innerHeight * 0.15)) {
      triggerOpenSequence();
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (!isDragging || isOpened) {
      return;
    }
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY < -(window.innerHeight * 0.15)) {
      triggerOpenSequence();
    }
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
  window.addEventListener("touchend", () => {
    isDragging = false;
  });
});

function sendInquiry(beatId, title) {
  alert(`Przygotowuję maila z zapytaniem o bit: ${title} (ID: ${beatId})`);
}
