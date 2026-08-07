# 🧠 Wildlife Safety Machine Learning Pipeline

The Machine Learning (ML) module powers the Wildlife Safety application by predicting wildlife movement, assessing human–wildlife conflict risk, and supporting safer route recommendations. It integrates with the Node.js Express backend to provide real-time predictions for the mobile and web applications.

---

# 🎯 Objectives

The ML pipeline is designed to:

- Predict wildlife movement patterns
- Assess human–wildlife conflict risk
- Support intelligent route planning
- Process historical and recent wildlife observations
- Generate predictions for the backend APIs

---

# 🐘 Supported Wildlife

The pipeline currently supports the following wildlife species:

- Asian Elephant (*Elephas maximus*)
- Bengal Tiger (*Panthera tigris*)
- Leopard (*Panthera pardus*)
- Sloth Bear (*Melursus ursinus*)
- Indian Gaur (*Bos gaurus*)
- Bison (*Bison bison*)

---

# 🏗️ Machine Learning Workflow

```text
Wildlife & Environmental Data
            │
            ▼
Data Collection
(GBIF, iNaturalist, Weather, Terrain)
            │
            ▼
Data Cleaning & Preprocessing
            │
            ▼
Feature Engineering
            │
            ▼
Dataset Augmentation
            │
            ▼
Model Training
      ┌───────────────┐
      │               │
      ▼               ▼
LSTM Models     Random Forest Models
      │               │
      └───────┬───────┘
              ▼
Prediction Engine
              │
              ▼
Node.js Express Backend
              │
              ▼
Wildlife Safety Application
```

---

# 📂 Directory Structure

```text
ml/
├── config.py
├── requirements.txt
├── utils.py
├── README.md
├── datasets/
│   ├── raw/
│   └── processed/
├── models/
│   ├── lstm/
│   └── random_forest/
├── logs/
├── checkpoints/
└── scripts/
    ├── download_gbif.py
    ├── download_inaturalist.py
    ├── download_openweather.py
    ├── download_srtm.py
    ├── download_hydrosheds.py
    ├── preprocess_data.py
    ├── combine_datasets.py
    ├── feature_engineering.py
    ├── dataset_augmenter.py
    ├── species_classifier.py
    ├── train_lstm.py
    ├── train_random_forest.py
    ├── model_loader.py
    ├── predict_movement.py
    ├── predict_risk.py
    ├── evaluate_models.py
    └── generate_reports.py
```

---

# 📊 Data Sources

The ML pipeline uses data from:

- GBIF (Global Biodiversity Information Facility)
- iNaturalist
- OpenWeather API
- OpenStreetMap
- NASA SRTM DEM
- HydroSHEDS

---

# 🤖 Models

## LSTM

Used for:

- Wildlife movement prediction
- Trajectory forecasting
- Future location estimation

## Random Forest

Used for:

- Human–wildlife conflict risk prediction
- Risk classification
- Confidence estimation

---

# 🚀 Getting Started

## Install Dependencies

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## Download Data

```bash
python scripts/download_gbif.py
python scripts/download_inaturalist.py
python scripts/download_openweather.py
python scripts/download_srtm.py
python scripts/download_hydrosheds.py
```

---

## Prepare the Dataset

```bash
python scripts/preprocess_data.py
python scripts/combine_datasets.py
python scripts/feature_engineering.py
python scripts/dataset_augmenter.py
```

---

## Train the Models

```bash
python scripts/train_lstm.py
python scripts/train_random_forest.py
```

---

## Run Predictions

Movement Prediction

```bash
python scripts/predict_movement.py \
  --species "Elephas maximus" \
  --lat 11.423 \
  --lon 76.742
```

Risk Prediction

```bash
python scripts/predict_risk.py \
  --species "Panthera tigris" \
  --lat 11.423 \
  --lon 76.742
```

---

# 📤 Prediction Output

Example JSON response:

```json
{
  "species": "Elephas maximus",
  "risk": "HIGH",
  "confidence": 0.96,
  "predicted_location": {
    "latitude": 11.423,
    "longitude": 76.742
  },
  "prediction_time": "2026-08-06T15:30:00Z"
}
```

---

# 🔗 Integration

The Machine Learning module integrates with:

- Node.js Express Backend
- React Web Application
- React Native (Expo) Mobile Application

All predictions are returned as JSON responses through the backend APIs.

---

# 📈 Features

- Wildlife movement prediction
- Wildlife trajectory forecasting
- Conflict risk assessment
- Species validation
- Weather-aware prediction
- Terrain-aware analysis
- Dataset preprocessing
- Feature engineering
- Model evaluation
- Performance reporting

---

# 📝 License

This project is intended for educational and research purposes.