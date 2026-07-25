'use client';

import { useState } from 'react';
import AudioRecorder from '@/app/component/AudioRecorder';
import { submitAudioForJudgment, JudgmentResult } from '@/app/services/judgeApi';
import { Activity, Zap, Volume2, Gauge, TrendingUp } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JudgmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-lg mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 tracking-tight">
            🍉 WATERMELON SLAP JUDGE™
          </h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">AI-Powered Acoustic Analysis</p>
        </header>

        <AudioRecorder onRecordingComplete={handleRecordingComplete} />

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-green-400 font-mono text-sm">ANALYZING ACOUSTIC FEATURES...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-green-500/30 shadow-2xl shadow-green-500/10 animate-in fade-in slide-in-from-bottom-4">
            {/* Main Score Display */}
            <div className="text-center mb-6">
              <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest border-2
                ${result.label === 'ripe' ? 'bg-green-500/20 text-green-400 border-green-500' : 
                  result.label === 'overripe' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 
                  'bg-blue-500/20 text-blue-400 border-blue-500'}`}>
                {result.label}
              </div>
              <div className="mt-4">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                  {result.score}<span className="text-2xl text-gray-500">/100</span>
                </div>
                <p className="text-gray-400 mt-2 font-mono text-sm">CONFIDENCE: {Math.round(result.confidence * 100)}%</p>
              </div>
            </div>

            {/* Audio Features Grid */}
            {result.audioFeatures && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400 uppercase">Impact Force</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{result.audioFeatures.impact_score.toFixed(1)}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400 uppercase">Slap Velocity</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{result.audioFeatures.slap_velocity.toFixed(2)}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400 uppercase">Peak Frequency</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{result.audioFeatures.peak_freq.toFixed(0)}Hz</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400 uppercase">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{(result.audioFeatures.duration_ms / 1000).toFixed(2)}s</div>
                </div>
              </div>
            )}

            {/* Analysis Section */}
            <div className="space-y-4">
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

            {/* Technique & Vibration Assessment */}
            {/* {result.audioFeatures && (
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase block mb-1">Slap Technique</span>
                  <span className={`font-bold ${getSlapTechnique(result.audioFeatures.slap_velocity).color}`}>
                    {getSlapTechnique(result.audioFeatures.slap_velocity).label}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase block mb-1">Watermelon Vibration</span>
                  <span className={`font-bold ${getVibrationLevel(result.audioFeatures.spectral_centroid).color}`}>
                    {getVibrationLevel(result.audioFeatures.spectral_centroid).label}
                  </span>
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>
    </main>
  );
}