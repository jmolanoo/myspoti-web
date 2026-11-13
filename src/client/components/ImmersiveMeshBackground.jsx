import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export function ImmersiveMeshBackground() {
  const { themeMode, palette } = useTheme();

  if (themeMode !== 'immersive') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000">
      {/* Dynamic blurred mesh gradient orbs */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[80vw] h-[80vw] rounded-full blur-[100px] opacity-35 animate-mesh-slow transition-colors duration-1000"
        style={{ backgroundColor: palette.dominant }}
      />
      <div
        className="absolute top-[40%] -right-[15%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-25 animate-mesh-slow transition-colors duration-1000"
        style={{
          backgroundColor: palette.secondary,
          animationDelay: '-7s'
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[75vw] h-[75vw] rounded-full blur-[110px] opacity-30 animate-mesh-slow transition-colors duration-1000"
        style={{
          backgroundColor: palette.dark,
          animationDelay: '-14s'
        }}
      />
      {/* Subtle Noise / Vignette */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[60px]" />
    </div>
  );
}
