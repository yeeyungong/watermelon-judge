import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from services.audio_processing import extract_features

# Define the exact features we want to feed into the model
FEATURE_KEYS = [
    'rms_volume', 'peak_freq', 'duration_ms', 
    'spectral_centroid', 'zero_crossing_rate',
    'slap_velocity', 'impact_score', 'confidence'
]

def train_watermelon_model():
    csv_path = "dataset/labels.xlsx"
    
    print("Loading dataset...")
    df = pd.read_excel(csv_path)
    
    print("Preparing features...")
    # Use pre-extracted features from the dataset
    X = df[FEATURE_KEYS].values
    y = df['ripeness'].values
    
    print(f"Successfully loaded {len(X)} samples.")
    
    # Split into training and testing sets (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train a Random Forest Classifier
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate the model
    print("\n--- Model Evaluation ---")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    # Save the model and the feature keys for the API to use
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/watermelon_model.pkl")
    joblib.dump(FEATURE_KEYS, "models/feature_keys.pkl")
    
    print("\n✅ Model saved to models/watermelon_model.pkl")

if __name__ == "__main__":
    train_watermelon_model()