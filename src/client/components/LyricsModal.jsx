import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export function LyricsModal() {
  const { currentTrack, currentTime, isLyricsOpen, setIsLyricsOpen, seek } = usePlayer();
  const { palette } = useTheme();

  const [lyricsData, setLyricsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const lineRefs = useRef([]);

  useEffect(() => {
    if (!isLyricsOpen || !currentTrack) return;

    setLoading(true);
    fetch(`/api/spotify/lyrics/${encodeURIComponent(currentTrack.uri || currentTrack.id)}`)
      .then(r => r.json())
      .then(data => {
        setLyricsData(data);
        setLoading(false);
      })
      .catch(() => {
        setLyricsData(null);
        setLoading(false);
      });
  }, [isLyricsOpen, currentTrack]);

  if (!isLyricsOpen) return null;

  const currentMs = currentTime * 1000;
  const lines = lyricsData?.lines || [];

  // Find active line index based on startTimeMs
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const startTime = parseInt(lines[i].startTimeMs, 10);
    if (!isNaN(startTime) && currentMs >= startTime) {
      activeIndex = i;
    }
  }

  // Smooth scroll to active line
  useEffect(() => {
    if (activeIndex >= 0 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-3xl pt-safe pb-safe animate-fade-in">
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <div>
          <h2 className="font-bold text-lg">{currentTrack?.title}</h2>
          <p className="text-xs text-neutral-400">{currentTrack?.artist} - Letras Sincronizadas</p>
        </div>
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-12 max-w-2xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="text-center text-neutral-500 py-20">Cargando letras sincronizadas...</div>
        ) : lines.length === 0 ? (
          <div className="text-center text-neutral-500 py-20">
            No hay letras sincronizadas disponibles para esta canción.
          </div>
        ) : (
          lines.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                ref={el => lineRefs.current[idx] = el}
                onClick={() => {
                  const t = parseInt(line.startTimeMs, 10);
                  if (!isNaN(t)) seek(t / 1000);
                }}
                className={`cursor-pointer transition-all duration-300 font-extrabold text-2xl md:text-3xl leading-relaxed ${
                  isActive
                    ? 'text-white scale-105 origin-left'
                    : 'text-white/30 hover:text-white/60'
                }`}
                style={isActive ? { textShadow: `0 0 30px ${palette.dominant}` } : {}}
              >
                {line.words || '♪'}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
