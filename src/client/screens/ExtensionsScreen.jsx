import React from 'react';
import { Blocks, ShieldCheck, Download, Music2, FileText } from 'lucide-react';

export function ExtensionsScreen() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto pb-36">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Extensiones</h1>
          <p className="text-neutral-400 text-sm mt-1">Ecosistema modular de fuentes de audio, letras y descargadores en sandbox.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            name: 'YouTube Music Passthrough',
            type: 'Fuente de Audio',
            icon: Music2,
            version: 'v1.4.0',
            status: 'Activa (Sandbox Web Worker)',
            desc: 'Resolución de audio alternativo directo para pistas no disponibles.'
          },
          {
            name: 'Genius Synced Lyrics',
            type: 'Fuente de Letras',
            icon: FileText,
            version: 'v2.1.2',
            status: 'Activa',
            desc: 'Letras adicionales e interpretaciones de canciones de la comunidad Genius.'
          },
          {
            name: 'Local Offline Cache Provider',
            type: 'Descargador / Cache',
            icon: Download,
            version: 'v1.0.5',
            status: 'Activa (Origin Private File System)',
            desc: 'Almacenamiento persistente en IndexedDB para modo sin conexión.'
          }
        ].map((ext, idx) => {
          const Icon = ext.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon size={20} className="text-spotify-green" />
                </div>
                <div>
                  <div className="font-bold text-base">{ext.name}</div>
                  <div className="text-xs text-neutral-400">{ext.type} • {ext.version}</div>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">{ext.desc}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="flex items-center gap-1.5 text-spotify-green font-medium">
                  <ShieldCheck size={14} /> {ext.status}
                </span>
                <button className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold">
                  Ajustes
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
