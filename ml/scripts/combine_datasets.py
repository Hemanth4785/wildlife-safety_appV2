"""
Multi-Source Dataset Merger & Harmonizer
Combines preprocessed occurrence records from GBIF, iNaturalist, and auxiliary data sources
into a unified training master matrix stored in datasets/processed/combined_master.json and CSV.

Python Version: 3.10.11 / 3.13 Compatible
"""

import csv
import json
import logging
import os
import sys
from typing import Any, Dict, List, Set, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import PROCESSED_DATA_DIR, SUPPORTED_SPECIES
from utils import setup_logger, validate_lat_lon

logger = setup_logger("Combine_Datasets")


def combine_all_processed_datasets(
    output_json_name: str = "combined_master.json",
    output_csv_name: str = "combined_master.csv",
) -> Tuple[str, str]:
    """
    Finds all cleaned dataset files in datasets/processed, merges them, removes cross-source duplicates,
    and outputs a unified master dataset.

    :param output_json_name: Combined output JSON filename.
    :param output_csv_name: Combined output CSV filename.
    :return: Tuple of (master_json_path, master_csv_path).
    """
    if not os.path.exists(PROCESSED_DATA_DIR):
        logger.error(f"Processed directory does not exist: {PROCESSED_DATA_DIR}")
        return "", ""

    combined_records: List[Dict[str, Any]] = []
    seen_unique_keys: Set[str] = set()

    files = [f for f in os.listdir(PROCESSED_DATA_DIR) if f.startswith("cleaned_") and f.endswith(".json")]
    logger.info(f"Found {len(files)} cleaned dataset files for merging: {files}")

    for file_name in files:
        file_path = os.path.join(PROCESSED_DATA_DIR, file_name)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data: List[Dict[str, Any]] = json.load(f)
                logger.info(f"Loading {len(data)} records from {file_name}")

                for item in data:
                    sp = item.get("species")
                    if sp not in SUPPORTED_SPECIES:
                        continue

                    lat = item.get("latitude")
                    lon = item.get("longitude")
                    if not validate_lat_lon(lat, lon):
                        continue

                    ts = item.get("timestamp", "2026-01-01T00:00:00Z")
                    unique_key = f"{sp}_{round(float(lat), 4)}_{round(float(lon), 4)}_{ts[:10]}"

                    if unique_key in seen_unique_keys:
                        continue
                    seen_unique_keys.add(unique_key)

                    combined_records.append(item)
        except Exception as e:
            logger.error(f"Error loading {file_name}: {e}")

    master_json_path = os.path.join(PROCESSED_DATA_DIR, output_json_name)
    master_csv_path = os.path.join(PROCESSED_DATA_DIR, output_csv_name)

    # Save Master JSON
    with open(master_json_path, "w", encoding="utf-8") as json_f:
        json.dump(combined_records, json_f, indent=2)
    logger.info(f"Successfully created combined master JSON: {master_json_path}")

    # Save Master CSV
    if combined_records:
        fieldnames = list(combined_records[0].keys())
        with open(master_csv_path, "w", newline="", encoding="utf-8") as csv_f:
            writer = csv.DictWriter(csv_f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(combined_records)
        logger.info(f"Successfully created combined master CSV: {master_csv_path}")

    logger.info(f"Dataset consolidation complete. Total unique training samples: {len(combined_records)}")
    return master_json_path, master_csv_path


if __name__ == "__main__":
    combine_all_processed_datasets()
