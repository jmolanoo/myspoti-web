import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { audioEngine } from '../audio/AudioEngine.js';

const PRESETS = {
  'Plano': [0, 0, 0, 0, 0],
  'Bass Boost': [6, 4, 0, 0, -1],
  'Electrónica': [4, 2, 0, 2, 4],
  'Vocal': [-2, 0, 4, 3, 1],
  'Acústica': [3, 2, 1, 2, 3]
};

const BANDS = [
  { name: '60 Hz', desc: 'Sub-graves' },
  { name: '230 Hz', desc: 'Bajos' },
  { name: '910 Hz', desc: 'Medios' },
  { name: '3.6 kHz', desc: 'Vocales' },
  { name: '14 kHz', desc: 'Agudos' }
];

export function EqualizerModal() {
  const { isEqualizerOpen, setIsEqualizerOpen } = usePlayer();
  const [bandGains, setBandGains] = useState([0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState('Plano');

  if (!isEqualizerOpen) return null;

  const handleBandChange = (index, gain) => {
    const updated = [...bandGains];
    updated[index] = gain;
    setBandGains(updated);
    setActivePreset('Personalizado');
    audioEngine.setEqBand(index, gain);
  };

  const applyPreset = (presetName) => {
    const values = PRESETS[presetName];
    if (!values) return;
    setBandGains(values);
    setActivePreset(presetName);
    values.forEach((gain, idx) => audioEngine.setEqBand(idx, gain));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl pt-safe pb-safe animate-fade-in">
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders size={20} className="text-spotify-green" />
          <h2 className="font-bold text-lg">Ecualizador Gráfico (5 Bandas)</h2>
        </div>
        <button
          onClick={() => setIsEqualizerOpen(false)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full space-y-8">
        {/* Preset Chips */}
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
            Presets de Audio
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PRESETS).map(name => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  activePreset === name
                    ? 'bg-spotify-green text-black'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-5 gap-3 pt-6 pb-2">
          {BANDS.map((band, idx) => (
            <div key={idx} className="flex flex-col items-center gap-4">
              <span className="text-xs font-bold text-spotify-green">
                {bandGains[idx] > 0 ? `+${bandGains[idx]}` : bandGains[idx]} dB
              </span>

              <div className="h-48 flex items-center justify-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={bandGains[idx]}
                  onChange={(e) => handleBandChange(idx, parseInt(e.target.value, 10))}
                  className="h-44 w-2 appearance-none bg-white/20 rounded cursor-pointer accent-spotify-green -rotate-90"
                />
              </div>

              <div className="text-center">
                <div className="text-xs font-semibold">{band.name}</div>
                <div className="text-[10px] text-neutral-400">{band.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
