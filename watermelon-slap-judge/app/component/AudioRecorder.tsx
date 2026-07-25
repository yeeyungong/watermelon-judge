'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [frequencyBars, setFrequencyBars] = useState<number[]>(Array(16).fill(0));

  const stopVisualizer = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;
    setFrequencyBars(Array(16).fill(0));
  };

  useEffect(() => () => stopVisualizer(), []);

  // Handle Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.72;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      sourceRef.current = source;

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        analyser.getByteFrequencyData(frequencyData);
        // The lowest bin is mostly microphone rumble rather than the slap.
        setFrequencyBars(Array.from(frequencyData.slice(1, 17)));
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // WebM is standard for browser recording
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        const recordedDuration = (Date.now() - startTimeRef.current) / 1000;
        setDuration(recordedDuration);
        onRecordingComplete(blob, recordedDuration);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        stopVisualizer();
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Optional: Auto-stop after 4 seconds to prevent long silent recordings
      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 4000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  // Handle Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-gray-800">Slap the Watermelon!</h3>
        <p className="text-sm text-gray-500">Record for 2-4 seconds</p>
      </div>

      {/* Visual Feedback Area */}
      <div className={`w-full h-32 mb-6 rounded-lg flex items-center justify-center transition-colors ${isRecording ? 'bg-red-50 animate-pulse' : 'bg-gray-50'}`}>
        {isRecording ? (
          <div className="flex gap-1 items-end h-16" aria-label="Live frequency spectrum">
            {frequencyBars.map((value, i) => (
              <div 
                key={i} 
                className="w-2 bg-red-500 rounded-full transition-[height] duration-75"
                style={{ 
                  height: `${Math.max(8, Math.round((value / 255) * 100))}%`,
                }} 
              />
            ))}
          </div>
        ) : audioURL ? (
          <audio controls src={audioURL} className="w-full px-4" />
        ) : (
          <Mic className="w-12 h-12 text-gray-300" />
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all shadow-md active:scale-95"
          >
            <Mic size={20} />
            Record Slap
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all shadow-md active:scale-95"
          >
            <Square size={20} fill="currentColor" />
            Stop
          </button>
        )}
      </div>
      
      {audioURL && !isRecording && (
        <p className="mt-4 text-xs text-gray-400">
          Recorded: {duration.toFixed(2)}s
        </p>
      )}
    </div>
  );
}
