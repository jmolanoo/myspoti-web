import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine.js';
import { useTheme } from './ThemeContext.jsx';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const { updatePaletteFromCover } = useTheme();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Queue state
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  // Playback modes
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [volume, setVolume] = useState(1.0);

  // Modals & Panels
  const [isExpandedPlayer, setIsExpandedPlayer] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);

  // Favorites cache
  const [favorites, setFavorites] = useState(new Set());

  // Sleep timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0);
  const sleepTimerRef = useRef(null);

  // 1. AudioEngine listener synchronization
  useEffect(() => {
    audioEngine.onStateChange = (state) => {
      if (state.isPlaying !== undefined) setIsPlaying(state.isPlaying);
      if (state.currentTime !== undefined) setCurrentTime(state.currentTime);
      if (state.duration !== undefined) setDuration(state.duration);
    };

    audioEngine.onTrackEnded = () => {
      handleTrackEnded();
    };

    // Load initial favorites from backend
    fetch('/api/library/favorites')
      .then(r => r.json())
      .then(favs => {
        if (Array.isArray(favs)) {
          setFavorites(new Set(favs.map(f => f.track_uri)));
        }
      })
      .catch(() => {});
  }, []);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.resume();
      return;
    }
    nextTrack();
  }, [repeatMode, queueIndex, queue]);

  const playTrack = useCallback(async (track, newQueue = null) => {
    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.uri === track.uri || t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }

    setCurrentTrack(track);
    if (track.coverUrl) {
      updatePaletteFromCover(track.coverUrl);
    }

    // Record to history in BFF
    fetch('/api/library/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track_uri: track.uri || track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        cover_url: track.coverUrl || '',
        duration_ms: track.durationMs || 0
      })
    }).catch(() => {});

    // Stream URL resolution: direct audio URL, preview URL or fallback audio
    const streamUrl = track.audioUrl || track.previewUrl || `/api/audio/stream/${encodeURIComponent(track.uri || track.id)}`;
    try {
      await audioEngine.play(track, streamUrl);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Playback error or waiting for gesture:', err);
    }
  }, [updatePaletteFromCover]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    if (!queue.length) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return;
      }
    }
    setQueueIndex(nextIdx);
    playTrack(queue[nextIdx]);
  }, [queue, queueIndex, repeatMode, playTrack]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    if (!queue.length) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx]);
  }, [currentTime, queue, queueIndex, playTrack]);

  const seek = useCallback((positionSec) => {
    audioEngine.seek(positionSec);
    setCurrentTime(positionSec);
  }, []);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    audioEngine.setVolume(val);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(curr => curr === 'off' ? 'all' : curr === 'all' ? 'one' : 'off');
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(curr => !curr);
  }, []);

  const toggleFavorite = useCallback(async (track) => {
    if (!track) return;
    const uri = track.uri || track.id;
    const isFav = favorites.has(uri);

    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(uri);
      else next.add(uri);
      return next;
    });

    try {
      await fetch('/api/library/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_uri: uri,
          title: track.title,
          artist: track.artist,
          album: track.album || '',
          cover_url: track.coverUrl || '',
          duration_ms: track.durationMs || 0
        })
      });
    } catch (e) {
      // Revert on failure
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFav) next.add(uri);
        else next.delete(uri);
        return next;
      });
    }
  }, [favorites]);

  const startSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    if (minutes <= 0) {
      setSleepTimerMinutes(0);
      return;
    }

    setSleepTimerMinutes(minutes);
    const endTime = Date.now() + minutes * 60 * 1000;

    sleepTimerRef.current = setInterval(() => {
      const remainingMs = endTime - Date.now();
      if (remainingMs <= 0) {
        clearInterval(sleepTimerRef.current);
        setSleepTimerMinutes(0);
        audioEngine.pause();
        setIsPlaying(false);
      } else {
        setSleepTimerMinutes(Math.ceil(remainingMs / 60000));
      }
    }, 5000);
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      queue,
      queueIndex,
      isShuffle,
      repeatMode,
      volume,
      favorites,
      isExpandedPlayer,
      setIsExpandedPlayer,
      isLyricsOpen,
      setIsLyricsOpen,
      isQueueOpen,
      setIsQueueOpen,
      isEqualizerOpen,
      setIsEqualizerOpen,
      sleepTimerMinutes,
      startSleepTimer,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      changeVolume,
      toggleRepeat,
      toggleShuffle,
      toggleFavorite
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
