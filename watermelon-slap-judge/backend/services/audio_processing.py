import librosa
import numpy as np
import soundfile as sf # Optional: faster loading if available
from typing import Dict, Any
import os

def extract_features(file_path: str) -> Dict[str, float]:
    """
    Extracts key audio features from a watermelon slap recording.
    """
    try:
        # Check if file exists and has size
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if os.path.getsize(file_path) == 0:
            raise ValueError("Uploaded file is empty")

        # Load audio
        # res_type='kaiser_fast' is faster for MVP
        y, sr = librosa.load(file_path, sr=None, mono=True, res_type='kaiser_fast')
        
        if len(y) == 0:
            raise ValueError("Audio data is empty after loading")

        # 1. Duration
        duration = librosa.get_duration(y=y, sr=sr)
        
        # If duration is too short (< 0.1s), it's not a valid slap
        if duration < 0.1:
            raise ValueError("Audio too short to analyze")

        # 2. RMS Energy
        rms = librosa.feature.rms(y=y)[0]
        rms_energy = float(np.mean(rms))
        
        # 3. Spectral Centroid
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        mean_centroid = float(np.mean(spectral_centroid))
        
        # 4. Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        mean_zcr = float(np.mean(zcr))
        
        # 5. Dominant Frequency
        fft_values = np.abs(librosa.stft(y))
        freqs = librosa.fft_frequencies(sr=sr)
        dominant_freq_idx = np.argmax(np.mean(fft_values, axis=1))
        dominant_frequency = float(freqs[dominant_freq_idx])
        
        # 6. MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=4)
        mean_mfccs = [float(np.mean(mfcc)) for mfcc in mfccs]

        return {
            "rms_volume": round(rms_energy, 4),
            "peak_freq": round(dominant_frequency, 1),
            "duration_ms": round(duration * 1000, 1),
            "spectral_centroid": round(mean_centroid, 1),
            "zero_crossing_rate": round(mean_zcr, 4),
            "slap_velocity": round(rms_energy * 10, 2),  # Approximated from RMS
            "impact_score": round(min(100, rms_energy * 100), 2),  # Approximated from RMS
            "confidence": round(0.9, 2),  # Placeholder for audio quality confidence
        }

    except Exception as e:
        # Print full traceback to console for debugging
        import traceback
        print("--- AUDIO PROCESSING ERROR ---")
        traceback.print_exc()
        raise ValueError(f"Failed to process audio: {str(e)}")