'use client';

import { useState } from 'react';
import AudioRecorder from '@/app/component/AudioRecorder';
import { submitAudioForJudgment, JudgmentResult } from '@/app/services/judgeApi';

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-green-800 tracking-tight">
            🍉 Watermelon Slap Judge
          </h1>
          <p className="text-gray-600 mt-2">AI-powered ripeness detection</p>
        </header>

        <AudioRecorder onRecordingComplete={handleRecordingComplete} />

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Analyzing acoustic features...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-4">
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide
                ${result.label === 'ripe' ? 'bg-green-100 text-green-800' : 
                  result.label === 'overripe' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'}`}>
                {result.label}
              </span>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-gray-800">{result.score}<span className="text-2xl text-gray-400">/100</span></div>
              <p className="text-sm text-gray-500 mt-1">Confidence: {Math.round(result.confidence * 100)}%</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Analysis:</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm">
                {result.explanation.map((exp, i) => (
                  <li key={i}>{exp}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}