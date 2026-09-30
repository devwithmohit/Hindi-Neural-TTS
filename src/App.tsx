/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Download,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Sparkles,
  Sliders,
  FileCode,
  Terminal,
  Radio,
  Share2,
  Trash2,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { PYTHON_SCRIPT_CONTENT, PIP_COMMAND, RUN_COMMAND } from './pythonCode';

interface VoiceOption {
  id: string;
  name: string;
  hindiName: string;
  gender: 'Male' | 'Female';
  description: string;
  tags: string[];
}

const VOICES: VoiceOption[] = [
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur',
    hindiName: 'मधुर',
    gender: 'Male',
    description: 'Natural Indian male voice with warm, balanced timbre. Ideal for news, audiobooks, and formal announcements.',
    tags: ['Male', 'Warm', 'Authoritative', 'hi-IN'],
  },
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara',
    hindiName: 'स्वरा',
    gender: 'Female',
    description: 'Expressive Indian female voice with clear articulation and gentle melody. Ideal for storytelling, e-learning, and casual narration.',
    tags: ['Female', 'Melodic', 'Clear', 'hi-IN'],
  },
];

const HINDI_SAMPLES = [
  {
    label: 'स्वागत संदेश (Welcome)',
    text: 'नमस्ते! आपका हमारे इस ऑडियो स्टूडियो में हार्दिक स्वागत है। यह माइक्रोसॉफ्ट एज न्यूरल तकनीक से संचालित है।',
  },
  {
    label: 'सुप्रभात और प्रेरणा (Inspiration)',
    text: 'सफलता पहले से की गई तैयारी पर निर्भर करती है, और बिना ऐसी तैयारी के असफलता निश्चित है। निरंतर प्रयास ही जीत की कुंजी है।',
  },
  {
    label: 'समाचार व मौसम (News & Weather)',
    text: 'आज का मौसम अत्यंत सुहावना रहेगा। राजधानी में हल्की बारिश होने की संभावना जताई गई है। अपना छाता साथ रखना न भूलें।',
  },
  {
    label: 'कथा वाचन (Story Snippet)',
    text: 'बहुत समय पहले की बात है, गंगा नदी के तट पर बसा एक सुंदर सा गाँव था। वहाँ के लोग आपस में बहुत प्रेम और सद्भाव से रहते थे।',
  },
];

interface GeneratedAudioItem {
  id: string;
  text: string;
  voice: VoiceOption;
  audioUrl: string;
  blob: Blob;
  rate: number;
  pitch: number;
  timestamp: string;
  fileSizeKb: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'python' | 'guide'>('studio');

  // TTS Form State
  const [hindiText, setHindiText] = useState(
    'नमस्ते! आप कैसे हैं? यह हिंदी टेक्स्ट टू स्पीच का एक जीवंत परीक्षण है। आप यहाँ अपना कोई भी हिंदी वाक्य लिख सकते हैं।'
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('hi-IN-MadhurNeural');
  const [speechRate, setSpeechRate] = useState<number>(0); // -50 to +50%
  const [pitchRate, setPitchRate] = useState<number>(0); // -50 to +50 Hz
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback State
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudioItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioHistory, setAudioHistory] = useState<GeneratedAudioItem[]>([]);

  // Code Copy State
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedPip, setCopiedPip] = useState<boolean>(false);
  const [copiedRun, setCopiedRun] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedVoice = VOICES.find((v) => v.id === selectedVoiceId) || VOICES[0];

  // Handle TTS Generation
  const handleGenerateSpeech = async () => {
    const textToConvert = hindiText.trim();
    if (!textToConvert) {
      setErrorMessage('कृपया कुछ हिंदी टेक्स्ट दर्ज करें (Please enter Hindi text to convert).');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const rateParam = `${speechRate >= 0 ? '+' : ''}${speechRate}%`;
      const pitchParam = `${pitchRate >= 0 ? '+' : ''}${pitchRate}Hz`;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToConvert,
          voice: selectedVoice.id,
          rate: rateParam,
          pitch: pitchParam,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const sizeKb = Math.round(blob.size / 1024);

      const newItem: GeneratedAudioItem = {
        id: Date.now().toString(),
        text: textToConvert,
        voice: selectedVoice,
        audioUrl,
        blob,
        rate: speechRate,
        pitch: pitchRate,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileSizeKb: sizeKb,
      };

      setCurrentAudio(newItem);
      setAudioHistory((prev) => [newItem, ...prev.slice(0, 9)]);

      // Auto play newly generated audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } catch (err: unknown) {
      console.error('Synthesis error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown synthesis error';
      setErrorMessage(`Error: ${msg}. Please check your connection and try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Download Trigger
  const handleDownload = (item: GeneratedAudioItem) => {
    const link = document.createElement('a');
    link.href = item.audioUrl;
    const sanitizedVoice = item.voice.name.toLowerCase();
    link.download = `hindi_speech_${sanitizedVoice}_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Audio Playback Controls
  const togglePlayPause = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
    setAudioDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioProgress(time);
    }
  };

  // Animated visualizer effect for playback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      const numBars = 36;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        let barHeight = 6;
        if (isPlaying) {
          // Dynamic sine wave modulation
          const sinVal = Math.sin(phase + i * 0.35) * Math.cos(phase * 0.7 + i * 0.2);
          barHeight = Math.max(6, Math.abs(sinVal) * (height * 0.78));
        }

        const gradient = ctx.createLinearGradient(0, mid - barHeight / 2, 0, mid + barHeight / 2);
        if (selectedVoice.gender === 'Male') {
          gradient.addColorStop(0, '#f97316');
          gradient.addColorStop(1, '#ea580c');
        } else {
          gradient.addColorStop(0, '#ec4899');
          gradient.addColorStop(1, '#db2777');
        }

        ctx.fillStyle = isPlaying ? gradient : '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(x, mid - barHeight / 2, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.12;
      }
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, selectedVoice]);

  // Copy helper
  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Direct download app.py
  const downloadPythonScript = () => {
    const blob = new Blob([PYTHON_SCRIPT_CONTENT], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Hindi Neural TTS</span>
                <span className="font-devanagari text-xs px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-semibold border border-orange-200">
                  हिंदी वाणी
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Powered by Microsoft Edge Neural Voices • Free & In-Memory
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'studio'
                  ? 'bg-white text-orange-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Live Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'python'
                  ? 'bg-white text-orange-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Streamlit Code (app.py)</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'guide'
                  ? 'bg-white text-orange-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Docs & Voices</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ========================================================================= */}
        {/* TAB 1: LIVE STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Voice Picker, Text Input & Controls (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header Box */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-orange-500" />
                    <span>1. Select Neural Voice (आवाज का चयन करें)</span>
                  </h2>
                  <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    2 Neural Voices Ready
                  </span>
                </div>

                {/* Voice Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {VOICES.map((voice) => {
                    const isSelected = selectedVoiceId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoiceId(voice.id)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{voice.name}</span>
                              <span className="font-devanagari text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {voice.hindiName}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                  voice.gender === 'Male'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {voice.gender}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{voice.id}</div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{voice.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Text Input Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span>2. Enter Hindi Text (हिंदी में टेक्स्ट लिखें)</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    {hindiText.length} characters • {hindiText.trim() ? hindiText.trim().split(/\s+/).length : 0} words
                  </span>
                </div>

                {/* Quick Samples Chips */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1.5">त्वरित नमूना वाक्य (Quick Presets):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {HINDI_SAMPLES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHindiText(sample.text)}
                        className="text-xs bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    rows={6}
                    value={hindiText}
                    onChange={(e) => setHindiText(e.target.value)}
                    placeholder="यहाँ अपना हिंदी वाक्य या अनुच्छेद टाइप करें या पेस्ट करें..."
                    className="w-full font-devanagari text-base sm:text-lg leading-relaxed p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
                  />
                  {hindiText && (
                    <button
                      type="button"
                      onClick={() => setHindiText('')}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
                      title="Clear text"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Devanagari punctuation shortcuts */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>विराम चिन्ह (Punctuation):</span>
                  {['।', '॥', '?', '!', ',', ';', '—', 'ॐ'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setHindiText((prev) => prev + sym)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-devanagari font-bold border border-slate-200"
                    >
                      {sym}
                    </button>
                  ))}
                </div>

                {/* Fine-Tuning Controls */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      Fine-Tuning Controls (वैकल्पिक)
                    </span>
                    {(speechRate !== 0 || pitchRate !== 0) && (
                      <button
                        onClick={() => {
                          setSpeechRate(0);
                          setPitchRate(0);
                        }}
                        className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Speed (गति):</span>
                        <span className="font-mono font-medium text-slate-800">
                          {speechRate > 0 ? `+${speechRate}%` : `${speechRate}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="5"
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseInt(e.target.value, 10))}
                        className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Slow (-50%)</span>
                        <span>Normal (0%)</span>
                        <span>Fast (+50%)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Pitch (तारत्व):</span>
                        <span className="font-mono font-medium text-slate-800">
                          {pitchRate > 0 ? `+${pitchRate}Hz` : `${pitchRate}Hz`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="5"
                        value={pitchRate}
                        onChange={(e) => setPitchRate(parseInt(e.target.value, 10))}
                        className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Deeper (-50Hz)</span>
                        <span>Normal (0Hz)</span>
                        <span>Higher (+50Hz)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleGenerateSpeech}
                  disabled={isGenerating}
                  className="w-full py-3.5 px-6 rounded-xl bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-base shadow-md shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing Speech in Memory...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      <span>Convert to Speech (ऑडियो तैयार करें)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Audio Output Player & History (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Active Audio Player Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-orange-500" />
                    <span>Audio Player (ऑडियो प्लेयर)</span>
                  </h3>
                  {currentAudio && (
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {currentAudio.fileSizeKb} KB
                    </span>
                  )}
                </div>

                {currentAudio ? (
                  <div className="space-y-5">
                    {/* Voice Badge info */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 border border-orange-200/70">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                            currentAudio.voice.gender === 'Male' ? 'bg-orange-500' : 'bg-pink-500'
                          }`}
                        >
                          {currentAudio.voice.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900">
                            {currentAudio.voice.name} ({currentAudio.voice.hindiName})
                          </div>
                          <div className="text-[11px] text-slate-500">{currentAudio.voice.id}</div>
                        </div>
                      </div>
                      <span className="text-xs text-orange-700 font-medium">MP3 Format</span>
                    </div>

                    {/* Canvas Waveform Visualizer */}
                    <div className="bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={64}
                        className="w-full h-16 rounded"
                      />
                      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 px-1">
                        <span>{formatTime(audioProgress)}</span>
                        <span className="text-slate-500">Edge Neural Stream</span>
                        <span>{formatTime(audioDuration)}</span>
                      </div>
                    </div>

                    {/* Custom Seek Bar */}
                    <input
                      type="range"
                      min="0"
                      max={audioDuration || 100}
                      step="0.01"
                      value={audioProgress}
                      onChange={handleSeek}
                      className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />

                    {/* Playback Controls & Action Buttons */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(currentAudio)}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download MP3</span>
                      </button>
                    </div>

                    {/* Native fallback player */}
                    <div className="pt-2">
                      <p className="text-[11px] text-slate-400 mb-1">Standard HTML5 Audio Player:</p>
                      <audio controls className="w-full h-9 rounded-lg" src={currentAudio.audioUrl} />
                    </div>

                    {/* Snippet preview */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                      <div className="font-semibold text-slate-700 mb-1">Synthesized Text:</div>
                      <p className="font-devanagari line-clamp-3 italic">"{currentAudio.text}"</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 mx-auto flex items-center justify-center">
                      <Headphones className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-700">No Audio Generated Yet</div>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Click the "Convert to Speech" button on the left to generate and listen to natural Hindi speech.
                    </p>
                  </div>
                )}
              </div>

              {/* History Card */}
              {audioHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Recent Clips ({audioHistory.length})
                    </h4>
                    <button
                      onClick={() => setAudioHistory([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {audioHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{item.voice.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                          </div>
                          <p className="font-devanagari truncate text-slate-600 text-[11px] mt-0.5">{item.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentAudio(item);
                              if (audioRef.current) {
                                audioRef.current.src = item.audioUrl;
                                audioRef.current.play();
                                setIsPlaying(true);
                              }
                            }}
                            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-orange-600 hover:border-orange-300 transition-colors"
                            title="Play this clip"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                            title="Download MP3"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PYTHON STREAMLIT CODE (app.py) */}
        {/* ========================================================================= */}
        {activeTab === 'python' && (
          <div className="space-y-6">
            {/* Quick Terminal Instructions */}
            <div className="bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">How to Run Locally in Python & Streamlit</h2>
                    <p className="text-xs text-slate-300">
                      Two simple terminal commands to run this complete app on your local computer.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadPythonScript}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download app.py</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Step 1: Install */}
                <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-700/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                      Step 1: Install Libraries
                    </div>
                    <code className="text-xs font-mono text-emerald-400 mt-1 block truncate">
                      {PIP_COMMAND}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(PIP_COMMAND, setCopiedPip)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedPip ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Step 2: Run */}
                <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-700/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                      Step 2: Run App
                    </div>
                    <code className="text-xs font-mono text-emerald-400 mt-1 block truncate">
                      {RUN_COMMAND}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(RUN_COMMAND, setCopiedRun)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedRun ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Complete Source Code Viewer */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="bg-slate-100/80 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-orange-600" />
                  <span className="font-mono text-xs font-semibold text-slate-800">app.py</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({PYTHON_SCRIPT_CONTENT.split('\n').length} lines)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(PYTHON_SCRIPT_CONTENT, setCopiedScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied Code!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Code</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={downloadPythonScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code Pre block */}
              <div className="relative bg-slate-950 p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm font-mono-code text-slate-200 leading-relaxed max-h-[650px] overflow-y-auto">
                <pre>
                  <code>{PYTHON_SCRIPT_CONTENT}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GUIDE & ARCHITECTURE */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Architecture & Technical Overview</h2>
                <p className="text-sm text-slate-500 mt-1">
                  How in-memory audio processing and Microsoft Edge Neural TTS work together seamlessly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-orange-50/50 border border-orange-200/60 space-y-2.5">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span>1. In-Memory Streaming (Zero Disk Clutter)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unlike standard TTS scripts that save temporary files like <code>temp.mp3</code> to the hard drive,
                    this solution streams audio chunks into a Python <code>io.BytesIO()</code> memory buffer asynchronously.
                    The raw byte stream is directly handed to Streamlit's <code>st.audio()</code> and <code>st.download_button()</code>,
                    guaranteeing complete privacy, zero disk wear, and optimal concurrency.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-2.5">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <span>2. Microsoft Edge Neural Voice Quality</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Uses the exact same high-definition neural acoustic models powering Microsoft Edge's Read Aloud
                    feature. It natively understands Devanagari script, conjunct consonants (संयुक्ताक्षर), halant,
                    and natural Indian phonology without needing phonetic romanization.
                  </p>
                </div>
              </div>

              {/* Voices Details Table */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900">Supported Hindi Neural Voices</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Voice Name</th>
                        <th className="p-3">Voice Identifier</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Audio Format</th>
                        <th className="p-3">Best Used For</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Madhur (मधुर)</td>
                        <td className="p-3 font-mono text-orange-600">hi-IN-MadhurNeural</td>
                        <td className="p-3">Male</td>
                        <td className="p-3 font-mono">24kHz 48kbps MP3</td>
                        <td className="p-3 text-slate-600">News, podcasts, professional announcements, formal reading</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Swara (स्वरा)</td>
                        <td className="p-3 font-mono text-pink-600">hi-IN-SwaraNeural</td>
                        <td className="p-3">Female</td>
                        <td className="p-3 font-mono">24kHz 48kbps MP3</td>
                        <td className="p-3 text-slate-600">Audiobooks, storytelling, tutorials, voice assistants</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Python Code Snippet */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-slate-900">Core Python Edge-TTS Function</h3>
                <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono-code text-xs leading-relaxed overflow-x-auto">
                  <pre>{`async def synthesize_speech_in_memory(text: str, voice_id: str) -> bytes:
    communicate = edge_tts.Communicate(text=text, voice=voice_id)
    audio_stream = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
    audio_stream.seek(0)
    return audio_stream.getvalue()`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Hindi Neural TTS Studio</span>
            <span>•</span>
            <span>Edge-TTS & Streamlit Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>hi-IN-MadhurNeural</span>
            <span>•</span>
            <span>hi-IN-SwaraNeural</span>
            <span>•</span>
            <span>In-Memory Streams</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
