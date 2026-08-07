"""
Model Loader Singleton & In-Memory Cache Manager
Loads trained species-specific LSTM models and Random Forest classifiers into memory
for instant sub-millisecond inference execution invoked by the Node.js Express Render API.

Python Version: 3.10.11 / 3.13 Compatible
"""

import logging
import os
import sys
from typing import Any, Dict, Optional, Tuple

import joblib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import LSTM_MODELS_DIR, RF_MODELS_DIR, SUPPORTED_SPECIES
from utils import setup_logger

logger = setup_logger("Model_Loader")


class ModelCacheManager:
    """
    Singleton cache manager for pre-loading and caching ML artifacts in memory.
    """

    _instance = None
    _lstm_cache: Dict[str, Any] = {}
    _rf_model: Optional[Any] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelCacheManager, cls).__new__(cls)
        return cls._instance

    def get_lstm_model_for_species(self, species_name: str) -> Optional[Any]:
        """
        Retrieves or loads Keras LSTM model for a species.

        :param species_name: Scientific species name.
        :return: Loaded model or None.
        """
        if species_name in self._lstm_cache:
            return self._lstm_cache[species_name]

        slug = species_name.lower().replace(" ", "_")
        model_path = os.path.join(LSTM_MODELS_DIR, f"{slug}_lstm.keras")

        if not os.path.exists(model_path):
            model_path_h5 = os.path.join(LSTM_MODELS_DIR, f"{slug}_lstm.h5")
            if os.path.exists(model_path_h5):
                model_path = model_path_h5
            else:
                logger.info(f"LSTM model file not found for species '{species_name}'. Using kinematic trajectory predictor.")
                return None

        try:
            import tensorflow as tf

            model = tf.keras.models.load_model(model_path)
            self._lstm_cache[species_name] = model
            logger.info(f"Loaded LSTM model for '{species_name}' into memory.")
            return model
        except Exception as e:
            logger.error(f"Error loading LSTM model for '{species_name}': {e}")
            return None

    def get_random_forest_model(self) -> Optional[Any]:
        """
        Retrieves or loads the Random Forest risk classifier model.
        """
        if self._rf_model is not None:
            return self._rf_model

        rf_path = os.path.join(RF_MODELS_DIR, "conflict_risk_rf.joblib")
        if not os.path.exists(rf_path):
            logger.info("Random Forest model file not found. Using heuristic risk rules.")
            return None

        try:
            model = joblib.load(rf_path)
            self._rf_model = model
            logger.info("Loaded Random Forest conflict risk model into memory.")
            return model
        except Exception as e:
            logger.error(f"Error loading Random Forest model: {e}")
            return None


def get_model_cache() -> ModelCacheManager:
    """
    Returns Singleton ModelCacheManager instance.
    """
    return ModelCacheManager()


if __name__ == "__main__":
    cache = get_model_cache()
    rf = cache.get_random_forest_model()
    print("Model cache manager initialized successfully.")
