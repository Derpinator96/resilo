# ml/solar_app.py
from fastapi import FastAPI
import joblib, pandas as pd

app = FastAPI()
model = joblib.load("solar_model.pkl")  # load trained RandomForest model

@app.post("/predict-solar")
def predict(features: dict):
    # Convert input dict to DataFrame
    df = pd.DataFrame([features])
    prediction = model.predict(df)[0]
    return {"prediction_MW": float(prediction)}

print("Model expects:", model.feature_names_in_)