"""
OpenWeather Environmental Parameters Downloader
Fetches current and historical weather features (Temperature, Rainfall, Humidity, Wind Speed, Pressure, Visibility)
from OpenWeather API to enrich wildlife occurrence location vectors.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import os
import sys
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import DOWNLOAD_TIMEOUT, MAX_RETRIES, RAW_DATA_DIR
from utils import setup_logger, validate_lat_lon

logger = setup_logger("OpenWeather_Downloader")

OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"


def fetch_weather_for_coordinate(
    lat: float,
    lon: float,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches real-time environmental weather variables for a given spatial coordinate.

    :param lat: Latitude.
    :param lon: Longitude.
    :param api_key: OpenWeather API key (optional; fallback to realistic regional climate values if key is missing).
    :return: Environmental metrics dictionary.
    """
    if not validate_lat_lon(lat, lon):
        logger.warning(f"Invalid coordinate provided to weather downloader: ({lat}, {lon})")
        return get_fallback_weather_metrics(lat)

    if not api_key:
        api_key = os.environ.get("OPENWEATHER_API_KEY")

    if not api_key:
        logger.info("OPENWEATHER_API_KEY environment variable not detected. Using regional microclimate fallback estimator.")
        return get_fallback_weather_metrics(lat)

    params = {
        "lat": str(lat),
        "lon": str(lon),
        "appid": api_key,
        "units": "metric",
    }

    url = f"{OPENWEATHER_API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "WildlifeSafetyApp-ML/1.0"})

    try:
        with urllib.request.urlopen(req, timeout=DOWNLOAD_TIMEOUT) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                main = data.get("main", {})
                wind = data.get("wind", {})
                rain = data.get("rain", {})

                return {
                    "temperature_c": main.get("temp", 26.5),
                    "humidity_percent": main.get("humidity", 72),
                    "pressure_hpa": main.get("pressure", 1012),
                    "wind_speed_m_s": wind.get("speed", 3.2),
                    "rainfall_mm": rain.get("1h", 0.0),
                    "visibility_m": data.get("visibility", 10000),
                    "source": "OpenWeatherAPI",
                }
    except Exception as e:
        logger.warning(f"OpenWeather query failed for ({lat}, {lon}): {e}. Utilizing climate fallback.")

    return get_fallback_weather_metrics(lat)


def get_fallback_weather_metrics(lat: float) -> Dict[str, Any]:
    """
    Generates realistic tropical/montane microclimate baseline metrics when API key is unavailable.
    """
    # Latitude-dependent temperature model
    temp_c = round(30.0 - abs(lat) * 0.4, 1)
    return {
        "temperature_c": max(15.0, min(38.0, temp_c)),
        "humidity_percent": 68,
        "pressure_hpa": 1013,
        "wind_speed_m_s": 2.8,
        "rainfall_mm": 0.0,
        "visibility_m": 10000,
        "source": "ClimateFallbackEstimator",
    }


def download_openweather_dataset_sample(
    output_filename: str = "weather_raw.json",
) -> str:
    """
    Generates weather dataset samples for reference regional checkpoints.
    """
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    output_path = os.path.join(RAW_DATA_DIR, output_filename)

    sample_coords = [
        {"location": "Nilgiris Biosphere", "lat": 11.4102, "lon": 76.6950},
        {"location": "Mundanthurai Sanctuary", "lat": 8.6833, "lon": 77.3167},
        {"location": "Anamalai Reserve", "lat": 10.5000, "lon": 76.8333},
    ]

    results = []
    for loc in sample_coords:
        metrics = fetch_weather_for_coordinate(loc["lat"], loc["lon"])
        results.append({**loc, **metrics})

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    logger.info(f"OpenWeather sample metrics written to: {output_path}")
    return output_path


if __name__ == "__main__":
    download_openweather_dataset_sample()
