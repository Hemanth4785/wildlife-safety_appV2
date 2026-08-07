"""
Data Preprocessing & Sanitization Pipeline
Cleans raw occurrence datasets (GBIF, iNaturalist), validates coordinate bounds,
strips duplicate records, parses standardized UTC ISO timestamps, and outputs
cleaned dataset files in datasets/processed.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import PROCESSED_DATA_DIR, RAW_DATA_DIR, SUPPORTED_SPECIES
from utils import setup_logger, validate_lat_lon

logger = setup_logger("Preprocess_Data")


def parse_and_standardize_date(date_str: Any) -> Optional[str]:
    """
    Parses various date formats into standard ISO 8601 UTC string (YYYY-MM-DDTHH:MM:SSZ).
    """
    if not date_str or not isinstance(date_str, str):
        return None

    date_str = date_str.strip()
    formats_to_try = [
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]

    for fmt in formats_to_try:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            continue

    # Try extracted year-month-day prefix
    if len(date_str) >= 10 and date_str[4] == "-" and date_str[7] == "-":
        try:
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
            return dt.strftime("%Y-%m-%dT00:00:00Z")
        except ValueError:
            pass

    return None


def preprocess_dataset(
    input_file_path: str,
    output_filename: str = "cleaned_data.json",
) -> str:
    """
    Preprocesses raw occurrence dataset, applying species filtering, spatial verification,
    and temporal standardization.

    :param input_file_path: Absolute path to raw dataset file (JSON).
    :param output_filename: Target processed JSON filename.
    :return: Output clean JSON file path.
    """
    if not os.path.exists(input_file_path):
        logger.error(f"Input file not found: {input_file_path}")
        return ""

    logger.info(f"Loading raw dataset from: {input_file_path}")
    with open(input_file_path, "r", encoding="utf-8") as f:
        try:
            raw_records: List[Dict[str, Any]] = json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse raw JSON dataset: {e}")
            return ""

    logger.info(f"Raw record count: {len(raw_records)}")
    cleaned_records: List[Dict[str, Any]] = []
    seen_keys = set()

    invalid_coords = 0
    invalid_species = 0
    duplicates = 0

    for item in raw_records:
        species_name = item.get("species") or item.get("scientificName")
        if not species_name:
            invalid_species += 1
            continue

        # Strictly enforce target species constraint
        matched_species = None
        for supported in SUPPORTED_SPECIES.keys():
            if supported.lower() in species_name.lower():
                matched_species = supported
                break

        if not matched_species:
            invalid_species += 1
            continue

        lat = item.get("latitude") or item.get("decimalLatitude")
        lon = item.get("longitude") or item.get("decimalLongitude")

        if not validate_lat_lon(lat, lon):
            invalid_coords += 1
            continue

        lat_f = float(lat)
        lon_f = float(lon)

        # Deduplication key
        event_date = parse_and_standardize_date(item.get("eventDate") or item.get("observedOn"))
        dup_key = f"{matched_species}_{round(lat_f, 4)}_{round(lon_f, 4)}_{event_date}"

        if dup_key in seen_keys:
            duplicates += 1
            continue
        seen_keys.add(dup_key)

        cleaned_records.append({
            "species": matched_species,
            "commonName": SUPPORTED_SPECIES[matched_species],
            "latitude": round(lat_f, 6),
            "longitude": round(lon_f, 6),
            "timestamp": event_date or "2026-01-01T00:00:00Z",
            "source": item.get("source", "UNKNOWN"),
        })

    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    output_path = os.path.join(PROCESSED_DATA_DIR, output_filename)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_records, f, indent=2)

    logger.info("==================================================================")
    logger.info("Preprocessing Summary:")
    logger.info(f"Initial Records: {len(raw_records)}")
    logger.info(f"Discarded (Invalid Coords): {invalid_coords}")
    logger.info(f"Discarded (Unsupported Species): {invalid_species}")
    logger.info(f"Discarded (Duplicates): {duplicates}")
    logger.info(f"Retained Clean Records: {len(cleaned_records)}")
    logger.info(f"Saved cleaned dataset to: {output_path}")
    logger.info("==================================================================")

    return output_path


if __name__ == "__main__":
    raw_gbif_path = os.path.join(RAW_DATA_DIR, "gbif_raw.json")
    if os.path.exists(raw_gbif_path):
        preprocess_dataset(raw_gbif_path, "cleaned_gbif.json")
