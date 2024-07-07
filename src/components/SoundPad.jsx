import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Trash2,
  Settings,
  Download,
  Sliders,
  Music,
  Shuffle,
  Save,
  Plus,
  Volume2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "./ui/Button";
import { drumSounds, defaultTracks, availableLoops } from "./constants";
import { SettingsMenu } from "./SettingsMenu";
import { ParticleSettingsMenu } from "./ParticleSettingsMenu";
import { createParticles, animateParticles } from "./particleUtils";
import { bufferToWave } from "./audioUtils";
import WaveSurfer from "wavesurfer.js";

const SoundPad = () => {
  const [steps, setSteps] = useState(16);
  const [sequence, setSequence] = useState(defaultTracks[0].pattern);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticleSettings, setShowParticleSettings] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const canvasRef = useRef(null);
  const [audioBuffers, setAudioBuffers] = useState({});
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const beatRef = useRef(false);
  const [currentTrack, setCurrentTrack] = useState(defaultTracks[0].name);
  const [clickedSquare, setClickedSquare] = useState(null);
  const [savedTracks, setSavedTracks] = useState([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [selectedLoops, setSelectedLoops] = useState([]);
  const [showLoopSettings, setShowLoopSettings] = useState(null);
  const waveformRefs = useRef([]);
  const loopAudios = useRef([]);

  const [particleCount, setParticleCount] = useState(1000);
  const [particleSpeed, setParticleSpeed] = useState(2);
  const [particleSize, setParticleSize] = useState(1);
  const [particleColor, setParticleColor] = useState("#FFFFFF");

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    const loadSounds = async () => {
      const buffers = {};
      for (const [sound, file] of Object.entries(drumSounds)) {
        const response = await fetch(file);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        buffers[sound] = audioBuffer;
      }
      setAudioBuffers(buffers);
    };

    loadSounds();
    loadSavedTracks();

    return () => {
      if (context.state !== "closed") {
        context.close();
      }
    };
  }, []);

  useEffect(() => {
    setSequence((prev) =>
      Object.keys(prev).reduce((acc, sound) => {
        acc[sound] = Array(steps)
          .fill(false)
          .map((_, i) => prev[sound][i] || false);
        return acc;
      }, {})
    );
  }, [steps]);

  useEffect(() => {
    selectedLoops.forEach((loop, index) => {
      if (waveformRefs.current[index]) {
        if (waveformRefs.current[index].wavesurfer) {
          waveformRefs.current[index].wavesurfer.destroy();
        }
        const wavesurfer = WaveSurfer.create({
          container: waveformRefs.current[index],
          waveColor: "#4a9eff",
          progressColor: "#383351",
          cursorColor: "#383351",
          barWidth: 2,
          barRadius: 3,
          responsive: true,
          height: 50,
          normalize: true,
          partialRender: true,
        });
        wavesurfer.load(availableLoops[loop.name]);
        waveformRefs.current[index].wavesurfer = wavesurfer;
      }

      if (!loopAudios.current[index]) {
        const audio = new Audio(availableLoops[loop.name]);
        audio.loop = true;
        loopAudios.current[index] = audio;
      }
      loopAudios.current[index].volume = loop.volume;
      loopAudios.current[index].playbackRate = loop.tempo;
    });

    // Remove excess audio elements
    loopAudios.current
      .splice(selectedLoops.length)
      .forEach((audio) => audio.pause());

    return () => {
      loopAudios.current.forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
      waveformRefs.current.forEach((ref) => {
        if (ref && ref.wavesurfer) {
          ref.wavesurfer.destroy();
        }
      });
    };
  }, [selectedLoops]);

  useEffect(() => {
    loopAudios.current.forEach((audio) => {
      if (isPlaying) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  }, [isPlaying]);

  const toggleStep = (sound, step) => {
    setSequence((prev) => ({
      ...prev,
      [sound]: prev[sound].map((value, index) =>
        index === step ? !value : value
      ),
    }));
    setClickedSquare(`${sound}-${step}`);
    setTimeout(() => setClickedSquare(null), 300);
    playSound(sound);
  };

  const playSound = (sound) => {
    if (audioContext && audioBuffers[sound]) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffers[sound];
      source.connect(audioContext.destination);
      source.start();
      beatRef.current = true;
      setTimeout(() => {
        beatRef.current = false;
      }, 50);
    }
  };

  const clearAll = () => {
    setSequence(
      Object.keys(drumSounds).reduce((acc, sound) => {
        acc[sound] = Array(steps).fill(false);
        return acc;
      }, {})
    );
  };

  const randomize = () => {
    setSequence(
      Object.keys(drumSounds).reduce((acc, sound) => {
        acc[sound] = Array(steps)
          .fill(false)
          .map(() => Math.random() > 0.7);
        return acc;
      }, {})
    );
  };

  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentStep((prevStep) => (prevStep + 1) % steps);
        Object.entries(sequence).forEach(([sound, soundSteps]) => {
          if (soundSteps[currentStep]) {
            playSound(sound);
          }
        });
      }, (60 * 1000) / tempo / 4);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, tempo, sequence, currentStep, steps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    createParticles(
      particlesRef,
      canvas,
      particleCount,
      particleSpeed,
      particleSize,
      particleColor
    );
    animateParticles(
      canvasRef,
      particlesRef,
      beatRef,
      animationFrameRef,
      particleSpeed
    );

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [particleCount, particleSpeed, particleSize, particleColor]);

  const loadTrack = (track) => {
    setSequence(track.pattern);
    setCurrentTrack(track.name);
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const downloadMP3 = async () => {
    const offlineContext = new OfflineAudioContext(
      2,
      44100 * (60 / tempo) * steps,
      44100
    );

    for (let i = 0; i < steps; i++) {
      Object.keys(drumSounds).forEach((sound) => {
        if (sequence[sound][i]) {
          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffers[sound];
          source.connect(offlineContext.destination);
          source.start(i * (60 / tempo / 4));
        }
      });
    }

    const loopPromises = selectedLoops.map(async (loop) => {
      const response = await fetch(availableLoops[loop.name]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.loopEnd = audioBuffer.duration;
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = loop.volume;
      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      source.start();
      return audioBuffer.duration;
    });

    await Promise.all(loopPromises);

    const renderedBuffer = await offlineContext.startRendering();
    const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${currentTrack}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveTrack = () => {
    if (newTrackName.trim() === "") return;
    const newTrack = {
      name: newTrackName,
      pattern: sequence,
    };
    const updatedTracks = [...savedTracks, newTrack];
    setSavedTracks(updatedTracks);
    localStorage.setItem("savedTracks", JSON.stringify(updatedTracks));
    setNewTrackName("");
    setShowSaveModal(false);
  };

  const loadSavedTracks = () => {
    const tracks = localStorage.getItem("savedTracks");
    if (tracks) {
      setSavedTracks(JSON.parse(tracks));
    }
  };

  const addSelectedLoop = () => {
    setSelectedLoops([
      ...selectedLoops,
      { name: Object.keys(availableLoops)[0], volume: 1, tempo: 1 },
    ]);
  };

  const handleLoopChange = (index, newLoopName) => {
    const newSelectedLoops = [...selectedLoops];
    newSelectedLoops[index].name = newLoopName;
    setSelectedLoops(newSelectedLoops);

    if (waveformRefs.current[index] && waveformRefs.current[index].wavesurfer) {
      waveformRefs.current[index].wavesurfer.load(availableLoops[newLoopName]);
    }
    if (loopAudios.current[index]) {
      loopAudios.current[index].src = availableLoops[newLoopName];
    }
  };

  const handleLoopVolumeChange = (index, newVolume) => {
    const newSelectedLoops = [...selectedLoops];
    newSelectedLoops[index].volume = newVolume;
    setSelectedLoops(newSelectedLoops);
    if (loopAudios.current[index]) {
      loopAudios.current[index].volume = newVolume;
    }
  };

  const handleLoopTempoChange = (index, newTempo) => {
    const newSelectedLoops = [...selectedLoops];
    newSelectedLoops[index].tempo = newTempo;
    setSelectedLoops(newSelectedLoops);
    if (loopAudios.current[index]) {
      loopAudios.current[index].playbackRate = newTempo;
    }
  };

  const deleteLoop = (index) => {
    const newSelectedLoops = [...selectedLoops];
    newSelectedLoops.splice(index, 1);
    setSelectedLoops(newSelectedLoops);

    if (loopAudios.current[index]) {
      loopAudios.current[index].pause();
    }
    if (waveformRefs.current[index] && waveformRefs.current[index].wavesurfer) {
      waveformRefs.current[index].wavesurfer.destroy();
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent text-white relative overflow-hidden">
      <div className="flex-1 p-8 relative flex ">
        <div className="w-64 bg-transparent p-4 overflow-y-auto z-10">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Tracks</h2>
          {defaultTracks.concat(savedTracks).map((track, index) => (
            <button
              key={index}
              className={`w-full text-left p-2 rounded mb-2 flex items-center ${
                currentTrack === track.name
                  ? "bg-purple-600"
                  : "bg-gray-900 bg-opacity-70 hover:bg-opacity-50"
              }`}
              onClick={() => loadTrack(track)}
            >
              <Music className="mr-2" size={16} />
              {track.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center w-full">
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.2)] via-[rgba(0,0,0,0.6)] to-[rgba(0,0,0,0.9)] pointer-events-none"></div>
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
            <Button
              onClick={() => setShowParticleSettings(!showParticleSettings)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full"
            >
              <Sliders className="mr-2" size={16} />
              Particles
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full"
            >
              <Settings className="mr-2" size={16} />
              Settings
            </Button>
          </div>
          <div className="relative z-10 w-full max-w-4xl shadow-md border py-4 px-6 rounded-3xl bg-black bg-opacity-60 shadow-purple-500">
            <h1 className="text-4xl font-bold mb-8 text-white text-center border py-2 px-4 rounded-3xl bg-black bg-opacity-20">
              Rhythm Craft
            </h1>
            <h2 className="text-xl mb-4 text-white border py-2 px-4 rounded-3xl bg-black bg-opacity-40">
              {currentTrack}
            </h2>
            <div className="w-full grid grid-cols-[auto,1fr] gap-4 overflow-x-auto">
              {Object.keys(drumSounds).map((sound) => (
                <React.Fragment key={sound}>
                  <span className="text-cyan-400 text-lg self-center whitespace-nowrap">
                    {sound}
                  </span>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${steps}, minmax(30px, 1fr))`,
                    }}
                  >
                    {sequence[sound].map((isActive, step) => (
                      <button
                        key={step}
                        className={`
                        aspect-square rounded-md transition-all
                        ${isActive ? "bg-purple-500" : "bg-gray-700"}
                        ${
                          currentStep === step ? "border-2 border-cyan-400" : ""
                        }
                        ${
                          clickedSquare === `${sound}-${step}`
                            ? "animate-pulse"
                            : ""
                        }
                        hover:bg-purple-600
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                      `}
                        onClick={() => toggleStep(sound, step)}
                        style={{
                          boxShadow: isActive ? "0 0 10px #8B5CF6" : "none",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 w-full space-y-4">
              {selectedLoops.map((loop, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-500 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <select
                      value={loop.name}
                      onChange={(e) => handleLoopChange(index, e.target.value)}
                      className="bg-gray-700 text-white rounded px-2 py-1"
                    >
                      {Object.keys(availableLoops).map((loopName) => (
                        <option key={loopName} value={loopName}>
                          {loopName}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowLoopSettings(index)}
                        className="bg-gray-600 hover:bg-gray-700 p-2 rounded-full"
                      >
                        <Settings size={16} />
                      </Button>
                      <Button
                        onClick={() => deleteLoop(index)}
                        className="bg-red-500 hover:bg-red-600 p-2 rounded-full"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                  <div ref={(el) => (waveformRefs.current[index] = el)} />
                </div>
              ))}
              <button
                onClick={addSelectedLoop}
                className="w-full border-2 border-dashed border-gray-500 rounded-lg p-4 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Plus className="mr-2" />
                Add Loop
              </button>
            </div>
            <div className="mt-8 w-full flex items-center justify-center flex-wrap">
              <div className="flex space-x-4">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="mr-2" />
                  ) : (
                    <Play className="mr-2" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  onClick={clearAll}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-full"
                >
                  <Trash2 className="mr-2" />
                  Clear All
                </Button>
                <Button
                  onClick={randomize}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full"
                >
                  <Shuffle className="mr-2" />
                  Randomize
                </Button>
                <Button
                  onClick={downloadMP3}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full"
                >
                  <Download className="mr-2" />
                  Download WAV
                </Button>
                <Button
                  onClick={() => setShowSaveModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full"
                >
                  <Save className="mr-2" />
                  Save Track
                </Button>
              </div>
            </div>
          </div>
          {(showSettings ||
            showParticleSettings ||
            showSaveModal ||
            showLoopSettings !== null) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              {showSettings && (
                <SettingsMenu
                  tempo={tempo}
                  setTempo={setTempo}
                  steps={steps}
                  setSteps={setSteps}
                  onClose={() => setShowSettings(false)}
                />
              )}
              {showParticleSettings && (
                <ParticleSettingsMenu
                  particleCount={particleCount}
                  setParticleCount={setParticleCount}
                  particleSpeed={particleSpeed}
                  setParticleSpeed={setParticleSpeed}
                  particleSize={particleSize}
                  setParticleSize={setParticleSize}
                  particleColor={particleColor}
                  setParticleColor={setParticleColor}
                  onClose={() => setShowParticleSettings(false)}
                  maxParticles={20000}
                  maxSpeed={20}
                />
              )}
              {showSaveModal && (
                <div className="bg-gray-800 p-6 rounded-lg ">
                  <h3 className="text-xl font-bold mb-4">Save Track</h3>
                  <input
                    type="text"
                    value={newTrackName}
                    onChange={(e) => setNewTrackName(e.target.value)}
                    placeholder="Enter track name"
                    className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={() => setShowSaveModal(false)}
                      className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveTrack}
                      className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-full"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
              {showLoopSettings !== null && (
                <div className="bg-gray-800 p-6 rounded-lg w-96">
                  <h3 className="text-xl font-bold mb-4">Loop Settings</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Volume
                    </label>
                    <div className="flex items-center">
                      <Volume2 size={20} className="mr-2" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedLoops[showLoopSettings].volume}
                        onChange={(e) =>
                          handleLoopVolumeChange(
                            showLoopSettings,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Tempo
                    </label>
                    <div className="flex items-center">
                      <RefreshCw size={20} className="mr-2" />
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={selectedLoops[showLoopSettings].tempo}
                        onChange={(e) =>
                          handleLoopTempoChange(
                            showLoopSettings,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowLoopSettings(null)}
                      className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundPad;
