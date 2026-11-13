import React, { useState, useEffect } from 'react';
import { Heart, Plus, Folder, Music, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';

export function LibraryScreen() {
  const { playTrack } = usePlayer();
  const [playlists, setPlaylists] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadLibrary = () => {
    fetch('/api/library/playlists')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setPlaylists(d))
      .catch(() => {});

    fetch('/api/library/favorites')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setFavoritesList(d))
      .catch(() => {});
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      await fetch('/api/library/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName })
      });
      setNewPlaylistName('');
      setShowCreateModal(false);
      loadLibrary();
    } catch (err) {}
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-36">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tu Biblioteca</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
        >
          <Plus size={16} /> Crear Playlist
        </button>
      </div>

      {/* Liked Songs Hero Card */}
      <div
        onClick={() => {
          if (favoritesList.length > 0) {
            playTrack(favoritesList[0], favoritesList);
          }
        }}
        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 cursor-pointer shadow-xl hover:scale-[1.01] active:scale-[0.99] transition flex items-end justify-between min-h-[140px]"
      >
        <div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Heart size={24} className="fill-white text-white" />
          </div>
          <h2 className="text-2xl font-bold">Canciones que te gustan</h2>
          <p className="text-white/80 text-sm mt-1">{favoritesList.length} canciones guardadas</p>
        </div>
        {favoritesList.length > 0 && (
          <button className="w-12 h-12 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg hover:scale-105 transition">
            <Play size={24} fill="black" className="ml-1" />
          </button>
        )}
      </div>

      {/* Playlists List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Playlists</h2>
        {playlists.length === 0 ? (
          <div className="text-neutral-500 py-6">Aún no has creado playlists. Toca "+ Crear Playlist" para comenzar.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {playlists.map((pl, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition"
              >
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                  <Music size={24} className="text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{pl.name}</div>
                  <div className="text-xs text-neutral-400 truncate">Playlist • Creada localmente</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal create */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleCreatePlaylist}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-lg">Nueva Playlist</h3>
            <input
              type="text"
              placeholder="Nombre de la playlist"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-white/10 px-4 py-3 rounded-lg outline-none text-white text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-spotify-green text-black hover:scale-105 transition"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
