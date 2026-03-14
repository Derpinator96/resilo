import os
import gdown

os.makedirs("models", exist_ok=True)

solar_url = "https://drive.google.com/file/d/1V5cDMTcQhuorQo342hW6-Dt_jyBCJEt1/view?usp=sharing"
water_url = "https://drive.google.com/file/d/1cBh5TM_7TR3-mwY4GekSeL5Wjbozee-W/view?usp=sharing"

solar_path = "models/solar_model.pkl"
water_path = "models/water_model.pkl"

if not os.path.exists(solar_path):
    print("Downloading solar model...")
    gdown.download(solar_url, solar_path, quiet=False)

if not os.path.exists(water_path):
    print("Downloading water model...")
    gdown.download(water_url, water_path, quiet=False)