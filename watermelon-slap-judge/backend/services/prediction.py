import os
import joblib
import numpy as np
from typing import Dict, Any, List
from services.audio_processing import extract_features

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
            print("⚠️ ML model not found. Using rule-based fallback.")

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        if self.use_ml:
            return self._predict_ml(features)
        else:
            return self._predict_rule_based(features)

    def _predict_ml(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Uses the trained model with CORRECT feature mapping from your Excel dataset.
        """
        model = self.model_data['model']
        label_encoder = self.model_data['label_encoder']
        feature_columns = self.model_data['feature_columns']
        
        # ✅ CRITICAL FIX: Map live audio features to dataset column names
        # This bridges the gap between librosa output and your Excel columns
        mapped_features = {
            'rms_volume': features.get('rms_volume', 0),           # Direct match
            'peak_freq': features.get('peak_freq', 0),             # Direct match  
            'duration_ms': features.get('duration_ms', 0),          # Direct match
            'spectral_centroid': features.get('spectral_centroid', 0),
            'zero_crossing_rate': features.get('zero_crossing_rate', 0),
            'slap_velocity': features.get('slap_velocity', 9.0),   # Use extracted or default
            'impact_score': features.get('impact_score', 70),       # Use extracted or default
            'confidence': features.get('confidence', 0.9)
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
        
        # ✅ FIXED SCORE CALCULATION
        # Base scores aligned with your dataset's ripeness distribution
        label_scores = {'Ripe': 85, 'Underripe': 30, 'Overripe': 15}
        base_score = label_scores.get(label, 50)
        
        # Confidence-weighted score (no longer defaults to 50)
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