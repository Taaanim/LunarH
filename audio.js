/**
 * IMPOSTER HUNT - Audio Manager
 * Handles all game sounds with Web Audio API
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        this.activeOscillators = [];

        this.initialized = false;

        this.volumes = {
            master: 0.5,
            music: 0.3,
            sfx: 0.7
        };
    }

    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volumes.master;

            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.volumes.music;

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.volumes.sfx;

            this.initialized = true;
        } catch (e) {
            console.log('Audio not available:', e);
        }
    }

    // Button click sound
    playButtonClick() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Task complete sound
    playTaskComplete() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = this.audioContext.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Kill sound
    playKillSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        // Stab sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

        filter.type = 'lowpass';
        filter.frequency.value = 500;

        gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);

        // Additional noise burst
        const noiseBuffer = this.createNoiseBuffer(0.1);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();

        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        noiseSource.start();
    }

    createNoiseBuffer(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    // Emergency alarm - LOUD AND DRAMATIC
    playEmergencyAlarm() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        // Main siren - alternating high/low tones
        const playBeep = (startTime, freq, volume = 0.8) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'square';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.setValueAtTime(0, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        };

        // Play 10 beeps (longer, louder alarm)
        for (let i = 0; i < 10; i++) {
            const time = this.audioContext.currentTime + i * 0.25;
            playBeep(time, i % 2 === 0 ? 1000 : 750, 0.9); // Louder volume
        }

        // Add bass rumble for impact
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();

        bassOsc.connect(bassGain);
        bassGain.connect(this.sfxGain);

        bassOsc.type = 'sine';
        bassOsc.frequency.value = 80;

        bassGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2.5);

        bassOsc.start();
        bassOsc.stop(this.audioContext.currentTime + 2.5);

        // Add white noise burst for urgency
        const noiseBuffer = this.createNoiseBuffer(0.3);
        for (let i = 0; i < 5; i++) {
            const noiseSource = this.audioContext.createBufferSource();
            const noiseGain = this.audioContext.createGain();

            noiseSource.buffer = noiseBuffer;
            noiseSource.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            const startTime = this.audioContext.currentTime + i * 0.5;
            noiseGain.gain.setValueAtTime(0.4, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            noiseSource.start(startTime);
        }
    }

    // Emotion sounds - ENHANCED AND LOUDER
    playEmotionSound(emotion, intensity = 5) {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        const emotionSettings = {
            suspicious: { freq: 180, type: 'sawtooth', duration: 0.8, mod: 8 },
            accusing: { freq: 140, type: 'square', duration: 0.6, mod: 25 },
            defending: { freq: 450, type: 'triangle', duration: 0.9, mod: 4 },
            confused: { freq: 280, type: 'sine', duration: 0.7, mod: 15 },
            innocent: { freq: 550, type: 'sine', duration: 0.8, mod: 3 }
        };

        const settings = emotionSettings[emotion] || emotionSettings.suspicious;
        const volume = 0.5 + (intensity / 10) * 0.5; // Louder base volume

        const osc = this.audioContext.createOscillator();
        const modOsc = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();
        const gain = this.audioContext.createGain();

        modOsc.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = settings.type;
        osc.frequency.value = settings.freq;

        modOsc.type = 'sine';
        modOsc.frequency.value = settings.mod * (intensity / 5);
        modGain.gain.value = 30 * (intensity / 5); // Stronger modulation

        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + settings.duration);

        modOsc.start();
        osc.start();

        modOsc.stop(this.audioContext.currentTime + settings.duration);
        osc.stop(this.audioContext.currentTime + settings.duration);

        this.activeOscillators.push(osc, modOsc);
    }

    stopEmotionSounds() {
        this.activeOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.activeOscillators = [];
    }

    // Vote sound
    playVoteSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // Eject sound
    playEjectSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 1.5);

        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);

        osc.start();
        osc.stop(this.audioContext.currentTime + 1.5);
    }

    // Victory fanfare
    playVictoryFanfare(crewmatesWin) {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

        const notes = crewmatesWin
            ? [523, 659, 784, 1047, 784, 1047]  // Happy major
            : [220, 208, 196, 185, 175, 165];   // Ominous descending

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = crewmatesWin ? 'sine' : 'sawtooth';
            osc.frequency.value = freq;

            const startTime = this.audioContext.currentTime + i * 0.2;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }

    // Ambient music
    playAmbientMusic(type = 'lobby') {
        if (!this.initialized) this.init();
        this.stopAmbientMusic();

        if (!this.audioContext) return;

        const createDrone = (freq, detuneAmount = 0) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = detuneAmount;
            return osc;
        };

        const drones = type === 'game'
            ? [createDrone(55), createDrone(82.5, 5), createDrone(110, -5)]
            : [createDrone(65), createDrone(97.5, 3), createDrone(130, -3)];

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = type === 'game' ? 0.08 : 0.05;
        gainNode.connect(this.musicGain);

        drones.forEach(osc => {
            osc.connect(gainNode);
            osc.start();
        });

        this.currentMusic = { drones, gain: gainNode };
    }

    stopAmbientMusic() {
        if (this.currentMusic) {
            this.currentMusic.drones.forEach(osc => {
                try { osc.stop(); } catch (e) { }
            });
            this.currentMusic = null;
        }
    }

    stopAll() {
        this.stopAmbientMusic();
        this.stopEmotionSounds();
    }

    setVolume(type, value) {
        this.volumes[type] = value;

        if (type === 'master' && this.masterGain) {
            this.masterGain.gain.value = value;
        } else if (type === 'music' && this.musicGain) {
            this.musicGain.gain.value = value;
        } else if (type === 'sfx' && this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    }
}

// Create global instance
window.audioManager = new AudioManager();

// Initialize on first user interaction
document.addEventListener('click', () => {
    window.audioManager?.init();
}, { once: true });
