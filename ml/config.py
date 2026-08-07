"""
Wildlife Safety Application - Machine Learning Configuration
Target Python Version: 3.10.11 (ML Core) / 3.13 (Utilities)
Supported Species: ONLY 6 strictly defined species.
"""

import os
from typing import Dict, List, Tuple

# Versioning & Constants
MODEL_VERSION: str = "1.0.0"
RANDOM_STATE: int = 42

# Base Directories
BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR: str = os.path.join(BASE_DIR, "datasets")
RAW_DATA_DIR: str = os.path.join(DATASETS_DIR, "raw")
PROCESSED_DATA_DIR: str = os.path.join(DATASETS_DIR, "processed")

MODELS_DIR: str = os.path.join(BASE_DIR, "models")
LSTM_MODELS_DIR: str = os.path.join(MODELS_DIR, "lstm")
RF_MODELS_DIR: str = os.path.join(MODELS_DIR, "random_forest")

LOGS_DIR: str = os.path.join(BASE_DIR, "logs")
CHECKPOINTS_DIR: str = os.path.join(BASE_DIR, "checkpoints")

# Directory Alias Mapping
MODEL_SAVE_DIRECTORY: str = MODELS_DIR
LOG_DIRECTORY: str = LOGS_DIR
CHECKPOINT_DIRECTORY: str = CHECKPOINTS_DIR

# Ensure directory structure exists
for directory in [
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    MODELS_DIR,
    LSTM_MODELS_DIR,
    RF_MODELS_DIR,
    LOGS_DIR,
    CHECKPOINTS_DIR,
]:
    os.makedirs(directory, exist_ok=True)

# Dataset Split Ratios
TRAIN_TEST_SPLIT: float = 0.8
TEST_SPLIT: float = 0.2
VALIDATION_SPLIT: float = 0.2

# Training & Model Hyperparameters
WINDOW_SIZE: int = 5
PREDICTION_STEPS: int = 3
EPOCHS: int = 50
BATCH_SIZE: int = 32
LEARNING_RATE: float = 0.001
EARLY_STOPPING_PATIENCE: int = 10

# Data Acquisition & Downloader Settings
DEFAULT_RECORDS_PER_SPECIES: int = 5000
GBIF_BATCH_SIZE: int = 300  # GBIF API maximum limit per page is 300
DOWNLOAD_TIMEOUT: int = 30
MAX_RETRIES: int = 5
BACKOFF_FACTOR: float = 1.5

# Strictly Supported Species (Scientific Name -> Common Name)
SUPPORTED_SPECIES: Dict[str, str] = {
    "Bison bison": "American Bison",
    "Bos gaurus": "Indian Gaur",
    "Elephas maximus": "Asian Elephant",
    "Melursus ursinus": "Sloth Bear",
    "Panthera pardus": "Leopard",
    "Panthera tigris": "Tiger",
}

# GBIF Species Taxon Keys (for GBIF API queries)
GBIF_TAXON_KEYS: Dict[str, int] = {
    "Bison bison": 2441176,
    "Bos gaurus": 2441028,
    "Elephas maximus": 2441011,
    "Melursus ursinus": 2433385,
    "Panthera pardus": 5219436,
    "Panthera tigris": 5219426,
}

# Spatial Bounds (Default focus: Nilgiris Biosphere / South Asia, or global query fallback)
NILGIRIS_BOUNDS: Dict[str, float] = {
    "min_lat": 8.0,
    "max_lat": 15.5,
    "min_lon": 74.0,
    "max_lon": 80.5,
}

# Risk Thresholds (km)
RISK_THRESHOLDS: Dict[str, float] = {
    "HIGH": 2.0,
    "MEDIUM": 10.0,
}

