import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronDown,
  Heart,
  ListMusic,
  FileText,
  Sliders,
  Moon,
  Clock
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    volume,
    changeVolume,
    repeatMode,
    toggleRepeat,
    isShuffle,
    toggleShuffle,
    favorites,
    toggleFavorite,
    isExpandedPlayer,
    setIsExpandedPlayer,
    isLyricsOpen,
    setIsLyricsOpen,
    isQueueOpen,
    setIsQueueOpen,
    isEqualizerOpen,
    setIsEqualizerOpen,
    sleepTimerMinutes,
    startSleepTimer
  } = usePlayer();

  const { themeMode } = useTheme();
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  if (!currentTrack) return null;

  const isLiked = favorites.has(currentTrack.uri || currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* 1. Mini Player Bar (Persistent at bottom) */}
      <div className={`fixed bottom-16 md:bottom-0 left-0 right-0 z-40 transition-all ${
        themeMode === 'amoled'
          ? 'bg-black border-t border-neutral-900'
          : themeMode === 'immersive'
          ? 'bg-black/60 backdrop-blur-xl border-t border-white/10'
          : 'bg-[#181818] border-t border-[#282828]'
      }`}>
        {/* Scrubber line for quick scrub */}
        <div
          className="w-full h-1 bg-white/10 cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seek(pos * duration);
          }}
        >
          <div
            className="h-full bg-spotify-green transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Track info */}
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            onClick={() => setIsExpandedPlayer(true)}
          >
            <img
              src={currentTrack.coverUrl || '/icons/icon.svg'}
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover shadow"
            />
            <div className="min-w-0 pr-4">
              <div className="font-semibold text-sm truncate">{currentTrack.title}</div>
              <div className="text-xs text-neutral-400 truncate">{currentTrack.artist}</div>
            </div>
          </div>

          {/* Center transport controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="text-neutral-400 hover:text-white p-2"
              title="Guardar en biblioteca"
            >
              <Heart size={20} className={isLiked ? 'text-spotify-green fill-spotify-green' : ''} />
            </button>

            <button onClick={prevTrack} className="text-neutral-300 hover:text-white p-2">
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
            </button>

            <button onClick={nextTrack} className="text-neutral-300 hover:text-white p-2">
              <SkipForward size={20} />
            </button>
          </div>

          {/* Right secondary controls (Desktop) */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={() => setIsLyricsOpen(true)}
              className={`p-2 rounded hover:text-white ${isLyricsOpen ? 'text-spotify-green' : 'text-neutral-400'}`}
              title="Letras"
            >
              <FileText size={18} />
            </button>

            <button
              onClick={() => setIsQueueOpen(true)}
              className={`p-2 rounded hover:text-white ${isQueueOpen ? 'text-spotify-green' : 'text-neutral-400'}`}
              title="Cola"
            >
              <ListMusic size={18} />
            </button>

            <button
              onClick={() => setIsEqualizerOpen(true)}
              className={`p-2 rounded hover:text-white ${isEqualizerOpen ? 'text-spotify-green' : 'text-neutral-400'}`}
              title="Ecualizador"
            >
              <Sliders size={18} />
            </button>

            <div className="flex items-center gap-2 w-28 ml-2">
              <Volume2 size={18} className="text-neutral-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-full accent-spotify-green h-1 bg-white/20 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full-Screen Modal Player (Classic & Immersive Orpheon Parity) */}
      {isExpandedPlayer && (
        <div className={`fixed inset-0 z-50 flex flex-col pt-safe pb-safe animate-fade-in ${
          themeMode === 'amoled'
            ? 'bg-black'
            : themeMode === 'immersive'
            ? 'bg-black/90 backdrop-blur-2xl'
            : 'bg-[#121212]'
        }`}>
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={() => setIsExpandedPlayer(false)}
              className="p-2 text-neutral-400 hover:text-white"
            >
              <ChevronDown size={28} />
            </button>

            <div className="text-center">
              <div className="text-xs tracking-wider uppercase text-neutral-400 font-medium">
                REPRODUCIENDO DESDE
              </div>
              <div className="text-sm font-semibold truncate max-w-[220px]">
                {currentTrack.album || 'Myspoti'}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSleepMenu(!showSleepMenu)}
                className={`p-2 rounded ${sleepTimerMinutes > 0 ? 'text-spotify-green' : 'text-neutral-400 hover:text-white'}`}
                title="Temporizador de apagado"
              >
                <Moon size={22} />
              </button>

              {showSleepMenu && (
                <div className="absolute right-0 top-12 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-2 w-48 z-50 text-sm">
                  <div className="text-xs text-neutral-400 font-semibold px-2 py-1">Sleep Timer</div>
                  {[0, 5, 15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => {
                        startSleepTimer(mins);
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-white/10 rounded flex items-center justify-between"
                    >
                      <span>{mins === 0 ? 'Desactivar' : `${mins} minutos`}</span>
                      {sleepTimerMinutes === mins && <div className="w-2 h-2 rounded-full bg-spotify-green" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cover Art Stage */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <img
                src={currentTrack.coverUrl || '/icons/icon.svg'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details & Controls Bottom Section */}
          <div className="px-6 pb-8 max-w-lg mx-auto w-full">
            {/* Title & Like */}
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 pr-4">
                <h1 className="text-2xl font-bold truncate">{currentTrack.title}</h1>
                <p className="text-neutral-400 font-medium truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => toggleFavorite(currentTrack)}
                className="p-3 text-neutral-400 hover:text-white"
              >
                <Heart size={26} className={isLiked ? 'text-spotify-green fill-spotify-green' : ''} />
              </button>
            </div>

            {/* Scrubber slider */}
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-spotify-green"
              />
              <div className="flex justify-between text-xs text-neutral-400 font-medium mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition ${isShuffle ? 'text-spotify-green' : 'text-neutral-400'}`}
              >
                <Shuffle size={22} />
              </button>

              <button onClick={prevTrack} className="p-3 text-white hover:scale-110 active:scale-95 transition">
                <SkipBack size={32} />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
              >
                {isPlaying ? <Pause size={30} fill="black" /> : <Play size={30} fill="black" className="ml-1" />}
              </button>

              <button onClick={nextTrack} className="p-3 text-white hover:scale-110 active:scale-95 transition">
                <SkipForward size={32} />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 transition relative ${repeatMode !== 'off' ? 'text-spotify-green' : 'text-neutral-400'}`}
              >
                <Repeat size={22} />
                {repeatMode === 'one' && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold">1</span>
                )}
              </button>
            </div>

            {/* Auxiliary actions (Lyrics, Queue, Equalizer) */}
            <div className="flex items-center justify-around border-t border-white/10 pt-4">
              <button
                onClick={() => setIsLyricsOpen(true)}
                className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <FileText size={20} />
                <span>Letras</span>
              </button>

              <button
                onClick={() => setIsQueueOpen(true)}
                className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <ListMusic size={20} />
                <span>Cola</span>
              </button>

              <button
                onClick={() => setIsEqualizerOpen(true)}
                className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                <Sliders size={20} />
                <span>Ecualizador</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
