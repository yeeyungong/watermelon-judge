import os
import joblib
import numpy as np
from typing import Dict, Any, List

class WatermelonJudge:
    def __init__(self):
        self.model = None
        self.feature_keys = None
        self.use_ml = False
        
        # Try to load the trained model
        model_path = "models/watermelon_model.pkl"
        keys_path = "models/feature_keys.pkl"
        
        if os.path.exists(model_path) and os.path.exists(keys_path):
            try:
                self.model = joblib.load(model_path)
                self.feature_keys = joblib.load(keys_path)
                self.use_ml = True
                print("✅ Successfully loaded ML model.")
            except Exception as e:
                print(f"⚠️ Failed to load ML model: {e}. Falling back to rules.")
        else:
            print("⚠️ ML model not found. Using rule-based fallback.")

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Main prediction method. Uses ML if available, otherwise rules.
        """
        if self.use_ml:
            return self._predict_ml(features)
        else:
            return self._predict_rule_based(features)

    def _predict_ml(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Option B: Machine-learning model prediction.
        """
        # 1. Format features into the exact array the model expects
        feature_vector = [features[key] for key in self.feature_keys]
        feature_array = np.array(feature_vector).reshape(1, -1)
        
        # 2. Get prediction and confidence
        label = self.model.predict(feature_array)[0]
        probabilities = self.model.predict_proba(feature_array)[0]
        
        # Get the confidence score for the predicted class
        classes = self.model.classes_
        class_index = list(classes).index(label)
        confidence = float(probabilities[class_index])
        
        # 3. Calculate a 0-100 score based on confidence and label
        # (e.g., Ripe = high score, Underripe = low score)
        base_scores = {"ripe": 85, "overripe": 50, "underripe": 20}
        base_score = base_scores.get(label, 50)
        
        # Adjust score slightly based on confidence
        final_score = int(base_score * confidence + (1 - confidence) * 50)
        final_score = max(0, min(100, final_score))

        # 4. Generate explanations based on features (Simplified for ML)
        explanations = []
        if features['peak_freq'] < 200:
            explanations.append("The sound has a deep, resonant tone.")
        else:
            explanations.append("The sound is relatively high-pitched.")
            
        if features['spectral_centroid'] < 1200:
            explanations.append("The timbre indicates a hollow interior.")
        else:
            explanations.append("The sound is somewhat dense or dull.")

        return {
            "score": final_score,
            "label": label,
            "confidence": round(confidence, 2),
            "explanation": explanations
        }

    def _predict_rule_based(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Option A: Rule-based heuristic (Fallback).
        """
        # (Keep the exact same rule-based code from the previous step here)
        # ... [Insert previous rule-based code] ...
        pass