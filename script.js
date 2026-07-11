document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById('beat-grid');
    fetch('beats.json')
        .then(response => response.json())
        .then(beatsFiles => {
            beatsFiles.forEach((filename, index) => {
                const regex = /^(.*?)_(\d+)(?:bppm|bpm)?(?:@janko)?\.mp3$/i;
                const match = filename.match(regex);

                let title = "";
                let bpm = "";

                if (match) {
                    title = match[1];
                    bpm = match[2];
                } else {
                    title = filename.replace('.mp3', '');
                    bpm = "N/A";
                }

                const beatId = `B${(index + 1).toString().padStart(3, '0')}`;
                const card = document.createElement('div');
                card.className = 'beat-card';
                card.setAttribute('data-beat-id', beatId);

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
        .catch(error => console.error('Błąd ładowania listy bitów:', error));

    const globalAudioPlayer = new Audio();
    let currentlyPlayingBtn = null;
    let currentlyPlayingCard = null;
    let currentProgressBar = null;

    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('play-pause-btn')) {
            const btn = e.target;
            const cardInner = btn.closest('.beat-card-back');
            const card = btn.closest('.beat-card');
            const progressBar = cardInner.querySelector('.progress-bar');
            const audioSrc = btn.getAttribute('data-audio-src');

            if (currentlyPlayingBtn === btn) {
                if (globalAudioPlayer.paused) {
                    globalAudioPlayer.play().catch(err => console.warn(err));
                } else {
                    globalAudioPlayer.pause();
                }
            } else {
                if (currentlyPlayingBtn) {
                    currentlyPlayingBtn.textContent = '▶';
                    if (currentlyPlayingCard) {
                        currentlyPlayingCard.classList.remove('is-playing');
                    }
                    if (currentProgressBar) currentProgressBar.value = 0;
                }

                currentlyPlayingBtn = btn;
                currentlyPlayingCard = card;
                currentProgressBar = progressBar;
                globalAudioPlayer.src = encodeURI(audioSrc);
                globalAudioPlayer.play().catch(err => console.warn(err));
            }
        }
    });


    globalAudioPlayer.addEventListener('play', () => {
        if (currentlyPlayingBtn) currentlyPlayingBtn.textContent = '⏸';
        if (currentlyPlayingCard) currentlyPlayingCard.classList.add('is-playing');
    });

    globalAudioPlayer.addEventListener('pause', () => {
        if (currentlyPlayingBtn) currentlyPlayingBtn.textContent = '▶';
        if (currentlyPlayingCard) currentlyPlayingCard.classList.remove('is-playing');
    });

    globalAudioPlayer.addEventListener('ended', () => {
        if (currentlyPlayingBtn) currentlyPlayingBtn.textContent = '▶';
        if (currentlyPlayingCard) currentlyPlayingCard.classList.remove('is-playing');
        if (currentProgressBar) currentProgressBar.value = 0;

        currentlyPlayingBtn = null;
        currentlyPlayingCard = null;
        currentProgressBar = null;
    });

    globalAudioPlayer.addEventListener('timeupdate', () => {
        if (currentProgressBar && globalAudioPlayer.duration) {
            const progressPercent = (globalAudioPlayer.currentTime / globalAudioPlayer.duration) * 100;
            currentProgressBar.value = progressPercent;
        }
    });

    grid.addEventListener('input', (e) => {
        if (e.target.classList.contains('progress-bar')) {
            if (currentProgressBar === e.target && globalAudioPlayer.src) {
                const seekTime = (e.target.value / 100) * globalAudioPlayer.duration;
                globalAudioPlayer.currentTime = seekTime;
            }
        }
    });

    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('play-pause-btn')) {
            const btn = e.target;
            const cardInner = btn.closest('.beat-card-back');
            const card = btn.closest('.beat-card');
            const progressBar = cardInner.querySelector('.progress-bar');
            const audioSrc = btn.getAttribute('data-audio-src');

            if (currentlyPlayingBtn === btn) {
                if (globalAudioPlayer.paused) {
                    globalAudioPlayer.play();
                    btn.textContent = '⏸';
                    card.classList.add('is-playing');
                } else {
                    globalAudioPlayer.pause();
                    btn.textContent = '▶';
                    card.classList.remove('is-playing');
                }
            } else {
                if (currentlyPlayingBtn) {
                    currentlyPlayingBtn.textContent = '▶';
                    currentlyPlayingBtn.closest('.beat-card').classList.remove('is-playing');
                    if (currentProgressBar) currentProgressBar.value = 0;
                }

                globalAudioPlayer.src = audioSrc;
                globalAudioPlayer.play();
                btn.textContent = '⏸';
                card.classList.add('is-playing');

                currentlyPlayingBtn = btn;
                currentProgressBar = progressBar;
            }
        }
    });

    globalAudioPlayer.addEventListener('timeupdate', () => {
        if (currentProgressBar && globalAudioPlayer.duration) {
            const progressPercent = (globalAudioPlayer.currentTime / globalAudioPlayer.duration) * 100;
            currentProgressBar.value = progressPercent;
        }
    });

    grid.addEventListener('input', (e) => {
        if (e.target.classList.contains('progress-bar')) {
            if (currentProgressBar === e.target && globalAudioPlayer.src) {
                const seekTime = (e.target.value / 100) * globalAudioPlayer.duration;
                globalAudioPlayer.currentTime = seekTime;
            }
        }
    });

    globalAudioPlayer.addEventListener('ended', () => {
        if (currentlyPlayingBtn) {
            currentlyPlayingBtn.textContent = '▶';
            currentlyPlayingBtn.closest('.beat-card').classList.remove('is-playing');
            currentProgressBar.value = 0;
            currentlyPlayingBtn = null;
            currentProgressBar = null;
        }
    });

    // --- 3. LOGIKA PRZYCISKU SHUFFLE Z ANIMACJĄ KOŚCI ---
    const shuffleBtn = document.getElementById('shuffle-btn');
    const diceOverlay = document.getElementById('dice-overlay');

    if (shuffleBtn && diceOverlay) {
        shuffleBtn.addEventListener('click', () => {
            const allCards = document.querySelectorAll('.beat-card');
            if (allCards.length === 0) return;

            // Wyłączamy przycisk na czas trwania animacji (zapobiega spamowaniu)
            shuffleBtn.disabled = true;

            // Zdejmujemy ewentualne obrócenie z wcześniej wylosowanej karty
            allCards.forEach(card => card.classList.remove('force-flip'));

            // Start animacji kości (trwa równe 2 sekundy w CSS)
            diceOverlay.classList.add('rolling');

            // Losujemy utwór
            const randomIndex = Math.floor(Math.random() * allCards.length);
            const randomCard = allCards[randomIndex];

            // W połowie lotu kości (gdy prawie lądują na środku), kamera zaczyna zjeżdżać
            setTimeout(() => {
                randomCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 1200);

            // Gdy kości kończą animację (2000 ms) i znikają, obracamy załadowany kafel
            setTimeout(() => {
                diceOverlay.classList.remove('rolling'); // Reset overlayu
                randomCard.classList.add('force-flip');  // Otwarcie karty
                shuffleBtn.disabled = false;             // Odblokowanie przycisku

                // Jak użytkownik zjedzie myszką z karty, wraca ona do normy
                randomCard.addEventListener('mouseleave', () => {
                    randomCard.classList.remove('force-flip');
                }, { once: true });
            }, 2000);
        });
    }

    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('play-pause-btn')) {
            const btn = e.target;
            const cardInner = btn.closest('.beat-card-back');
            const progressBar = cardInner.querySelector('.progress-bar');
            const audioSrc = btn.getAttribute('data-audio-src');
            if (currentlyPlayingBtn === btn) {
                if (globalAudioPlayer.paused) {
                    globalAudioPlayer.play();
                    btn.textContent = '⏸';
                } else {
                    globalAudioPlayer.pause();
                    btn.textContent = '▶';
                }
            } else {
                if (currentlyPlayingBtn) {
                    currentlyPlayingBtn.textContent = '▶';
                    if (currentProgressBar) currentProgressBar.value = 0;
                }

                globalAudioPlayer.src = audioSrc;
                globalAudioPlayer.play();
                btn.textContent = '⏸';

                currentlyPlayingBtn = btn;
                currentProgressBar = progressBar;
            }
        }
    });

    globalAudioPlayer.addEventListener('timeupdate', () => {
        if (currentProgressBar && globalAudioPlayer.duration) {
            const progressPercent = (globalAudioPlayer.currentTime / globalAudioPlayer.duration) * 100;
            currentProgressBar.value = progressPercent;
        }
    });

    grid.addEventListener('input', (e) => {
        if (e.target.classList.contains('progress-bar')) {
            if (currentProgressBar === e.target && globalAudioPlayer.src) {
                const seekTime = (e.target.value / 100) * globalAudioPlayer.duration;
                globalAudioPlayer.currentTime = seekTime;
            }
        }
    });

    globalAudioPlayer.addEventListener('ended', () => {
        if (currentlyPlayingBtn) {
            currentlyPlayingBtn.textContent = '▶';
            currentProgressBar.value = 0;
            currentlyPlayingBtn = null;
            currentProgressBar = null;
        }
    });

    const door = document.getElementById('garage-door');
    const introContainer = document.getElementById('intro-container');
    const tunnel = document.getElementById('dark-tunnel');
    const mainContent = document.getElementById('main-content');
    const neonSign = document.querySelector('.neon-sign');
    const body = document.body;

    let startY = 0;
    let isDragging = false;
    let isOpened = false;

    const triggerOpenSequence = () => {
        if (isOpened) return;
        isOpened = true;

        door.style.transform = 'translateY(-100%)';

        setTimeout(() => {
            tunnel.style.opacity = '1';
        }, 800);

        setTimeout(() => {
            introContainer.style.display = 'none';
            mainContent.classList.remove('hidden');
            mainContent.classList.add('visible');
            body.style.overflow = 'auto';

            setTimeout(() => {
                neonSign.style.transition = 'opacity 1s ease';
                neonSign.style.opacity = '1';
            }, 500);

        }, 3000);
    };

    door.addEventListener('mousedown', (e) => {
        startY = e.clientY;
        isDragging = true;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || isOpened) return;
        const deltaY = e.clientY - startY;
        if (deltaY < -(window.innerHeight * 0.15)) {
            triggerOpenSequence();
        }
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    door.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || isOpened) return;
        const deltaY = e.touches[0].clientY - startY;
        if (deltaY < -(window.innerHeight * 0.15)) {
            triggerOpenSequence();
        }
    });

    window.addEventListener('touchend', () => { isDragging = false; });
});



function sendInquiry(beatId, title) {
    alert(`Przygotowuję maila z zapytaniem o bit: ${title} (ID: ${beatId})`);
    // `mailto:?subject=Inquiry for ${title}`;
}