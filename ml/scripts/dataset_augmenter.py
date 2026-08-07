"""
Dataset Augmentation & Synthetic Trajectory Sequence Generator
Generates realistic spatial jittering and multi-step movement trajectories required for
training species-specific LSTM trajectory prediction models.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import os
import random
import sys
from typing import Any, Dict, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import PROCESSED_DATA_DIR, RANDOM_STATE, SUPPORTED_SPECIES, WINDOW_SIZE
from utils import offset_coordinate, setup_logger

logger = setup_logger("Dataset_Augmenter")

random.seed(RANDOM_STATE)


def augment_and_build_lstm_sequences(
    input_file_name: str = "engineered_features.json",
    output_file_name: str = "lstm_sequences.json",
    samples_per_point: int = 3,
) -> str:
    """
    Constructs sequence windows of length WINDOW_SIZE with next step target positions for LSTM training.

    :param input_file_name: Feature engineered dataset filename.
    :param output_file_name: Target sequence JSON filename.
    :param samples_per_point: Number of synthetic trajectory chains generated per seed observation point.
    :return: Output file path.
    """
    input_path = os.path.join(PROCESSED_DATA_DIR, input_file_name)
    output_path = os.path.join(PROCESSED_DATA_DIR, output_file_name)

    if not os.path.exists(input_path):
        logger.error(f"Input file not found: {input_path}")
        return ""

    logger.info(f"Generating LSTM trajectory sequences from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        records: List[Dict[str, Any]] = json.load(f)

    sequences: List[Dict[str, Any]] = []

    for item in records:
        species = item["species"]
        base_lat = float(item["latitude"])
        base_lon = float(item["longitude"])

        # Species movement characteristics (typical daily displacement range in km)
        max_displacement_km = {
            "Bison bison": 1.5,
            "Bos gaurus": 1.2,
            "Elephas maximus": 3.5,
            "Melursus ursinus": 1.0,
            "Panthera pardus": 2.5,
            "Panthera tigris": 4.0,
        }.get(species, 2.0)

        for _ in range(samples_per_point):
            chain = []
            curr_lat = base_lat
            curr_lon = base_lon
            bearing = random.uniform(0.0, 360.0)

            # Generate WINDOW_SIZE historical points
            for step in range(WINDOW_SIZE):
                # Add minor Gaussian jitter to simulate movement trajectory
                dist = random.uniform(0.2, max_displacement_km)
                bearing = (bearing + random.uniform(-30.0, 30.0)) % 360.0
                curr_lat, curr_lon = offset_coordinate(curr_lat, curr_lon, dist, bearing)
                chain.append([round(curr_lat, 6), round(curr_lon, 6)])

            # Next step target position (ground truth Y label)
            target_dist = random.uniform(0.2, max_displacement_km)
            target_bearing = (bearing + random.uniform(-20.0, 20.0)) % 360.0
            next_lat, next_lon = offset_coordinate(curr_lat, curr_lon, target_dist, target_bearing)

            sequences.append({
                "species": species,
                "input_trajectory": chain,  # Shape: (WINDOW_SIZE, 2) -> [[lat, lon], ...]
                "target_location": [round(next_lat, 6), round(next_lon, 6)],
            })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(sequences, f, indent=2)

    logger.info(f"Trajectory sequence generation complete. Generated {len(sequences)} sequence windows.")
    logger.info(f"Saved sequences to: {output_path}")
    return output_path


if __name__ == "__main__":
    augment_and_build_lstm_sequences()
