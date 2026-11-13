import React, { useState } from 'react';
import { Home, Search, Library, Settings, Blocks, Radio } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import { PlayerProvider, usePlayer } from './context/PlayerContext.jsx';
import { ImmersiveMeshBackground } from './components/ImmersiveMeshBackground.jsx';
import { PlayerBar } from './components/PlayerBar.jsx';
import { LyricsModal } from './components/LyricsModal.jsx';
import { QueueModal } from './components/QueueModal.jsx';
import { EqualizerModal } from './components/EqualizerModal.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { SearchScreen } from './screens/SearchScreen.jsx';
import { LibraryScreen } from './screens/LibraryScreen.jsx';
import { SettingsScreen } from './screens/SettingsScreen.jsx';
import { ExtensionsScreen } from './screens/ExtensionsScreen.jsx';

function Shell() {
  const [activeTab, setActiveTab] = useState('home');
  const { themeMode } = useTheme();

  return (
    <div className={`relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden ${
      themeMode === 'amoled' ? 'bg-black' : themeMode === 'classic' ? 'bg-[#121212]' : 'bg-[#080808]'
    }`}>
      {/* Immersive mesh gradient background */}
      <ImmersiveMeshBackground />

      {/* Desktop Navigation Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 p-4 z-20 justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <Radio size={28} className="text-spotify-green" />
            <span className="font-extrabold text-xl tracking-tight">Myspoti</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'home', label: 'Inicio', icon: Home },
              { id: 'search', label: 'Buscar', icon: Search },
              { id: 'library', label: 'Tu Biblioteca', icon: Library },
              { id: 'extensions', label: 'Extensiones', icon: Blocks },
              { id: 'settings', label: 'Ajustes', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-spotify-green' : ''} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Screen Content */}
      <main className="flex-1 overflow-y-auto z-10 pt-safe">
        {activeTab === 'home' && <HomeScreen onNavigate={setActiveTab} />}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'library' && <LibraryScreen />}
        {activeTab === 'extensions' && <ExtensionsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Mobile Bottom Navigation Bar (iOS Ergonómico) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around py-2.5 pb-safe z-30">
        {[
          { id: 'home', label: 'Inicio', icon: Home },
          { id: 'search', label: 'Buscar', icon: Search },
          { id: 'library', label: 'Biblioteca', icon: Library },
          { id: 'settings', label: 'Ajustes', icon: Settings },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                isActive ? 'text-spotify-green' : 'text-neutral-400'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Overlays & Modals */}
      <PlayerBar />
      <LyricsModal />
      <QueueModal />
      <EqualizerModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PlayerProvider>
        <Shell />
      </PlayerProvider>
    </ThemeProvider>
  );
}
