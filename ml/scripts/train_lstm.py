"""
Species-Specific LSTM Trajectory Movement Trainer
Trains Keras LSTM neural networks on spatial sequence windows for each of the 6 supported species.
Saves trained models to models/lstm/<species_slug>_lstm.h5.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import os
import sys
from typing import Dict, List, Tuple

import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import (
    BATCH_SIZE,
    EARLY_STOPPING_PATIENCE,
    EPOCHS,
    LEARNING_RATE,
    LSTM_MODELS_DIR,
    PREDICTION_STEPS,
    PROCESSED_DATA_DIR,
    RANDOM_STATE,
    SUPPORTED_SPECIES,
    TRAIN_TEST_SPLIT,
    WINDOW_SIZE,
)
from utils import setup_logger

logger = setup_logger("Train_LSTM")

# Suppress TensorFlow verbose logging if applicable
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"


def build_lstm_model(input_shape: Tuple[int, int] = (WINDOW_SIZE, 2)):
    """
    Constructs Keras Sequential LSTM architecture for coordinate trajectory prediction.

    :param input_shape: Sequence length and feature count (WINDOW_SIZE, 2).
    :return: Compiled Keras Model instance or fallback estimator mock if Keras is missing.
    """
    try:
        import tensorflow as tf
        from tensorflow.keras.layers import Dense, Dropout, LSTM
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.optimizers import Adam

        model = Sequential([
            LSTM(64, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            Dense(16, activation="relu"),
            Dense(2, activation="linear"),  # Output: [predicted_lat, predicted_lon]
        ])

        optimizer = Adam(learning_rate=LEARNING_RATE)
        model.compile(optimizer=optimizer, loss="mse", metrics=["mae"])
        return model
    except ImportError:
        logger.warning("TensorFlow library not available. Training mode will operate in numpy linear fallback mode.")
        return None


def train_species_lstm_models(input_file_name: str = "lstm_sequences.json") -> Dict[str, str]:
    """
    Trains separate species-specific LSTM movement prediction models for all 6 target species.

    :param input_file_name: JSON sequence dataset.
    :return: Map of species scientific names to saved model weights file paths.
    """
    input_path = os.path.join(PROCESSED_DATA_DIR, input_file_name)
    if not os.path.exists(input_path):
        logger.error(f"Sequences dataset file not found: {input_path}")
        return {}

    logger.info(f"Loading sequence dataset for LSTM training from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        all_sequences: List[Dict] = json.load(f)

    os.makedirs(LSTM_MODELS_DIR, exist_ok=True)
    trained_model_paths: Dict[str, str] = {}

    for species_name in SUPPORTED_SPECIES.keys():
        logger.info(f"------------------------------------------------------------------")
        logger.info(f"Training species-specific LSTM model for: {species_name}")

        species_seqs = [s for s in all_sequences if s.get("species") == species_name]
        if not species_seqs:
            logger.warning(f"No sequences found for '{species_name}'. Skipping LSTM training.")
            continue

        X_list = [s["input_trajectory"] for s in species_seqs]
        Y_list = [s["target_location"] for s in species_seqs]

        X = np.array(X_list, dtype=np.float32)  # Shape: (N, WINDOW_SIZE, 2)
        Y = np.array(Y_list, dtype=np.float32)  # Shape: (N, 2)

        split_idx = int(len(X) * TRAIN_TEST_SPLIT)
        X_train, X_val = X[:split_idx], X[split_idx:]
        Y_train, Y_val = Y[:split_idx], Y[split_idx:]

        slug = species_name.lower().replace(" ", "_")
        model_save_path = os.path.join(LSTM_MODELS_DIR, f"{slug}_lstm.keras")

        model = build_lstm_model(input_shape=(WINDOW_SIZE, 2))

        if model is not None:
            try:
                import tensorflow as tf

                early_stopping = tf.keras.callbacks.EarlyStopping(
                    monitor="val_loss",
                    patience=EARLY_STOPPING_PATIENCE,
                    restore_best_weights=True,
                )

                history = model.fit(
                    X_train,
                    Y_train,
                    validation_data=(X_val, Y_val),
                    epochs=min(EPOCHS, 15),  # Fast epoch execution
                    batch_size=BATCH_SIZE,
                    callbacks=[early_stopping],
                    verbose=0,
                )

                model.save(model_save_path)
                logger.info(f"Successfully trained and saved LSTM model to: {model_save_path}")
                trained_model_paths[species_name] = model_save_path
            except Exception as e:
                logger.error(f"Keras training exception for {species_name}: {e}")
        else:
            # Save lightweight numpy weights representation
            weights_save_path = os.path.join(LSTM_MODELS_DIR, f"{slug}_weights.json")
            weights = {"mean_X": X_train.mean(axis=0).tolist(), "mean_Y": Y_train.mean(axis=0).tolist()}
            with open(weights_save_path, "w") as wf:
                json.dump(weights, wf)
            trained_model_paths[species_name] = weights_save_path

    logger.info(f"LSTM training pipeline complete. Trained models count: {len(trained_model_paths)}")
    return trained_model_paths


if __name__ == "__main__":
    train_species_lstm_models()
