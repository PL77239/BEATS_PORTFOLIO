document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("beat-grid");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const genreSelector = document.getElementById("genre-selector");
  const genreLabel = genreSelector?.querySelector(".genre-label") ?? null;
  const genreButtons = Array.from(document.querySelectorAll(".genre-option"));
  const diceOverlay = document.getElementById("dice-overlay");
  const diceCanvas = document.getElementById("dice-canvas");
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
  let activeGenre = "Various";

  const GENRE_LIST = ["Florida", "Detroit", "West Coast", "Trap", "Various"];

  // Placeholder mapping for future curation.
  // Add filenames to these sets when tracks are tagged.
  const genreAssignments = {
    Florida: new Set([]),
    Detroit: new Set([]),
    "West Coast": new Set([]),
    Trap: new Set([]),
    Various: new Set([]),
  };

  const detectGenreFromFilename = (filename) => {
    for (const genre of GENRE_LIST) {
      if (genre === "Various") {
        continue;
      }
      if (genreAssignments[genre]?.has(filename)) {
        return genre;
      }
    }
    return "Various";
  };

  const applyGenreFilter = () => {
    const allCards = Array.from(document.querySelectorAll(".beat-card"));
    allCards.forEach((card) => {
      const cardGenre = card.getAttribute("data-genre") || "Various";
      const visible = activeGenre === "Various" ? true : cardGenre === activeGenre;
      card.style.display = visible ? "" : "none";
    });
  };
  const webglDice = {
    ready: false,
    failed: false,
    scene: null,
    camera: null,
    renderer: null,
    diceGroups: [],
  };

  const renderWebglDice = () => {
    if (!webglDice.ready || !webglDice.renderer || !webglDice.scene || !webglDice.camera) {
      return;
    }
    webglDice.renderer.render(webglDice.scene, webglDice.camera);
  };

  const setWebglDieState = (dieIndex, state) => {
    if (!webglDice.ready || !webglDice.diceGroups[dieIndex] || !window.THREE) {
      return;
    }
    const group = webglDice.diceGroups[dieIndex];
    group.position.set(state.x, -state.y, state.z);
    group.rotation.set(
      window.THREE.MathUtils.degToRad(state.rx),
      window.THREE.MathUtils.degToRad(state.ry),
      window.THREE.MathUtils.degToRad(state.rz),
    );
    group.scale.setScalar(state.scale);
    if (Array.isArray(group.userData.materials)) {
      group.userData.materials.forEach((material) => {
        material.opacity = state.opacity;
      });
    }
  };

  const setupWebglDice = () => {
    if (!diceOverlay || !diceCanvas || !window.THREE || !window.THREE.GLTFLoader) {
      return;
    }
    try {
      const renderer = new window.THREE.WebGLRenderer({
        canvas: diceCanvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new window.THREE.Scene();
      const camera = new window.THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);

      const hemi = new window.THREE.HemisphereLight(0xffffff, 0x4d4d4d, 1.3);
      hemi.position.set(0, 300, 400);
      scene.add(hemi);

      const keyLight = new window.THREE.DirectionalLight(0xffffff, 1.0);
      keyLight.position.set(260, 340, 420);
      scene.add(keyLight);

      const fillLight = new window.THREE.DirectionalLight(0xffd9cc, 0.45);
      fillLight.position.set(-240, 180, 120);
      scene.add(fillLight);

      const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
        renderWebglDice();
      };

      const loader = new window.THREE.GLTFLoader();
      const onGltfLoaded = (gltf) => {
          const baseModel = gltf.scene || gltf.scenes?.[0];
          if (!baseModel) {
            webglDice.failed = true;
            return;
          }

          const box = new window.THREE.Box3().setFromObject(baseModel);
          const size = box.getSize(new window.THREE.Vector3());
          const center = box.getCenter(new window.THREE.Vector3());
          const maxSize = Math.max(size.x, size.y, size.z) || 1;
          const targetSize = 74;
          const scale = targetSize / maxSize;

          baseModel.scale.setScalar(scale);
          baseModel.position.sub(center.multiplyScalar(scale));

          const createDieGroup = () => {
            const group = new window.THREE.Group();
            const model = baseModel.clone(true);
            const materials = [];
            model.traverse((child) => {
              if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                const cloned = mats.map((material) => {
                  const mat = material.clone();
                  mat.transparent = true;
                  mat.opacity = 0;
                  return mat;
                });
                child.material = Array.isArray(child.material) ? cloned : cloned[0];
                materials.push(...cloned);
              }
            });
            group.userData.materials = materials;
            group.add(model);
            scene.add(group);
            return group;
          };

          webglDice.scene = scene;
          webglDice.camera = camera;
          webglDice.renderer = renderer;
          webglDice.diceGroups = [createDieGroup(), createDieGroup()];
          webglDice.ready = true;
          diceOverlay.classList.add("webgl-ready");
          resize();
          window.addEventListener("resize", resize);
          renderWebglDice();
      };
      const onGltfError = () => {
        if (!webglDice.ready) {
          webglDice.failed = true;
        }
      };

      // Try both encoded and plain paths for hosts with strict URL handling.
      loader.load("dice/Classic%20Dice.gltf", onGltfLoaded, undefined, () => {
        loader.load("dice/Classic Dice.gltf", onGltfLoaded, undefined, onGltfError);
      });
    } catch {
      webglDice.failed = true;
    }
  };

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

  const setDieState = (die, state, dieIndex = null) => {
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

    const resolvedDieIndex = dieIndex ?? (die === dieFive ? 0 : 1);
    setWebglDieState(resolvedDieIndex, state);
  };

  const runDicePhysicsAnimation = () =>
    new Promise((resolve) => {
      if (!dieFive || !dieSix) {
        resolve();
        return;
      }

      const randomInRange = (min, max) => min + Math.random() * (max - min);
      const randomInt = (min, max) => Math.floor(randomInRange(min, max + 1));
      const pick = (arr) => arr[randomInt(0, arr.length - 1)];
      const settleOrientations = [
        { rx: 14, ry: -16, rz: 4 },
        { rx: -12, ry: 24, rz: -10 },
        { rx: 18, ry: 33, rz: 14 },
        { rx: -20, ry: -28, rz: 8 },
        { rx: 10, ry: 42, rz: -18 },
        { rx: -16, ry: 8, rz: 22 },
      ];
      const dieFiveRest = pick(settleOrientations);
      const dieSixRest = pick(settleOrientations);
      const throwStyle = {
        durationMs: randomInRange(1880, 2360),
        gravity: randomInRange(3000, 3520),
        centerPull: randomInRange(0.9, 1.25),
        wobbleGain: randomInRange(0.85, 1.3),
      };

      const durationMs = throwStyle.durationMs;
      const drag = 0.994;
      const zDrag = 0.989;
      const baseDistance = randomInRange(44, 62);
      const restitutionProfile = [0.42, 0.32];
      const physicsStep = 1 / 120;
      const spawnY = -window.innerHeight * randomInRange(0.42, 0.55);
      const smoothstep = (edge0, edge1, value) => {
        const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
      };

      const states = [
        {
          die: dieFive,
          index: 0,
          offset: -baseDistance,
          restRx: dieFiveRest.rx,
          restRy: dieFiveRest.ry,
          restRz: dieFiveRest.rz,
          x: randomInRange(260, 430),
          y: spawnY + randomInRange(-35, 25),
          z: randomInRange(180, 290),
          vx: -randomInRange(420, 760),
          vy: randomInRange(1180, 1560),
          vz: -randomInRange(300, 430),
          rx: 24,
          ry: -38,
          rz: 12,
          vrx: randomInRange(820, 1120),
          vry: randomInRange(1230, 1680),
          vrz: randomInRange(1760, 2280),
          spinPhase: randomInRange(0, Math.PI * 2),
          spinBias: randomInRange(0.88, 1.2),
          bounces: 0,
          settled: false,
          settlingGateReached: false,
          renderX: 0,
          renderY: 0,
          renderZ: 0,
          renderRx: 0,
          renderRy: 0,
          renderRz: 0,
        },
        {
          die: dieSix,
          index: 1,
          offset: baseDistance,
          restRx: dieSixRest.rx,
          restRy: dieSixRest.ry,
          restRz: dieSixRest.rz,
          x: randomInRange(320, 520),
          y: spawnY + randomInRange(-45, 20),
          z: randomInRange(210, 320),
          vx: -randomInRange(520, 920),
          vy: randomInRange(1280, 1680),
          vz: -randomInRange(280, 390),
          rx: -18,
          ry: 28,
          rz: -28,
          vrx: randomInRange(980, 1320),
          vry: randomInRange(1320, 1840),
          vrz: randomInRange(1620, 2180),
          spinPhase: randomInRange(0, Math.PI * 2),
          spinBias: randomInRange(0.85, 1.16),
          bounces: 0,
          settled: false,
          settlingGateReached: false,
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
          const toCenter = state.offset - state.x;
          const centerDriftStrength = (state.bounces < 2 ? 240 : 420) * throwStyle.centerPull;
          state.vx += Math.max(-1, Math.min(1, toCenter / 280)) * centerDriftStrength * dt;

          state.vy += throwStyle.gravity * dt;
          state.vx *= drag;
          state.vz *= zDrag;
          state.x += state.vx * dt;
          state.y += state.vy * dt;
          state.z += state.vz * dt;
          state.rx += state.vrx * dt;
          state.ry += state.vry * dt;
          state.rz += state.vrz * dt;

          const wobble = Math.sin(elapsed * 0.009 + state.spinPhase) * 18 * throwStyle.wobbleGain;
          state.vrx += wobble * dt * state.spinBias;
          state.vry += Math.cos(elapsed * 0.008 + state.spinPhase) * 14 * throwStyle.wobbleGain * dt;
          state.vrz += Math.sin(elapsed * 0.0065 + state.spinPhase * 0.8) * 12 * throwStyle.wobbleGain * dt;

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
            state.vx = state.vx * 0.64 + (state.offset - state.x) * randomInRange(0.16, 0.24) + randomInRange(-55, 55);
            state.vz = state.vz * 0.57 + randomInRange(-50, 45);
            state.vrx *= 0.76;
            state.vry *= 0.76;
            state.vrz *= 0.78;
            state.bounces += 1;
          } else {
            const closeEnoughToCenter = Math.abs(state.x - state.offset) < 90;
            if (closeEnoughToCenter) {
              state.settled = true;
              state.vx = 0;
              state.vy = 0;
              state.vz = 0;
              state.vrx = 0;
              state.vry = 0;
              state.vrz = 0;
            } else {
              // If still too far from center, do short corrective hops/skids.
              state.vy = -Math.max(95, impactVy * 0.22);
              state.vx = state.vx * 0.72 + (state.offset - state.x) * 0.36;
              state.vz *= 0.62;
              state.vrx *= 0.74;
              state.vry *= 0.74;
              state.vrz *= 0.75;
            }
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
          if (!state.settled && state.bounces >= restitutionProfile.length) {
            state.settlingGateReached = Math.abs(state.x - state.offset) < 130;
          }

          // Settle only once dice are near center (or if animation is ending hard).
          if (state.settled || state.settlingGateReached || progress > 0.97) {
            const easeStrength = state.settled ? 0.27 : 0.09;
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
          }, state.index);
        });

        renderWebglDice();

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
          const detectedGenre = detectGenreFromFilename(filename);
          const card = document.createElement("div");
          card.className = "beat-card";
          card.setAttribute("data-beat-id", beatId);
          card.setAttribute("data-genre", detectedGenre);

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
                <p class="beat-genre">Genre: ${detectedGenre}</p>
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
        applyGenreFilter();
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

  if (genreLabel && genreSelector) {
    const setExpanded = (expanded) => {
      genreLabel.setAttribute("aria-expanded", expanded ? "true" : "false");
    };
    genreSelector.addEventListener("mouseenter", () => setExpanded(true));
    genreSelector.addEventListener("mouseleave", () => setExpanded(false));
    genreSelector.addEventListener("focusin", () => setExpanded(true));
    genreSelector.addEventListener("focusout", (event) => {
      if (!genreSelector.contains(event.relatedTarget)) {
        setExpanded(false);
      }
    });
  }

  if (genreButtons.length > 0) {
    genreButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const selectedGenre = button.getAttribute("data-genre");
        if (!selectedGenre || !GENRE_LIST.includes(selectedGenre)) {
          return;
        }
        activeGenre = selectedGenre;
        genreButtons.forEach((option) => {
          const isActive = option === button;
          option.classList.toggle("active", isActive);
          option.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
        applyGenreFilter();
      });
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
        setDieState(dieFive, { x: -50, y: 0, z: 0, rx: 16, ry: -20, rz: 0, scale: 1, opacity: 0 }, 0);
        setDieState(dieSix, { x: 50, y: 0, z: 0, rx: -14, ry: 22, rz: 0, scale: 1, opacity: 0 }, 1);
        renderWebglDice();
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

  setupWebglDice();

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
