import React from "react";
import { X } from "lucide-react";

export const ParticleSettingsMenu = ({
  particleCount,
  setParticleCount,
  particleSpeed,
  setParticleSpeed,
  particleSize,
  setParticleSize,
  particleColor,
  setParticleColor,
  onClose,
}) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-10 w-80">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-cyan-400">Particle Settings</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X size={24} />
      </button>
    </div>
    <div className="mb-4">
      <label className="block text-cyan-400 mb-2">
        Particle Count: {particleCount}
      </label>
      <input
        type="range"
        min="50"
        max="1000"
        value={particleCount}
        onChange={(e) => setParticleCount(Number(e.target.value))}
        className="w-full"
      />
    </div>
    <div className="mb-4">
      <label className="block text-cyan-400 mb-2">
        Particle Speed: {particleSpeed.toFixed(2)}
      </label>
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={particleSpeed}
        onChange={(e) => setParticleSpeed(Number(e.target.value))}
        className="w-full"
      />
    </div>
    <div className="mb-4">
      <label className="block text-cyan-400 mb-2">
        Particle Size: {particleSize.toFixed(2)}
      </label>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        value={particleSize}
        onChange={(e) => setParticleSize(Number(e.target.value))}
        className="w-full"
      />
    </div>
    <div>
      <label className="block text-cyan-400 mb-2">Particle Color:</label>
      <input
        type="color"
        value={particleColor}
        onChange={(e) => setParticleColor(e.target.value)}
        className="w-full"
      />
    </div>
  </div>
);
