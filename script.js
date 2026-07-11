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
    die.style.setProperty("--rot", `${state.rotation}deg`);
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
      const restitution = 0.38;
      const drag = 0.996;
      const startX = window.innerWidth * 0.7;
      const startY = -window.innerHeight * 0.35;
      const landTimeSec = 1.2;
      const baseDistance = 56;

      const states = [
        {
          die: dieFive,
          offset: -baseDistance,
          x: startX - baseDistance,
          y: startY - 20,
          vx: -(startX / landTimeSec) * 0.94,
          vy: -280,
          rotation: 0,
          omega: 1840,
        },
        {
          die: dieSix,
          offset: baseDistance,
          x: startX + baseDistance,
          y: startY + 12,
          vx: -(startX / landTimeSec) * 1.02,
          vy: -420,
          rotation: 32,
          omega: 1960,
        },
      ];

      let lastTs = null;
      const startedAt = performance.now();

      const tick = (ts) => {
        if (lastTs === null) {
          lastTs = ts;
        }
        const dt = Math.min((ts - lastTs) / 1000, 0.033);
        lastTs = ts;
        const elapsed = ts - startedAt;
        const progress = Math.min(elapsed / durationMs, 1);

        states.forEach((state) => {
          state.vy += gravity * dt;
          state.vx *= drag;
          state.x += state.vx * dt;
          state.y += state.vy * dt;
          state.rotation += state.omega * dt;
          state.omega *= 0.995;

          if (state.y > 0) {
            state.y = 0;
            state.vy = -Math.abs(state.vy) * restitution;
            state.vx *= 0.86;
            state.omega *= 0.83;
          }

          // Ease toward center near the end so both dice clearly "land".
          if (progress > 0.8) {
            const ease = (progress - 0.8) / 0.2;
            state.x += (state.offset - state.x) * ease * 0.15;
            state.y += (0 - state.y) * ease * 0.2;
          }

          let opacity = progress < 0.06 ? progress / 0.06 : 1;
          let scale = 1;
          if (progress > 0.9) {
            const fadeProgress = (progress - 0.9) / 0.1;
            opacity = Math.max(0, 1 - fadeProgress);
            scale = 1 + 0.12 * fadeProgress;
          }

          setDieState(state.die, {
            x: state.x,
            y: state.y,
            rotation: state.rotation,
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
        setDieState(dieFive, { x: -56, y: 0, rotation: 1080, scale: 1, opacity: 0 });
        setDieState(dieSix, { x: 56, y: 0, rotation: 1080, scale: 1, opacity: 0 });
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
