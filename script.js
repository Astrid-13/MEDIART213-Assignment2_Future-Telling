/* =========================================
   WITHIN — SHARED SCRIPT FOR ALL 3 LAYERS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const bgm = document.getElementById("master-bgm");

    if (!bgm) return;

    bgm.volume = 0.7;

    bgm.play().catch(() => {
        const startMusic = () => {
            bgm.play().catch(error => {
                console.log("Audio playback blocked:", error);
            });

            document.removeEventListener("click", startMusic);
            document.removeEventListener("keydown", startMusic);
        };

        document.addEventListener("click", startMusic);
        document.addEventListener("keydown", startMusic);
    });
});

(() => {
    /* -------------------------------------
       LAYER SETTINGS
    ------------------------------------- */

    const layer = Number(document.body.dataset.layer || 0);

    const layerSettings = {
        1: {
            topSpinTime: 10000,
            clockSpeed: 5,
            emotionVolume: 0.85,
            filterFrequency: 18000
        },
        2: {
            topSpinTime: 5000,
            clockSpeed: 10,
            emotionVolume: 0.65,
            filterFrequency: 4200
        },
        3: {
            topSpinTime: 2000,
            clockSpeed: 15,
            emotionVolume: 0.43,
            filterFrequency: 1500
        }
    };

    const settings = layerSettings[layer] || layerSettings[1];


    /* -------------------------------------
       IMAGE AND AUDIO ASSET PATHS
    ------------------------------------- */

    const emotions = {
        joy: {
            image: "assets/images/Joy.png",
            audio: "assets/audio/Joy.mp3"
        },
        sadness: {
            image: "assets/images/Sadness.png",
            audio: "assets/audio/Sadness.mp3"
        },
        disgust: {
            image: "assets/images/Disgust.png",
            audio: "assets/audio/Disgust.mp3"
        },
        fear: {
            audio: "assets/audio/Fear.mp3"
        },
        anger: {
            image: "assets/images/Anger.png",
            audio: "assets/audio/Anger.mp3"
        },
        anxiety: {
            image: "assets/images/Anxiety.png",
            audio: "assets/audio/Anxiety.mp3"
        },
        ennui: {
            image: "assets/images/Ennui.png",
            audio: "assets/audio/Ennui.mp3"
        },
        envy: {
            image: "assets/images/Envy.png",
            audio: "assets/audio/Envy.mp3"
        },
        embarrassment: {
            image: "assets/images/Embarrassment.png",
            audio: "assets/audio/Embarrassment.mp3"
        },
        nostalgia: {
            image: "assets/images/Nostalgia.png",
            audio: "assets/audio/Nostalgia.mp3"
        }
    };


    /* -------------------------------------
       LOAD EMOTION IMAGES
    ------------------------------------- */

    const emotionRegions = document.querySelectorAll(".emotion-region");

    emotionRegions.forEach((region) => {
        const emotionName = region.dataset.emotion;
        const emotionData = emotions[emotionName];
        const imageElement = region.querySelector(".emotion-image");

        if (!emotionData || !imageElement) {
            return;
        }

        // Fear is intentionally pure black, without an image.
if (emotionName === "fear") {
    imageElement.style.backgroundImage = "none";
    imageElement.style.backgroundColor = "#000000";
} else if (emotionData.image) {
    imageElement.style.backgroundImage =
        `url("${emotionData.image}")`;
}

        /* Subtle pointer-following movement */

        region.addEventListener("pointermove", (event) => {
            const rect = region.getBoundingClientRect();

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const normalizedX = (event.clientX - centerX) / rect.width;
            const normalizedY = (event.clientY - centerY) / rect.height;

            const movementX = -normalizedX * 15;
            const movementY = -normalizedY * 15;

            region.style.setProperty("--shift-x", `${movementX}px`);
            region.style.setProperty("--shift-y", `${movementY}px`);
        });

        region.addEventListener("pointerleave", () => {
            region.style.setProperty("--shift-x", "0px");
            region.style.setProperty("--shift-y", "0px");
        });
    });


    /* -------------------------------------
       CONTINUOUS MAIN BACKGROUND MUSIC
    ------------------------------------- */

    const bgm = document.getElementById("master-bgm");

    const BGM_STORAGE_KEY = "within-time-position";

    const BGM_NORMAL_VOLUME = 0.30;
    const BGM_DUCKED_VOLUME = 0.025;

    let bgmDucked = false;
    let bgmFadeFrame = null;
    let bgmPositionRestored = false;

    if (bgm) {
        bgm.loop = true;
        bgm.volume = 0;

        /*
           Restore the previous playback position
           when moving between pages.
        */

        function restoreBgmPosition() {
            if (bgmPositionRestored || !Number.isFinite(bgm.duration)) {
                return;
            }

            const savedPosition = sessionStorage.getItem(BGM_STORAGE_KEY);

            if (savedPosition !== null) {
                const savedTime = Number(savedPosition);

                if (Number.isFinite(savedTime) && bgm.duration > 0) {
                    bgm.currentTime = savedTime % bgm.duration;
                }
            }

            bgmPositionRestored = true;
        }

        bgm.addEventListener("loadedmetadata", restoreBgmPosition);

        if (bgm.readyState >= 1) {
            restoreBgmPosition();
        }

        /*
           Save the playback position before leaving the page.
        */

        function saveBgmPosition() {
            if (bgm && Number.isFinite(bgm.currentTime)) {
                sessionStorage.setItem(
                    BGM_STORAGE_KEY,
                    String(bgm.currentTime)
                );
            }
        }

        window.addEventListener("pagehide", saveBgmPosition);

        /*
           Smooth volume transition for the main BGM.
        */

        function fadeBgm(targetVolume, duration) {
            if (!bgm) return;

            if (bgmFadeFrame !== null) {
                cancelAnimationFrame(bgmFadeFrame);
                bgmFadeFrame = null;
            }

            const startVolume = bgm.volume;
            const startTime = performance.now();

            function animateVolume(currentTime) {
                const progress = Math.min(
                    (currentTime - startTime) / duration,
                    1
                );

                const easedProgress =
                    1 - Math.pow(1 - progress, 3);

                bgm.volume =
                    startVolume +
                    (targetVolume - startVolume) * easedProgress;

                if (progress < 1) {
                    bgmFadeFrame = requestAnimationFrame(animateVolume);
                } else {
                    bgmFadeFrame = null;
                }
            }

            bgmFadeFrame = requestAnimationFrame(animateVolume);
        }

        /*
           Start or resume TIME.
           The first start may require a user interaction
           because of browser autoplay restrictions.
        */

        function startBgm() {
            if (!bgm) return;

            restoreBgmPosition();

            const targetVolume = bgmDucked
                ? BGM_DUCKED_VOLUME
                : BGM_NORMAL_VOLUME;

            if (!bgm.paused) {
                fadeBgm(targetVolume, 250);
                return;
            }

            const playPromise = bgm.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        fadeBgm(targetVolume, 700);
                    })
                    .catch(() => {
                        // A later user interaction will retry playback.
                    });
            }
        }

        /*
           Reduce TIME while an emotion track is playing.
           Restore it when the user leaves the emotion areas.
        */

        function setBgmDucked(shouldDuck) {
            bgmDucked = shouldDuck;

            if (!bgm) return;

            const targetVolume = shouldDuck
                ? BGM_DUCKED_VOLUME
                : BGM_NORMAL_VOLUME;

            if (bgm.paused) {
                startBgm();
            } else {
                fadeBgm(
                    targetVolume,
                    shouldDuck ? 180 : 550
                );
            }
        }

        // Try to start automatically.
        startBgm();

        // Retry after a real user interaction if autoplay was blocked.
        document.addEventListener("pointerdown", startBgm);
        document.addEventListener("keydown", startBgm);
    }


    /* -------------------------------------
       EMOTION AUDIO
    ------------------------------------- */

    let audioContext = null;
    let activeRegion = null;
    let activeTrack = null;
    let activationToken = 0;

    const emotionTracks = new Map();

    function getAudioContext() {
        if (audioContext) {
            return audioContext;
        }

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        try {
            audioContext = new AudioContextClass();
            return audioContext;
        } catch (error) {
            console.warn("Web Audio is unavailable:", error);
            return null;
        }
    }


    /*
       Smooth volume transition for browsers
       that do not support the Web Audio filter.
    */

    function fadeAudioElement(audio, targetVolume, duration) {
        const startVolume = audio.volume;
        const startTime = performance.now();

        function animate(currentTime) {
            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            const easedProgress =
                1 - Math.pow(1 - progress, 3);

            audio.volume =
                startVolume +
                (targetVolume - startVolume) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }


    /*
       Create a separate audio track for each emotion.
       A low-pass filter makes the sound progressively
       more muffled in deeper dream layers.
    */

    function getEmotionTrack(emotionName, context) {
        if (emotionTracks.has(emotionName)) {
            return emotionTracks.get(emotionName);
        }

        const emotionData = emotions[emotionName];

        if (!emotionData) {
            return null;
        }

        const audio = new Audio(emotionData.audio);

        audio.preload = "auto";
        audio.loop = true;

        let gainNode = null;
        let filterNode = null;

        if (context) {
            try {
                const source = context.createMediaElementSource(audio);

                filterNode = context.createBiquadFilter();
                filterNode.type = "lowpass";
                filterNode.frequency.value = settings.filterFrequency;
                filterNode.Q.value = 0.7;

                gainNode = context.createGain();
                gainNode.gain.value = 0;

                source.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(context.destination);

                audio.volume = 1;
            } catch (error) {
                console.warn("Could not create audio filter:", error);
                audio.volume = 0;
                gainNode = null;
                filterNode = null;
            }
        } else {
            audio.volume = 0;
        }

        const track = {
            audio,
            gainNode,
            filterNode,
            stopTimer: null
        };

        emotionTracks.set(emotionName, track);

        return track;
    }


    /*
       Fade an emotion track in or out.
    */

    function fadeEmotionTrack(track, targetVolume, duration) {
        if (!track) return;

        if (track.gainNode && audioContext) {
            const gain = track.gainNode.gain;
            const currentTime = audioContext.currentTime;

            gain.cancelScheduledValues(currentTime);
            gain.setValueAtTime(gain.value, currentTime);

            gain.linearRampToValueAtTime(
                targetVolume,
                currentTime + duration / 1000
            );
        } else {
            fadeAudioElement(
                track.audio,
                targetVolume,
                duration
            );
        }
    }


    /*
       Stop a previous emotion track smoothly.
    */

    function stopEmotionTrack(track) {
        if (!track) return;

        if (track.stopTimer) {
            clearTimeout(track.stopTimer);
        }

        fadeEmotionTrack(track, 0, 240);

        track.stopTimer = setTimeout(() => {
            if (activeTrack !== track) {
                track.audio.pause();
                track.audio.currentTime = 0;
            }
        }, 300);
    }


    /*
       Start the selected emotion track.
       TIME remains playing underneath, but very quietly.
    */

    async function activateEmotion(region) {
        if (!region) return;

        if (activeRegion === region) {
            return;
        }

        const emotionName = region.dataset.emotion;

        if (!emotions[emotionName]) {
            return;
        }

        activeRegion = region;

        // Lower the main background music immediately.
        if (bgm) {
            setBgmDucked(true);
            startBgm();
        }

        const previousTrack = activeTrack;

        const context = getAudioContext();
        const track = getEmotionTrack(emotionName, context);

        if (!track) {
            return;
        }

        if (previousTrack && previousTrack !== track) {
            stopEmotionTrack(previousTrack);
        }

        if (track.stopTimer) {
            clearTimeout(track.stopTimer);
            track.stopTimer = null;
        }

        activeTrack = track;

        const currentToken = ++activationToken;

        try {
            if (context && context.state === "suspended") {
                await context.resume();
            }

            // Ignore an outdated request if the pointer has moved again.
            if (
                currentToken !== activationToken ||
                activeTrack !== track
            ) {
                return;
            }

            if (track.audio.paused) {
                track.audio.currentTime = 0;
            }

            await track.audio.play();

            fadeEmotionTrack(
                track,
                settings.emotionVolume,
                350
            );

        } catch (error) {
            console.warn(
                `Could not play the ${emotionName} track:`,
                error
            );
        }
    }


    /*
       Leave all emotion areas:
       fade out the emotion sound and restore TIME.
    */

    function deactivateEmotion() {
        const previousTrack = activeTrack;

        activeRegion = null;
        activeTrack = null;

        activationToken++;

        if (previousTrack) {
            stopEmotionTrack(previousTrack);
        }

        if (bgm) {
            setBgmDucked(false);
        }
    }

    /* -------------------------------------
   UNLOCK EMOTION AUDIO AFTER USER GESTURE
------------------------------------- */

function unlockEmotionAudio() {
    const context = getAudioContext();

    if (!context) return;

    const resumePromise = context.state === "suspended"
        ? context.resume()
        : Promise.resolve();

    resumePromise
        .then(() => {
            // Check whether the pointer is currently over an emotion
            const hoveredRegion = document.querySelector(
                ".emotion-region:hover"
            );

            if (!hoveredRegion) return;

            // Retry the currently hovered emotion
            activeRegion = null;
            activeTrack = null;

            activateEmotion(hoveredRegion);
        })
        .catch(error => {
            console.warn("Could not unlock emotion audio:", error);
        });
}

// A real click or key press unlocks audio playback
document.addEventListener(
    "pointerdown",
    unlockEmotionAudio,
    true
);

document.addEventListener(
    "keydown",
    unlockEmotionAudio,
    true
);


    /* -------------------------------------
       POINTER AND KEYBOARD INTERACTION
    ------------------------------------- */

    const emotionContainer = document.querySelector(".emotion-fields");

    function findEmotionRegion(element) {
        if (!element || !element.closest) {
            return null;
        }

        return element.closest(".emotion-region");
    }

    if (emotionContainer) {

        /*
           Pointer enters an emotion area.
        */

        emotionContainer.addEventListener("pointerover", (event) => {
            const region = findEmotionRegion(event.target);

            if (!region) return;

            // Ignore movement between children of the same region.
            if (region.contains(event.relatedTarget)) {
                return;
            }

            activateEmotion(region);
        });


        /*
           Pointer leaves an emotion area.
           If it moves directly to another area, switch tracks
           without briefly restoring the main BGM.
        */

        emotionContainer.addEventListener("pointerout", (event) => {
            const previousRegion = findEmotionRegion(event.target);

            if (!previousRegion) return;

            if (previousRegion.contains(event.relatedTarget)) {
                return;
            }

            const nextRegion = findEmotionRegion(event.relatedTarget);

            if (nextRegion) {
                activateEmotion(nextRegion);
            } else if (previousRegion === activeRegion) {
                deactivateEmotion();
            }
        });


        /*
           Keyboard focus support.
        */

        emotionContainer.addEventListener("focusin", (event) => {
            const region = findEmotionRegion(event.target);

            if (region) {
                activateEmotion(region);
            }
        });

        emotionContainer.addEventListener("focusout", (event) => {
            const nextRegion = findEmotionRegion(event.relatedTarget);

            if (nextRegion) {
                activateEmotion(nextRegion);
            } else {
                const previousRegion = findEmotionRegion(event.target);

                if (previousRegion === activeRegion) {
                    deactivateEmotion();
                }
            }
        });
    }


    /* -------------------------------------
       ANALOG CLOCK
    ------------------------------------- */

    const hourHand = document.getElementById("hour-hand");
    const minuteHand = document.getElementById("minute-hand");
    const secondHand = document.getElementById("second-hand");

    if (hourHand && minuteHand && secondHand) {
        const realStartTime = Date.now();
        const initialClockTime = new Date();

        const initialTimestamp = initialClockTime.getTime();

        function updateClock() {
            const realElapsed =
                Date.now() - realStartTime;

            const dreamElapsed =
                realElapsed * settings.clockSpeed;

            const dreamTime =
                new Date(initialTimestamp + dreamElapsed);

            const milliseconds =
                dreamTime.getMilliseconds();

            const seconds =
                dreamTime.getSeconds() + milliseconds / 1000;

            const minutes =
                dreamTime.getMinutes() + seconds / 60;

            const hours =
                (dreamTime.getHours() % 12) + minutes / 60;

            const secondAngle = seconds * 6;
            const minuteAngle = minutes * 6;
            const hourAngle = hours * 30;

            secondHand.style.transform =
                `rotate(${secondAngle}deg)`;

            minuteHand.style.transform =
                `rotate(${minuteAngle}deg)`;

            hourHand.style.transform =
                `rotate(${hourAngle}deg)`;

            requestAnimationFrame(updateClock);
        }

        updateClock();
    }


    /* -------------------------------------
       SPINNING TOP
    ------------------------------------- */

    const spinningTop = document.getElementById("spinning-top");

    if (spinningTop) {
        setTimeout(() => {
            spinningTop.classList.add("is-stopped");
        }, settings.topSpinTime);
    }


    /* -------------------------------------
       LAYER 03 — EVASIVE WAKE-UP BUTTON
    ------------------------------------- */

    const wakeButton = document.getElementById("wake-button");
    const wakeRunway = document.getElementById("wake-runway");

    if (wakeButton && wakeRunway) {
        let clickCount = 0;

        wakeButton.addEventListener("click", () => {
            clickCount++;

            /*
               First and second clicks:
               move the button to a new position.
            */

            if (clickCount < 3) {
                const runwayWidth = wakeRunway.clientWidth;
                const runwayHeight = wakeRunway.clientHeight;

                const buttonWidth = wakeButton.offsetWidth;
                const buttonHeight = wakeButton.offsetHeight;

                const minX = buttonWidth / 2 + 8;
                const maxX = runwayWidth - buttonWidth / 2 - 8;

                const minY = buttonHeight / 2 + 8;
                const maxY = runwayHeight - buttonHeight / 2 - 8;

                const randomX = maxX > minX
                    ? minX + Math.random() * (maxX - minX)
                    : runwayWidth / 2;

                const randomY = maxY > minY
                    ? minY + Math.random() * (maxY - minY)
                    : runwayHeight / 2;

                wakeButton.style.left = `${randomX}px`;
                wakeButton.style.top = `${randomY}px`;
                wakeButton.style.transform = "translate(-50%, -50%)";

            } else {
                /*
                   Third click:
                   finally return to the opening page.
                */

                window.location.href = "index.html";
            }
        });
    }

})();

// =====================================
// REAL-TIME CLOCK — OPENING PAGE ONLY
// =====================================

function startRealTimeClock() {
    const clock = document.querySelector(
        ".opening-page .clock-face"
    );

    if (!clock) return;

    const hourHand = clock.querySelector(".hour-hand");
    const minuteHand = clock.querySelector(".minute-hand");
    const secondHand = clock.querySelector(".second-hand");

    if (!hourHand || !minuteHand || !secondHand) return;

    function updateClock() {
        const now = new Date();

        const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
        const minutes = now.getMinutes() + seconds / 60;
        const hours = (now.getHours() % 12) + minutes / 60;

        // Calculate actual clock-hand angles
        const secondAngle = seconds * 6;
        const minuteAngle = minutes * 6;
        const hourAngle = hours * 30;

        // Update the hands
        secondHand.style.rotate = `${secondAngle}deg`;
        minuteHand.style.rotate = `${minuteAngle}deg`;
        hourHand.style.rotate = `${hourAngle}deg`;

        requestAnimationFrame(updateClock);
    }

    updateClock();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startRealTimeClock);
} else {
    startRealTimeClock();
}

// =========================================
// EXTREME DREAM CLOCK SPEED
// Layer 1 = 50x
// Layer 2 = 1,000x
// Layer 3 = 100,000x
// =========================================

(function startDreamClock() {
    const body = document.body;

    if (!body.classList.contains("dream-page")) return;

    const speedSettings = {
        "1": 20,
        "2": 50,
        "3": 110
    };

    const speed = speedSettings[body.dataset.layer];

    if (!speed) return;

    const clock = document.querySelector(".clock-face");
    if (!clock) return;

    const hourHand = clock.querySelector(".hour-hand");
    const minuteHand = clock.querySelector(".minute-hand");
    const secondHand = clock.querySelector(".second-hand");

    if (!hourHand || !minuteHand || !secondHand) return;

    // Stop any previous CSS animations
    [hourHand, minuteHand, secondHand].forEach(hand => {
        hand.style.setProperty("animation", "none", "important");
        hand.style.setProperty("transition", "none", "important");
    });

    // Start from the actual local time
    const realStartTime = Date.now();
    const performanceStart = performance.now();

    function updateClock(currentFrameTime) {
        // Accelerate elapsed time according to the current layer
        const elapsed = (currentFrameTime - performanceStart) * speed;
        const simulatedTime = new Date(realStartTime + elapsed);

        const seconds =
            simulatedTime.getSeconds() +
            simulatedTime.getMilliseconds() / 1000;

        const minutes =
            simulatedTime.getMinutes() + seconds / 60;

        const hours =
            (simulatedTime.getHours() % 12) + minutes / 60;

        // Calculate the angle of each hand
        secondHand.style.rotate = `${seconds * 6}deg`;
        minuteHand.style.rotate = `${minutes * 6}deg`;
        hourHand.style.rotate = `${hours * 30}deg`;

        requestAnimationFrame(updateClock);
    }

    requestAnimationFrame(updateClock);
})();

// =========================================
// DESCEND TRANSITION BETWEEN DREAM LAYERS
// =========================================

(function setupDreamDescent() {
    const body = document.body;

    if (!body.classList.contains("dream-page")) return;

    // Play entrance animation when arriving at a new layer
    if (sessionStorage.getItem("dreamDescentTransition") === "true") {
        sessionStorage.removeItem("dreamDescentTransition");
        body.classList.add("is-entering-layer");
    }

    // Intercept the DESCEND link
    const descentLink = document.querySelector(".descent-link");

    if (!descentLink) return;

    descentLink.addEventListener("click", function (event) {
        const nextPage = this.href;

        event.preventDefault();

        body.classList.add("is-descending");

        sessionStorage.setItem("dreamDescentTransition", "true");

        setTimeout(function () {
            window.location.href = nextPage;
        }, 850);
    });
})();