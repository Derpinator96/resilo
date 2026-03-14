from fastapi import FastAPI
import pandas as pd
import numpy as np
import joblib
import os
import subprocess


if not os.path.exists("models/water_model.pkl"):
    subprocess.run(["python", "download_models.py"])
app = FastAPI()

# Load your trained water model
model = joblib.load("models/water_model.pkl")

@app.post("/predict-water")
def predict_water(features: dict):
    # Convert incoming JSON to DataFrame
    df = pd.DataFrame([features])

    # ── Feature Engineering (must match training notebook) ──
    df["ph_turbidity"]           = df["pH"] * df["Turbidity"]
    df["solids_hardness_ratio"]  = df["Solids"] / (df["Hardness"] + 1)
    df["ph_safe"]                = ((df["pH"] >= 6.5) & (df["pH"] <= 8.5)).astype(int)
    df["turbidity_safe"]         = (df["Turbidity"] <= 4).astype(int)
    df["ph_squared"]             = df["pH"] ** 2
    df["turbidity_squared"]      = df["Turbidity"] ** 2
    df["solids_log"]             = np.log1p(df["Solids"])
    df["hardness_log"]           = np.log1p(df["Hardness"])
    df["sulfate_conductivity"]   = df["Sulfate"] / (df["Conductivity"] + 1)
    df["chloramines_ph"]         = df["Chloramines"] * df["pH"]
    df["sulfate_ph"]             = df["Sulfate"] * df["pH"]
    df["conductivity_turbidity"] = df["Conductivity"] * df["Turbidity"]
    df["tthm_organic"]           = df["Trihalomethanes"] * df["Organic_carbon"]
    df["hardness_sulfate"]       = df["Hardness"] / (df["Sulfate"] + 1)
    df["solids_chloramines"]     = df["Solids"] * df["Chloramines"]
    df["ph_deviation"]           = abs(df["pH"] - 7.0)

    # Align DataFrame columns to model expectation
    df = df.reindex(columns=model.feature_names_in_, fill_value=0)

    # Make prediction
    prediction = model.predict(df)[0]
    label = "Potable" if prediction == 1 else "Not Potable"

    return {"prediction": int(prediction), "label": label}