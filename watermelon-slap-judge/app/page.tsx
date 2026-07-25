'use client';

import { useState, useEffect, useRef } from 'react';
import AudioRecorder from '@/app/component/AudioRecorder';
import { submitAudioForJudgment, JudgmentResult } from '@/app/services/judgeApi';
import { Activity, Zap, Volume2, Gauge, TrendingUp } from 'lucide-react';

const LOADING_MESSAGES = [
  "Consulting the Great Watermelon Master...",
  "The trial has begun...",
  "Summoning ancient melon knowledge...",
  "Performing acoustic forensics...",
  "Calibrating the melon-o-meter...",
  "Running 67 neural networks on your slap...",
  "Decoding the language of gourds...",
  "Asking the AI nicely...",
  "Cross-referencing 10,000 watermelons...",
  "The verdict approaches...",
  "Measuring quantum resonance...",
  "Consulting ISO 9001 Melon Standards...",
];

const LABEL_EMOJI: Record<string, string> = { ripe: '🍉', underripe: '🌱', overripe: '💀' };
const VERDICT_TEXT: Record<string, string> = {
  ripe: 'THIS MELON SLAPS',
  underripe: 'NOT READY, CHIEF',
  overripe: 'TOO LATE, BRO',
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JudgmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [reportId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase());
  const [analysisTime] = useState(() => (Math.random() * 2 + 0.8).toFixed(3));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      intervalRef.current = setInterval(() => {
        setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
      }, 1800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loading]);

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    if (duration < 0.5) {
      setError("Slap was too short. Try again!");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const judgment = await submitAudioForJudgment(blob);
      setResult(judgment);
    } catch (err) {
      setError("Could not connect to the judge. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSlapTechnique = (velocity: number) => {
    if (velocity > 8) return { label: 'Professional', color: 'text-green-400' };
    if (velocity > 5) return { label: 'Intermediate', color: 'text-yellow-400' };
    return { label: 'Amateur', color: 'text-red-400' };
  };

  const getVibrationLevel = (centroid: number) => {
    if (centroid < 1500) return { label: 'Excellent Resonance', color: 'text-green-400' };
    if (centroid < 2500) return { label: 'Moderate Vibration', color: 'text-yellow-400' };
    return { label: 'Low Vibration', color: 'text-red-400' };
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 tracking-tight">
            🍉 WATERMELON SLAP JUDGE™
          </h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">AI-Powered Acoustic Analysis</p>
        </header>

        {/* Two column layout on desktop, single on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* LEFT — Audio input */}
          <div className="flex flex-col gap-4">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />

            {loading && (
              <div className="text-center py-6">
                <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-green-400 font-mono text-sm italic">{LOADING_MESSAGES[msgIndex]}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-center">⚠ {error}</p>
              </div>
            )}
          </div>

          {/* RIGHT — Report */}
          <div>
            {!result && !loading && (
              <div className="h-full flex items-center justify-center bg-gray-900/40 rounded-xl border border-gray-800 border-dashed p-12 text-center">
                <div>
                  <p className="text-4xl mb-3">🍉</p>
                  <p className="text-gray-600 font-mono text-sm uppercase tracking-widest">Awaiting slap input...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-green-500/30 shadow-2xl shadow-green-500/10">

                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-mono">REPORT #{reportId}</span>
                  <span className="text-xs text-gray-400 font-mono">ANALYSIS: {analysisTime}s</span>
                </div>

                <div className="text-center mb-2">
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">The Judge Has Spoken</p>
                  <p className="text-lg font-black text-white tracking-widest">{VERDICT_TEXT[result.label] ?? 'UNKNOWN MELON'}</p>
                </div>

                <div className="text-center mb-6">
                  <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest border-2 mt-2
                    ${result.label === 'ripe' ? 'bg-green-500/20 text-green-400 border-green-500' :
                      result.label === 'overripe' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' :
                      'bg-blue-500/20 text-blue-400 border-blue-500'}`}>
                    {LABEL_EMOJI[result.label]} {result.label}
                  </div>
                  <div className="mt-4">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                      {result.score}<span className="text-2xl text-gray-500">/100</span>
                    </div>
                    <p className="text-gray-400 mt-2 font-mono text-sm">CONFIDENCE: {(result.confidence * 100).toFixed(4)}%</p>
                  </div>
                </div>

                {result.audioFeatures && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-gray-400 uppercase">Impact Force</span>
                      </div>
                      <div className="text-xl font-bold text-white">{result.audioFeatures.impact_score.toFixed(1)}</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400 uppercase">Slap Velocity</span>
                      </div>
                      <div className="text-xl font-bold text-white">{result.audioFeatures.slap_velocity.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Volume2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400 uppercase">Peak Frequency</span>
                      </div>
                      <div className="text-xl font-bold text-white">{result.audioFeatures.peak_freq.toFixed(0)}Hz</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400 uppercase">Duration</span>
                      </div>
                      <div className="text-xl font-bold text-white">{(result.audioFeatures.duration_ms / 1000).toFixed(2)}s</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-green-400 uppercase tracking-wider text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    AI Analysis
                  </h4>
                  <ul className="space-y-2">
                    {result.explanation.map((exp, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">›</span>
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-400 font-mono">🏅 Certified by the International Watermelon Acoustics Institute™</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">This report is legally non-binding and scientifically questionable.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-10 text-center pb-6 space-y-1">
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Because someone had to do it.</p>
          <p className="text-xs text-green-400 font-mono">Powered by Qwen AI</p>
        </footer>

      </div>
    </main>
  );
}