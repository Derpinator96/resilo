# ml/feature_utils.py
from datetime import datetime

def datetime_features(dt_str):
    """
    Convert ISO datetime string into engineered features
    (year, month, day, dayofweek, hour, dayofyear).
    """
    date = datetime.fromisoformat(dt_str)
    return {
        "year": date.year,
        "month": date.month,
        "day": date.day,
        "dayofweek": date.weekday(),  # 0=Monday
        "hour": date.hour,
        "dayofyear": date.timetuple().tm_yday
    }