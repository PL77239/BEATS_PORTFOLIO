const shuffleBtn = document.querySelector("#shuffle-btn");
const diceOverlay = document.querySelector("#dice-overlay");
const beatCards = Array.from(document.querySelectorAll(".beat-card"));

if (shuffleBtn && diceOverlay && beatCards.length > 0) {
  let revealTimerId = null;
  let finishTimerId = null;

  const clearRunningTimers = () => {
    if (revealTimerId !== null) {
      clearTimeout(revealTimerId);
      revealTimerId = null;
    }
    if (finishTimerId !== null) {
      clearTimeout(finishTimerId);
      finishTimerId = null;
    }
  };

  shuffleBtn.addEventListener("click", () => {
    if (shuffleBtn.disabled) {
      return;
    }

    shuffleBtn.disabled = true;
    clearRunningTimers();

    beatCards.forEach((card) => card.classList.remove("force-flip"));

    const randomCard = beatCards[Math.floor(Math.random() * beatCards.length)];
    diceOverlay.classList.add("rolling");

    revealTimerId = window.setTimeout(() => {
      randomCard.scrollIntoView({ behavior: "smooth", block: "center" });
      revealTimerId = null;
    }, 1200);

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
    }, 2000);
  });
}
