import React from "react";
import { X } from "lucide-react";

export const SettingsMenu = ({ tempo, setTempo, steps, setSteps, onClose }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-10 w-80">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-cyan-400">Settings</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X size={24} />
      </button>
    </div>
    <div className="mb-4">
      <label className="block text-cyan-400 mb-2">Tempo: {tempo} BPM</label>
      <input
        type="range"
        min="60"
        max="200"
        value={tempo}
        onChange={(e) => setTempo(Number(e.target.value))}
        className="w-full"
      />
    </div>
    <div>
      <label className="block text-cyan-400 mb-2">Steps: {steps}</label>
      <input
        type="range"
        min="4"
        max="50"
        value={steps}
        onChange={(e) => setSteps(Number(e.target.value))}
        className="w-full"
      />
    </div>
  </div>
);
