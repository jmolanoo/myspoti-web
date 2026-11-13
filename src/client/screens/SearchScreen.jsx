import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Play, X, Music, User, Disc, Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';

export function SearchScreen() {
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      // 1. Fetch suggestions
      fetch(`/api/spotify/suggestions?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          if (d?.data?.searchSuggestions?.items) {
            setSuggestions(d.data.searchSuggestions.items.map(s => s.name));
          }
        })
        .catch(() => {});

      // 2. Fetch tracks
      setLoading(true);
      fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=tracks&limit=25`)
        .then(r => r.json())
        .then(data => {
          let tracks = [];
          if (data?.data?.searchV2?.tracksV2?.items) {
            tracks = data.data.searchV2.tracksV2.items.map(item => {
              const t = item.item?.data || {};
              return {
                uri: t.uri,
                title: t.name,
                artist: t.artists?.items?.[0]?.profile?.name || 'Artista',
                album: t.albumOfTrack?.name || '',
                coverUrl: t.albumOfTrack?.coverArt?.sources?.[0]?.url || '',
                durationMs: t.duration?.totalMilliseconds || 180000
              };
            });
          }
          setResults(tracks);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, 250);
  }, [query]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-36">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Buscar</h1>

      {/* Search Input Box */}
      <div className="relative max-w-xl">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué quieres escuchar hoy?"
          className="w-full bg-white/10 focus:bg-white/15 text-white pl-12 pr-10 py-3.5 rounded-full outline-none border border-transparent focus:border-white/20 transition placeholder:text-neutral-400 text-sm font-medium"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 6).map((sug, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(sug)}
              className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 border border-white/5 transition"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Results List */}
      <div>
        {loading ? (
          <div className="text-neutral-500 py-12">Buscando en Spotify...</div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map((track, idx) => (
              <div
                key={idx}
                onClick={() => playTrack(track, results)}
                className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/10 cursor-pointer group transition border border-transparent hover:border-white/5"
              >
                <img
                  src={track.coverUrl || '/icons/icon.svg'}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate group-hover:text-spotify-green transition">
                    {track.title}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">{track.artist}</div>
                </div>
                <Play size={18} className="opacity-0 group-hover:opacity-100 text-neutral-300 mr-2" />
              </div>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="text-neutral-500 py-12 text-center">No se encontraron resultados para "{query}"</div>
        ) : (
          /* Browse categories grid */
          <div>
            <h2 className="text-lg font-bold mb-4">Explorar todo</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'Música', color: 'from-purple-600 to-indigo-900', icon: Music },
                { name: 'Podcasts', color: 'from-emerald-600 to-teal-900', icon: Radio },
                { name: 'Lanzamientos', color: 'from-rose-600 to-pink-900', icon: Disc },
                { name: 'En Vivo', color: 'from-amber-600 to-orange-900', icon: User },
              ].map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={i}
                    onClick={() => setQuery(cat.name)}
                    className={`aspect-video p-4 rounded-xl bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition flex flex-col justify-between shadow-lg`}
                  >
                    <span className="font-bold text-lg">{cat.name}</span>
                    <Icon size={24} className="self-end opacity-70" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
