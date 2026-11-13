import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Disc, Flame } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export function HomeScreen({ onNavigate }) {
  const { playTrack } = usePlayer();
  const { themeMode } = useTheme();

  const [topTracks, setTopTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial search tracks as recommendations
    Promise.all([
      fetch('/api/spotify/search?q=Top%20Hits&type=tracks&limit=10').then(r => r.json()).catch(() => ({})),
      fetch('/api/library/history').then(r => r.json()).catch(() => [])
    ]).then(([searchData, historyData]) => {
      // Parse search data if returned from GQL or fallback
      let tracks = [];
      if (searchData?.data?.searchV2?.tracksV2?.items) {
        tracks = searchData.data.searchV2.tracksV2.items.map(item => {
          const t = item.item?.data || {};
          return {
            uri: t.uri,
            title: t.name,
            artist: t.artists?.items?.[0]?.profile?.name || 'Artista',
            coverUrl: t.albumOfTrack?.coverArt?.sources?.[0]?.url || '',
            durationMs: t.duration?.totalMilliseconds || 180000
          };
        });
      }
      setTopTracks(tracks);
      setRecentTracks(Array.isArray(historyData) ? historyData : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-36">
      {/* Hero Welcome banner */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Inicio</h1>
      </div>

      {/* Quick Launch Cards (Recientes) */}
      {recentTracks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Flame size={20} className="text-spotify-green" /> Escuchado recientemente
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentTracks.slice(0, 8).map((track, idx) => (
              <div
                key={idx}
                onClick={() => playTrack(track, recentTracks)}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer group transition border border-white/5"
              >
                <img
                  src={track.cover_url || '/icons/icon.svg'}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{track.title}</div>
                  <div className="text-xs text-neutral-400 truncate">{track.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Recommendations */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-spotify-green" /> Recomendaciones para ti
        </h2>
        {loading ? (
          <div className="text-neutral-500 py-12">Cargando catálogo...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topTracks.map((track, idx) => (
              <div
                key={idx}
                onClick={() => playTrack(track, topTracks)}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer group transition border border-white/5 flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3">
                  <img
                    src={track.coverUrl || '/icons/icon.svg'}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xl hover:scale-105 transition">
                    <Play size={20} fill="black" className="ml-0.5" />
                  </button>
                </div>
                <div className="font-semibold text-sm truncate">{track.title}</div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
