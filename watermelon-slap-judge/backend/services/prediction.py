import os
import joblib
import numpy as np
from typing import Dict, Any, List

class WatermelonJudge:
    def __init__(self):
        self.model_data = None
        self.use_ml = False
        
        model_path = "models/watermelon_model.pkl"
        
        if os.path.exists(model_path):
            try:
                self.model_data = joblib.load(model_path)
                self.use_ml = True
                print("✅ Successfully loaded ML model.")
            except Exception as e:
                print(f"⚠️ Failed to load ML model: {e}. Falling back to rules.")
        else:
            print("️ ML model not found. Using rule-based fallback.")

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        # ✅ ADDITION 1: Validity check BEFORE any ripeness prediction
        if not self._is_valid_slap(features):
            return {
                "score": 0,
                "label": "invalid",
                "confidence": 1.0,
                "explanation": [
                    "This doesn't sound like a watermelon slap.",
                    "Please ensure you're tapping the fruit firmly."
                ]
            }
            
        if self.use_ml:
            return self._predict_ml(features)
        else:
            return self._predict_rule_based(features)

    # ✅ ADDITION 2: Validity checker based on your dataset's overripe/poor patterns
    def _is_valid_slap(self, features: Dict[str, float]) -> bool:
        """
        Filters out hand claps, background noise, and non-watermelon sounds
        using thresholds derived directly from your Excel dataset.
        """
        centroid = features.get('spectral_centroid', 0)
        rms = features.get('rms_energy', 0)  # Note: extract_features uses 'rms_energy'
        duration_ms = features.get('duration', 0) * 1000  # Convert seconds to ms
        zcr = features.get('zero_crossing_rate', 0)
        
        # Hand claps have very high spectral centroid (>1800) and short duration
        if centroid > 1800 or duration_ms < 150:
            return False
            
        # Background noise / missed slaps have extremely low RMS and ZCR
        if rms < 0.05 or zcr < 0.02:
            return False
            
        return True

    def _predict_ml(self, features: Dict[str, float]) -> Dict[str, Any]:
        model = self.model_data['model']
        label_encoder = self.model_data['label_encoder']
        feature_columns = self.model_data['feature_columns']
        
        # ✅ CRITICAL FIX: Map librosa output keys to YOUR dataset column names
        # This was the root cause of the 50% score (missing keys defaulted to 0)
        mapped_features = {
            'rms_volume': features.get('rms_energy', 0),           # librosa -> dataset
            'peak_freq': features.get('dominant_frequency', 0),     # librosa -> dataset  
            'duration_ms': features.get('duration', 0) * 1000,      # seconds -> ms
            'spectral_centroid': features.get('spectral_centroid', 0),
            'zero_crossing_rate': features.get('zero_crossing_rate', 0),
            # These cannot be extracted from audio alone; use safe median defaults
            'slap_velocity': 9.0,   
            'impact_score': 70      
        }
        
        # Build feature vector in EXACT order the model expects
        feature_vector = []
        for col in feature_columns:
            val = mapped_features.get(col, 0)
            feature_vector.append(val)
            
        feature_array = np.array(feature_vector).reshape(1, -1)
        
        # Predict
        prediction_encoded = model.predict(feature_array)[0]
        probabilities = model.predict_proba(feature_array)[0]
        
        # Decode label
        label = label_encoder.inverse_transform([prediction_encoded])[0]
        confidence = float(probabilities[prediction_encoded])
        
        # ✅ FIXED SCORE CALCULATION: Aligned with your dataset's actual distribution
        # Your dataset has Ripe ~85-99, Underripe ~40-70, Overripe ~0-30
        label_scores = {'Ripe': 85, 'Underripe': 50, 'Overripe': 15}
        base_score = label_scores.get(label, 50)
        
        final_score = int(base_score * confidence + 50 * (1 - confidence))
        final_score = max(0, min(100, final_score))
        
        explanations = self._generate_explanations(mapped_features)
        
        return {
            "score": final_score,
            "label": label.lower(),
            "confidence": round(confidence, 2),
            "explanation": explanations
        }

    def _generate_explanations(self, features: Dict[str, float]) -> List[str]:
        explanations = []
        peak_freq = features.get('peak_freq', 0)
        rms = features.get('rms_volume', 0)
        centroid = features.get('spectral_centroid', 0)
        
        if peak_freq < 200:
            explanations.append("The sound has a deep, resonant tone typical of ripe watermelons.")
        elif peak_freq > 250:
            explanations.append("The sound is relatively high-pitched, suggesting underripeness.")
        else:
            explanations.append("The sound has moderate pitch characteristics.")
            
        if centroid < 1200:
            explanations.append("Low spectral centroid indicates a hollow interior structure.")
        else:
            explanations.append("Higher spectral centroid suggests denser flesh.")
            
        if rms > 0.6:
            explanations.append("Strong impact energy detected - good slap technique!")
        else:
            explanations.append("Moderate impact energy recorded.")
        
        return explanations

    def _predict_rule_based(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Fallback when ML model isn't available."""
        score = 50
        explanations = []
        
        dom_freq = features.get('dominant_frequency', 200)
        rms = features.get('rms_energy', 0.1)
        centroid = features.get('spectral_centroid', 1000)
        
        if 150 <= dom_freq <= 250:
            score += 25
            explanations.append("Deep resonant frequency detected.")
        elif dom_freq > 250:
            score -= 15
            explanations.append("High-pitched sound suggests underripeness.")
        
        if 0.5 <= rms <= 0.9:
            score += 15
            explanations.append("Good impact strength.")
        
        if centroid < 1400:
            score += 15
            explanations.append("Hollow timbre characteristic of ripe fruit.")
        
        final_score = max(0, min(100, score))
        label = "ripe" if final_score >= 70 else ("underripe" if final_score <= 40 else "overripe")
        
        return {
            "score": final_score,
            "label": label,
            "confidence": 0.75,
            "explanation": explanations
        } 