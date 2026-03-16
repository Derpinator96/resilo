# ml/solar_app.py
from fastapi import FastAPI
import joblib, pandas as pd
import os
import subprocess



if not os.path.exists("models/solar_model.pkl"):
    subprocess.run(["python", "download_models.py"])

app = FastAPI()
model = joblib.load("models/solar_model.pkl")  # load trained RandomForest model

@app.post("/predict")
def predict(features: dict):
    df = pd.DataFrame([features])
    prediction = model.predict(df)[0]
    return {"prediction": float(prediction)}


print("Model expects:", model.feature_names_in_)