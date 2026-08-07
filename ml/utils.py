"""
Wildlife Safety ML Utility Module
Provides spatial calculation, geodesic distance measurement, coordinate normalization,
logging helpers, and JSON output formatting functions.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import math
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

# Logging Configuration Helper
def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Creates and configures a standardized logger.

    :param name: Logger module name.
    :param level: Logging severity level.
    :return: Configured Logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger

logger = setup_logger("ML_Utils")

# Geodesic & Spatial Distance Functions
EARTH_RADIUS_KM = 6371.0088

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the Haversine distance in kilometers between two geographic points.

    :param lat1: Latitude of point 1 in degrees.
    :param lon1: Longitude of point 1 in degrees.
    :param lat2: Latitude of point 2 in degrees.
    :param lon2: Longitude of point 2 in degrees.
    :return: Distance in kilometers.
    """
    try:
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return EARTH_RADIUS_KM * c
    except Exception as e:
        logger.error(f"Error computing haversine distance ({lat1},{lon1}) -> ({lat2},{lon2}): {e}")
        return 0.0

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the initial compass bearing in degrees from point 1 to point 2.

    :return: Bearing in degrees [0, 360).
    """
    try:
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        initial_bearing = math.atan2(y, x)
        compass_bearing = (math.degrees(initial_bearing) + 360) % 360
        return round(compass_bearing, 2)
    except Exception as e:
        logger.error(f"Error computing bearing: {e}")
        return 0.0

def offset_coordinate(lat: float, lon: float, distance_km: float, bearing_deg: float) -> Tuple[float, float]:
    """
    Computes new destination coordinate given a start point, distance, and bearing.

    :param lat: Starting latitude.
    :param lon: Starting longitude.
    :param distance_km: Distance to travel in km.
    :param bearing_deg: Bearing angle in degrees.
    :return: Tuple of (new_lat, new_lon).
    """
    try:
        delta = distance_km / EARTH_RADIUS_KM
        theta = math.radians(bearing_deg)
        phi1 = math.radians(lat)
        lambda1 = math.radians(lon)

        phi2 = math.asin(math.sin(phi1) * math.cos(delta) + math.cos(phi1) * math.sin(delta) * math.cos(theta))
        lambda2 = lambda1 + math.atan2(
            math.sin(theta) * math.sin(delta) * math.cos(phi1),
            math.cos(delta) - math.sin(phi1) * math.sin(phi2)
        )
        return round(math.degrees(phi2), 6), round((math.degrees(lambda2) + 540) % 360 - 180, 6)
    except Exception as e:
        logger.error(f"Error computing coordinate offset: {e}")
        return lat, lon

def validate_lat_lon(lat: Any, lon: Any) -> bool:
    """
    Validates if coordinates are within valid geographic bounds.
    """
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        if -90.0 <= lat_f <= 90.0 and -180.0 <= lon_f <= 180.0 and not (lat_f == 0.0 and lon_f == 0.0):
            return True
        return False
    except (ValueError, TypeError):
        return False

def format_api_prediction_response(
    species: str,
    risk_level: str,
    confidence: float,
    pred_lat: float,
    pred_lon: float,
    prediction_time: Optional[str] = None,
) -> str:
    """
    Formats model inference output into standardized JSON payload expected by the Node.js backend.
    """
    if not prediction_time:
        prediction_time = datetime.now(timezone.utc).isoformat()

    response_payload = {
        "species": species,
        "risk": risk_level.upper(),
        "confidence": round(float(confidence), 2),
        "predicted_location": {
            "latitude": round(float(pred_lat), 6),
            "longitude": round(float(pred_lon), 6),
        },
        "prediction_time": prediction_time,
    }
    return json.dumps(response_payload, indent=2)
