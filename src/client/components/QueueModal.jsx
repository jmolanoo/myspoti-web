import React from 'react';
import { X, Play, Trash2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';

export function QueueModal() {
  const { isQueueOpen, setIsQueueOpen, currentTrack, queue, queueIndex, playTrack } = usePlayer();

  if (!isQueueOpen) return null;

  const upNext = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl pt-safe pb-safe animate-fade-in">
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <h2 className="font-bold text-lg">Cola de Reproducción</h2>
        <button
          onClick={() => setIsQueueOpen(false)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Currently Playing */}
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
            En Reproducción
          </div>
          {currentTrack ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/5">
              <img
                src={currentTrack.coverUrl || '/icons/icon.svg'}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-spotify-green truncate">{currentTrack.title}</div>
                <div className="text-xs text-neutral-300 truncate">{currentTrack.artist}</div>
              </div>
            </div>
          ) : (
            <div className="text-neutral-500 text-sm">Nada en reproducción</div>
          )}
        </div>

        {/* Up next in queue */}
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
            A Continuación ({upNext.length})
          </div>
          {upNext.length === 0 ? (
            <div className="text-neutral-500 text-sm py-4">No hay más pistas en la cola.</div>
          ) : (
            <div className="space-y-1.5">
              {upNext.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer group transition"
                >
                  <img
                    src={track.coverUrl || '/icons/icon.svg'}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate group-hover:text-spotify-green transition">
                      {track.title}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">{track.artist}</div>
                  </div>
                  <Play size={16} className="opacity-0 group-hover:opacity-100 text-neutral-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
