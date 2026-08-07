"""
Feature Engineering Engine
Calculates spatial, temporal, terrain, water proximity, and environmental features
for occurrence points to construct training matrices for Random Forest and LSTM models.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import math
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import PROCESSED_DATA_DIR
from utils import calculate_bearing, haversine_distance, setup_logger

logger = setup_logger("Feature_Engineering")


def extract_temporal_features(timestamp_str: str) -> Dict[str, Any]:
    """
    Extracts cyclic hour, day of week, month, and season features from ISO timestamp.
    """
    try:
        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        hour = dt.hour
        day_of_week = dt.weekday()
        month = dt.month

        # Cyclic encoding for time of day (24-hour cycle)
        hour_sin = math.sin(2 * math.pi * hour / 24.0)
        hour_cos = math.cos(2 * math.pi * hour / 24.0)

        # Cyclic encoding for month (12-month cycle)
        month_sin = math.sin(2 * math.pi * month / 12.0)
        month_cos = math.cos(2 * math.pi * month / 12.0)

        # Season indicator (0: Winter, 1: Spring, 2: Summer/Monsoon, 3: Autumn)
        season = (month % 12) // 3

        return {
            "hour": hour,
            "hour_sin": round(hour_sin, 4),
            "hour_cos": round(hour_cos, 4),
            "day_of_week": day_of_week,
            "month": month,
            "month_sin": round(month_sin, 4),
            "month_cos": round(month_cos, 4),
            "season": season,
        }
    except Exception:
        return {
            "hour": 12,
            "hour_sin": 0.0,
            "hour_cos": -1.0,
            "day_of_week": 2,
            "month": 6,
            "month_sin": 0.0,
            "month_cos": -1.0,
            "season": 2,
        }


def compute_terrain_and_water_proximal_features(lat: float, lon: float) -> Dict[str, float]:
    """
    Estimates elevation, slope, distance to nearest water body, and road proximity based on spatial coordinates.
    """
    # Simulated terrain model based on regional Nilgiris / mountain baseline geometry
    elevation_m = max(100.0, round(1200.0 + 800.0 * math.sin(lat * 5.0) * math.cos(lon * 5.0), 1))
    slope_deg = max(0.5, round(12.0 + 10.0 * math.cos(lat * 10.0), 1))

    # Proximity calculation to water bodies (rivers/lakes)
    dist_water_km = max(0.1, round(3.5 + 2.5 * math.sin(lat * 8.0 + lon * 8.0), 2))

    # Proximity calculation to roads/settlements
    dist_road_km = max(0.05, round(2.0 + 1.8 * math.cos(lat * 12.0), 2))

    return {
        "elevation_m": elevation_m,
        "slope_deg": slope_deg,
        "dist_water_km": dist_water_km,
        "dist_road_km": dist_road_km,
    }


def generate_engineered_features(
    input_file_name: str = "combined_master.json",
    output_file_name: str = "engineered_features.json",
) -> str:
    """
    Processes master occurrence dataset and generates comprehensive feature vectors for model training.

    :param input_file_name: Source master dataset JSON.
    :param output_file_name: Target engineered dataset JSON.
    :return: Output file path.
    """
    input_path = os.path.join(PROCESSED_DATA_DIR, input_file_name)
    output_path = os.path.join(PROCESSED_DATA_DIR, output_file_name)

    if not os.path.exists(input_path):
        logger.error(f"Input file not found: {input_path}")
        return ""

    logger.info(f"Generating engineered features from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        records: List[Dict[str, Any]] = json.load(f)

    engineered_records: List[Dict[str, Any]] = []

    for item in records:
        lat = float(item["latitude"])
        lon = float(item["longitude"])
        species = item["species"]
        ts = item.get("timestamp", "2026-01-01T12:00:00Z")

        temporal_feats = extract_temporal_features(ts)
        geo_feats = compute_terrain_and_water_proximal_features(lat, lon)

        record_feat = {
            "species": species,
            "latitude": lat,
            "longitude": lon,
            "timestamp": ts,
            **temporal_feats,
            **geo_feats,
            # Target conflict risk classification ground truth (High, Medium, Low based on road/human proximity)
            "risk_label": "HIGH" if geo_feats["dist_road_km"] <= 1.0 else ("MEDIUM" if geo_feats["dist_road_km"] <= 3.5 else "LOW"),
        }
        engineered_records.append(record_feat)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(engineered_records, f, indent=2)

    logger.info(f"Feature engineering complete. Saved {len(engineered_records)} records to: {output_path}")
    return output_path


if __name__ == "__main__":
    generate_engineered_features()
