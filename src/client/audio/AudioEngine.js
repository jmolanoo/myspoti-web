// AudioEngine.js - High-fidelity Persistent HTML5 Audio + Media Session API + Web Audio 5-band EQ

class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.currentTrack = null;
    this.isPlaying = false;
    this.duration = 0;
    this.currentTime = 0;

    this.audioContext = null;
    this.sourceNode = null;
    this.eqNodes = [];
    this.isEqInitialized = false;

    this.onStateChange = null;
    this.onTrackEnded = null;

    this.initListeners();
    this.setupMediaSession();
  }

  initListeners() {
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      if (this.onStateChange) {
        this.onStateChange({
          currentTime: this.currentTime,
          duration: this.duration || this.audio.duration || 0,
          isPlaying: !this.audio.paused
        });
      }
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('durationchange', () => {
      this.duration = this.audio.duration || 0;
      if (this.onStateChange) {
        this.onStateChange({
          currentTime: this.currentTime,
          duration: this.duration,
          isPlaying: !this.audio.paused
        });
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onTrackEnded) {
        this.onTrackEnded();
      }
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onStateChange) {
        this.onStateChange({ isPlaying: false, currentTime: this.audio.currentTime });
      }
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onStateChange) {
        this.onStateChange({ isPlaying: true, currentTime: this.audio.currentTime });
      }
    });
  }

  initWebAudio() {
    if (this.isEqInitialized || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

      // 5-band equalizer frequencies (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz) matching Orpheon
      const frequencies = [60, 230, 910, 3600, 14000];
      let previousNode = this.sourceNode;

      this.eqNodes = frequencies.map((freq) => {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0; // 0 dB
        previousNode.connect(filter);
        previousNode = filter;
        return filter;
      });

      previousNode.connect(this.audioContext.destination);
      this.isEqInitialized = true;
    } catch (err) {
      console.warn('[AudioEngine] Web Audio EQ init skipped or restricted by autoplay:', err);
    }
  }

  setupMediaSession() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;

    ms.setActionHandler('play', () => this.resume());
    ms.setActionHandler('pause', () => this.pause());
    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
    ms.setActionHandler('seekbackward', (details) => {
      this.seek(Math.max(0, this.audio.currentTime - (details.seekOffset || 10)));
    });
    ms.setActionHandler('seekforward', (details) => {
      this.seek(Math.min(this.duration, this.audio.currentTime + (details.seekOffset || 10)));
    });
  }

  updateMediaSessionMetadata(track) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Canción Desconocida',
      artist: track.artist || 'Artista Desconocido',
      album: track.album || 'Myspoti Player',
      artwork: [
        { src: track.coverUrl || '/icons/icon-192.png', sizes: '96x96', type: 'image/jpeg' },
        { src: track.coverUrl || '/icons/icon-192.png', sizes: '128x128', type: 'image/jpeg' },
        { src: track.coverUrl || '/icons/icon-192.png', sizes: '256x256', type: 'image/jpeg' },
        { src: track.coverUrl || '/icons/icon-512.png', sizes: '512x512', type: 'image/jpeg' },
      ]
    });
  }

  updateMediaSessionPosition() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;

    try {
      if (this.duration > 0 && !isNaN(this.audio.currentTime)) {
        navigator.mediaSession.setPositionState({
          duration: this.duration,
          playbackRate: this.audio.playbackRate || 1.0,
          position: Math.min(this.audio.currentTime, this.duration)
        });
      }
    } catch (e) {
      // Ignore transient position state sync errors
    }
  }

  async play(track, streamUrl) {
    this.initWebAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume(); } catch (e) {}
    }

    this.currentTrack = track;
    this.updateMediaSessionMetadata(track);

    if (streamUrl && this.audio.src !== streamUrl) {
      this.audio.src = streamUrl;
      this.audio.load();
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (err) {
      console.warn('[AudioEngine] Playback failed or waiting for user interaction:', err);
      this.isPlaying = false;
      throw err;
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  resume() {
    return this.audio.play();
  }

  seek(seconds) {
    if (!isNaN(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setSpeed(speed) {
    this.audio.playbackRate = Math.max(0.5, Math.min(3.5, speed));
  }

  setEqBand(bandIndex, gainDb) {
    if (this.eqNodes[bandIndex]) {
      this.eqNodes[bandIndex].gain.value = Math.max(-12, Math.min(12, gainDb));
    }
  }
}

export const audioEngine = new AudioEngine();
