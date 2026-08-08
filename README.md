# 🛡️ Wildlife Safety Application V2

An AI-powered Wildlife Safety application that helps travelers and local communities navigate wildlife-prone regions safely. The application combines real-time wildlife observations, intelligent route planning, machine learning, and an AI assistant to reduce human–wildlife conflicts across South India.

---

## 🌟 Features

- 🗺️ Intelligent Route Planning
- 🐘 Wildlife Movement Prediction
- ⚠️ Wildlife Risk Assessment
- 🤖 AI Safety Assistant
- 📍 Current Location Detection
- 🚗 Car & 🏍 Bike Travel Modes
- ⏱️ Distance & ETA Calculation
- 🌦️ Weather-aware Wildlife Analysis
- 🐾 Interactive Wildlife Map
- 📈 Wildlife Movement Trajectory Visualization
- 📸 Community Wildlife Reporting
- 📱 Responsive Mobile & Web Interface

---

# 🏗️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Leaflet Maps
- OpenStreetMap
- OSRM Routing

## Backend

- Node.js
- Express.js


## Machine Learning

- Python 3.10.11
- TensorFlow / Keras
- Scikit-learn
- NumPy
- Pandas

## Data Sources

- GBIF
- iNaturalist
- OpenWeather API
- OpenStreetMap
- OSRM
- NASA SRTM DEM
- HydroSHEDS

---

# 📂 Project Structure

```text
.
├── app/                  # Application layouts and UI
├── assets/               # Images, icons and static resources
├── constants/            # Shared constants
├── ml/                   # Machine Learning pipeline
│   ├── scripts/
│   ├── datasets/
│   ├── models/
│   └── config.py
├── src/                  # React application
├── server.ts             # Express backend
├── package.json
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- Python 3.10.11 (for the ML pipeline)

---

## Installation

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

Start the development server:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

# 🧠 Machine Learning

The ML module supports six wildlife species:

- Asian Elephant (*Elephas maximus*)
- Bengal Tiger (*Panthera tigris*)
- Leopard (*Panthera pardus*)
- Sloth Bear (*Melursus ursinus*)
- Indian Gaur (*Bos gaurus*)
- Bison (*Bison bison*)

The pipeline includes:

- Data collection
- Data preprocessing
- Feature engineering
- Species-specific LSTM movement prediction
- Random Forest conflict risk prediction
- Model evaluation
- Prediction APIs

---

# 🌐 Deployment

This application is configured for deployment on **Render**.

### Web Service

- Environment: Node
- Build Command:

```bash
npm install && npm run build
```

- Start Command:

```bash
npm start
```

Required environment variables:

- `NODE_ENV`
- `PORT`
- `GEMINI_API_KEY`

---

# 📍 Application Workflow

```text
React Frontend
        │
        ▼
Node.js Express Backend
        │
        ├── Google Gemini API
        ├── Python ML Pipeline
        ├── OpenWeather API
        ├── GBIF
        ├── iNaturalist
        └── OpenStreetMap / OSRM
        │
        ▼
REST API Response
        │
        ▼
Interactive Map & Safety Guidance
```

---

# 🛡️ Key Capabilities

- Wildlife movement prediction
- Human–wildlife conflict risk analysis
- Safe route recommendations
- Real-time wildlife observations
- AI-powered travel assistance
- Weather-aware route planning
- Community wildlife reporting
- Interactive wildlife information
- Wildlife trajectory visualization

---

# 📄 License

This project is intended for educational and research purposes.
