import React from 'react';
import { Palette, Shield, Info, Volume2, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export function SettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl mx-auto pb-36">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ajustes</h1>

      {/* Estilo Visual (Orpheon Parity) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Palette size={20} className="text-spotify-green" /> Estilo Visual y Temas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'classic', title: 'Clásico (Classic)', desc: 'Tema oscuro formal oficial Spotify #121212', icon: Sun },
            { id: 'immersive', title: 'Inmersivo (Mesh)', desc: 'Gradientes dinámicos fluidos reactivos al cover art', icon: Sparkles },
            { id: 'amoled', title: 'AMOLED Puro', desc: 'Negro absoluto #000000 para pantallas OLED', icon: Moon },
          ].map(opt => (
            <div
              key={opt.id}
              onClick={() => setThemeMode(opt.id)}
              className={`p-4 rounded-xl cursor-pointer border transition flex flex-col justify-between ${
                themeMode === opt.id
                  ? 'border-spotify-green bg-spotify-green/10 text-white'
                  : 'border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <div>
                <opt.icon size={22} className={themeMode === opt.id ? 'text-spotify-green mb-2' : 'text-neutral-400 mb-2'} />
                <div className="font-bold text-sm">{opt.title}</div>
                <div className="text-xs text-neutral-400 mt-1">{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audio & Quality */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Volume2 size={20} className="text-spotify-green" /> Calidad de Reproducción
        </h2>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 divide-y divide-white/5 text-sm">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-semibold">Calidad de Streaming</div>
              <div className="text-xs text-neutral-400">Automática (hasta 256 kbps AAC)</div>
            </div>
            <span className="text-xs text-spotify-green font-bold">ALTA</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-semibold">Normalización de Volumen</div>
              <div className="text-xs text-neutral-400">Igualar el volumen de todas las pistas</div>
            </div>
            <input type="checkbox" defaultChecked className="accent-spotify-green" />
          </div>
        </div>
      </div>

      {/* Platform & Licenses */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Info size={20} className="text-spotify-green" /> Información y Licencia
        </h2>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-xs text-neutral-400 space-y-2">
          <p><strong className="text-white">Myspoti Web PWA</strong> - Port multiplataforma basado en el software de código abierto <strong>Orpheon</strong> (GPL-3.0).</p>
          <p>Fuente de verdad: <code className="text-spotify-green">github.com/kota-zo/Orpheon</code></p>
          <p>BFF Proxy: Fastify + SQLite WAL + 179 GraphQL Operations.</p>
        </div>
      </div>
    </div>
  );
}
