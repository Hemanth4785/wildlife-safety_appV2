"""
Random Forest Human-Wildlife Conflict Risk Classifier Trainer
Trains a Random Forest classifier to predict human-wildlife conflict risk levels (HIGH, MEDIUM, LOW)
based on terrain, temporal, spatial, and proximity features.

Python Version: 3.10.11 / 3.13 Compatible
"""

import json
import logging
import os
import sys
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import PROCESSED_DATA_DIR, RANDOM_STATE, RF_MODELS_DIR, TRAIN_TEST_SPLIT
from utils import setup_logger

logger = setup_logger("Train_RandomForest")


def train_random_forest_risk_classifier(
    input_file_name: str = "engineered_features.json",
    model_output_name: str = "conflict_risk_rf.joblib",
) -> str:
    """
    Trains a Random Forest model on engineered environmental and temporal features to classify risk levels.

    :param input_file_name: Feature dataset JSON filename.
    :param model_output_name: Output joblib binary model filename.
    :return: Path to saved model.
    """
    input_path = os.path.join(PROCESSED_DATA_DIR, input_file_name)
    os.makedirs(RF_MODELS_DIR, exist_ok=True)
    output_path = os.path.join(RF_MODELS_DIR, model_output_name)

    if not os.path.exists(input_path):
        logger.error(f"Feature dataset not found: {input_path}")
        return ""

    logger.info(f"Loading dataset for Random Forest training from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        records: List[Dict[str, Any]] = json.load(f)

    feature_matrix = []
    target_labels = []

    label_encoding = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}

    for item in records:
        feats = [
            float(item["latitude"]),
            float(item["longitude"]),
            float(item["hour"]),
            float(item["month"]),
            float(item["season"]),
            float(item["elevation_m"]),
            float(item["slope_deg"]),
            float(item["dist_water_km"]),
            float(item["dist_road_km"]),
        ]
        risk_str = item.get("risk_label", "LOW").upper()
        target_labels.append(label_encoding.get(risk_str, 0))
        feature_matrix.append(feats)

    X = np.array(feature_matrix, dtype=np.float32)
    y = np.array(target_labels, dtype=np.int32)

    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import accuracy_score, classification_report
        from sklearn.model_selection import train_test_split

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=(1.0 - TRAIN_TEST_SPLIT), random_state=RANDOM_STATE, stratify=y
        )

        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            random_state=RANDOM_STATE,
            class_weight="balanced",
        )

        rf_model.fit(X_train, y_train)

        y_pred = rf_model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)

        logger.info("Random Forest Training Performance:")
        logger.info(f"Accuracy: {acc * 100:.2f}%")
        logger.info(f"Classification Report:\n{classification_report(y_test, y_pred)}")

        joblib.dump(rf_model, output_path)
        logger.info(f"Saved trained Random Forest model to: {output_path}")
        return output_path
    except ImportError:
        logger.warning("Scikit-learn not available. Saving lightweight rule model instead.")
        joblib.dump({"type": "rule_based_fallback", "encoding": label_encoding}, output_path)
        return output_path


if __name__ == "__main__":
    train_random_forest_risk_classifier()
