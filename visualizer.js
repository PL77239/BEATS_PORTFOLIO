/*
 * WinXP-style Windows Media Player music visualizer.
 *
 * Analyses the frequency/waveform data of whatever track is currently
 * playing in `window.beatsAudioPlayer` (set up in script.js) via the
 * Web Audio API, renders a retro Media-Player-esque visualization onto a
 * <canvas>, and can record that canvas + the track's audio into a real
 * downloadable .webm "music video" file using MediaRecorder.
 */
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("visualizer-overlay");
  const canvas = document.getElementById("visualizer-canvas");
  const closeBtn = document.getElementById("visualizer-close");
  const styleSelect = document.getElementById("visualizer-style");
  const recordBtn = document.getElementById("visualizer-record");
  const recTimeEl = document.getElementById("visualizer-rec-time");
  const downloadLink = document.getElementById("visualizer-download");
  const statusEl = document.getElementById("visualizer-status");
  const nowPlayingEl = document.getElementById("visualizer-now-playing");

  if (!overlay || !canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");

  let audioCtx = null;
  let sourceNode = null;
  let analyser = null;
  let streamDest = null;
  let freqData = null;
  let timeData = null;

  let animationId = null;
  let currentStyle = styleSelect ? styleSelect.value : "bars";
  let rotationAngle = 0;
  let peakHeights = null;

  let mediaRecorder = null;
  let recordedChunks = [];
  let recTimerId = null;
  let recStartedAt = 0;
  let isRecording = false;
  let isOpen = false;

  const setStatus = (text) => {
    if (statusEl) {
      statusEl.textContent = text;
    }
  };

  const getAudioEl = () => window.beatsAudioPlayer || null;

  const ensureAudioGraph = () => {
    const audioEl = getAudioEl();
    if (!audioEl || sourceNode) {
      return Boolean(sourceNode);
    }
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextCtor();
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      streamDest = audioCtx.createMediaStreamDestination();

      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.connect(streamDest);

      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
      peakHeights = new Float32Array(96);
      return true;
    } catch (err) {
      console.warn("Visualizer audio graph failed to initialize:", err);
      setStatus("Audio analysis unavailable in this browser.");
      return false;
    }
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };

  const lerp = (a, b, t) => a + (b - a) * t;

  const drawBars = (w, h) => {
    ctx.fillStyle = "#000814";
    ctx.fillRect(0, 0, w, h);

    const barCount = 64;
    const usableBins = Math.floor(freqData.length * 0.75);
    const gap = w * 0.004;
    const barWidth = w / barCount - gap;

    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, "#1cff6b");
    gradient.addColorStop(0.55, "#e8ff3b");
    gradient.addColorStop(0.82, "#ff9d2e");
    gradient.addColorStop(1, "#ff2e4d");

    if (!peakHeights || peakHeights.length !== barCount) {
      peakHeights = new Float32Array(barCount);
    }

    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * usableBins);
      const value = freqData[binIndex] / 255;
      const barHeight = value * h * 0.88;
      const x = i * (barWidth + gap);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, h - barHeight, barWidth, barHeight);

      // Reflection under the baseline, like the classic WMP glass skin.
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.scale(1, -1);
      ctx.fillRect(x, -h - barHeight * 0.35, barWidth, barHeight * 0.35);
      ctx.restore();

      peakHeights[i] = Math.max(barHeight, peakHeights[i] - h * 0.012);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, h - peakHeights[i] - 2, barWidth, 2);
    }
  };

  const drawAmbience = (w, h) => {
    ctx.fillStyle = "#00040c";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.16;
    const maxLen = Math.min(w, h) * 0.34;
    const barCount = 90;

    let bassSum = 0;
    for (let i = 0; i < 8; i++) {
      bassSum += freqData[i];
    }
    const bass = bassSum / (8 * 255);

    rotationAngle += 0.0025 + bass * 0.01;

    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * (freqData.length * 0.6));
      const value = freqData[binIndex] / 255;
      const len = value * maxLen;
      const angle = (i / barCount) * Math.PI * 2 + rotationAngle;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x1 = cx + cos * baseRadius;
      const y1 = cy + sin * baseRadius;
      const x2 = cx + cos * (baseRadius + len);
      const y2 = cy + sin * (baseRadius + len);

      const strokeGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      strokeGrad.addColorStop(0, "#2f6fff");
      strokeGrad.addColorStop(1, "#dff0ff");

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = Math.max(2, (w / barCount) * 0.4);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const glowRadius = baseRadius * (0.7 + bass * 0.6);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glow.addColorStop(0, "rgba(150, 210, 255, 0.9)");
    glow.addColorStop(0.6, "rgba(61, 148, 255, 0.35)");
    glow.addColorStop(1, "rgba(61, 148, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawScope = (w, h) => {
    ctx.fillStyle = "#001005";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(57, 255, 106, 0.12)";
    ctx.lineWidth = 1;
    const gridLines = 8;
    for (let i = 1; i < gridLines; i++) {
      const y = (h / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 1; i < gridLines; i++) {
      const x = (w / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.shadowColor = "#39ff6a";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#39ff6a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const sliceWidth = w / timeData.length;
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128;
      const x = i * sliceWidth;
      const y = h / 2 + v * (h / 2) * 0.9;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const renderFrame = () => {
    if (!analyser) {
      animationId = requestAnimationFrame(renderFrame);
      return;
    }
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    const w = canvas.width;
    const h = canvas.height;

    if (currentStyle === "ambience") {
      drawAmbience(w, h);
    } else if (currentStyle === "scope") {
      drawScope(w, h);
    } else {
      drawBars(w, h);
    }

    animationId = requestAnimationFrame(renderFrame);
  };

  const startRenderLoop = () => {
    if (animationId !== null) {
      return;
    }
    animationId = requestAnimationFrame(renderFrame);
  };

  const stopRenderLoop = () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const updateRecTimer = () => {
    if (recTimeEl) {
      recTimeEl.textContent = formatTime(performance.now() - recStartedAt);
    }
  };

  const pickMimeType = () => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
      return "";
    }
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const sanitizeFilename = (name) => name.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60) || "beat";

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const startRecording = () => {
    if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
      setStatus("Recording isn't supported in this browser. Try Chrome, Edge, or Firefox.");
      return;
    }
    if (!ensureAudioGraph() || !streamDest) {
      setStatus("Play a track first, then record.");
      return;
    }

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...streamDest.stream.getAudioTracks(),
    ]);

    const mimeType = pickMimeType();
    try {
      mediaRecorder = mimeType
        ? new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 5_000_000 })
        : new MediaRecorder(combinedStream);
    } catch (err) {
      console.warn("MediaRecorder init failed:", err);
      setStatus("Could not start recording on this browser.");
      return;
    }

    recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      isRecording = false;
      if (recTimerId !== null) {
        clearInterval(recTimerId);
        recTimerId = null;
      }
      if (recTimeEl) {
        recTimeEl.hidden = true;
      }
      if (recordBtn) {
        recordBtn.textContent = "\u25CF Record Music Video";
        recordBtn.classList.remove("recording");
      }

      if (recordedChunks.length === 0) {
        setStatus("No video captured — try again.");
        return;
      }

      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      if (downloadLink) {
        const trackTitle = nowPlayingEl?.textContent || "beat";
        downloadLink.href = url;
        downloadLink.download = `${sanitizeFilename(trackTitle)}-music-video.webm`;
        downloadLink.hidden = false;
      }
      setStatus("Music video ready — click Download Video.");
    };

    mediaRecorder.start();
    isRecording = true;
    recStartedAt = performance.now();
    if (recTimeEl) {
      recTimeEl.hidden = false;
      updateRecTimer();
    }
    recTimerId = window.setInterval(updateRecTimer, 250);
    if (recordBtn) {
      recordBtn.textContent = "\u25A0 Stop Recording";
      recordBtn.classList.add("recording");
    }
    if (downloadLink) {
      downloadLink.hidden = true;
    }
    setStatus("Recording…");
  };

  const open = (title) => {
    if (!ensureAudioGraph()) {
      return;
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    isOpen = true;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    if (nowPlayingEl) {
      nowPlayingEl.textContent = title || "Untitled Beat";
    }
    setStatus("Ready");
    requestAnimationFrame(() => {
      resizeCanvas();
      startRenderLoop();
    });
  };

  const close = () => {
    if (isRecording) {
      setStatus("Stop the recording before closing.");
      return;
    }
    isOpen = false;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    stopRenderLoop();
  };

  document.addEventListener("beats:visualize", (event) => {
    open(event.detail?.title);
  });

  closeBtn?.addEventListener("click", close);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      close();
    }
  });

  window.addEventListener("resize", () => {
    if (isOpen) {
      resizeCanvas();
    }
  });

  styleSelect?.addEventListener("change", () => {
    currentStyle = styleSelect.value;
  });

  recordBtn?.addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  getAudioEl()?.addEventListener("ended", () => {
    if (isRecording) {
      stopRecording();
    }
  });
});
