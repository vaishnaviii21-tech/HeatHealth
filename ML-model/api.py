from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path

# Create FastAPI application
app = FastAPI(title="HeatHealth Prediction API")

# Load the trained model once when the API starts
saved_model = joblib.load("heat_index_model.joblib")

model = saved_model["model"]
features = saved_model["features"]
# Load environmental data for all locations and hourly timestamps
DATASET_PATH = Path(__file__).parent / "pune_today_location_inputs.csv"
location_data = pd.read_csv(DATASET_PATH)

# Convert timestamps into datetime values
location_data["time"] = pd.to_datetime(location_data["time"])

# Define the required input data
class HeatInput(BaseModel):
    temperature_2m: float
    relative_humidity_2m: float
    wind_speed_10m: float
    apparent_temperature: float
    wet_bulb_temperature_2m: float
    NDVI: float
    built_up_percent: float
    surface_temp_c: float


# Create prediction endpoint
@app.post("/predict")
def predict_heat(data: HeatInput):

    # Convert incoming JSON into a DataFrame
    input_data = pd.DataFrame(
        [[
            data.temperature_2m,
            data.relative_humidity_2m,
            data.wind_speed_10m,
            data.apparent_temperature,
            data.wet_bulb_temperature_2m,
            data.NDVI,
            data.built_up_percent,
            data.surface_temp_c
        ]],
        columns=features
    )

    # Predict environmental heat index
    prediction = float(model.predict(input_data)[0])

    # Assign a category using the project's existing thresholds
    if prediction < 27:
        category = "Low"
    elif prediction < 32:
        category = "Moderate"
    elif prediction < 37:
        category = "High"
    else:
        category = "Very High"

    return {
        "predicted_environmental_heat_index_c": round(prediction, 2),
        "category": category,
        "methodology": (
            "Random Forest prediction of a provisional environmental "
            "heat index; not health-validated."
        )
    }


# Health check endpoint
@app.get("/")
def home():
    return {"message": "HeatHealth Prediction API is running"}

# Input for location-based prediction
class LocationInput(BaseModel):
    latitude: float
    longitude: float
    time: str


@app.post("/predict-location")
def predict_location(data: LocationInput):

    # Find the requested timestamp
    requested_time = pd.to_datetime(data.time)

    time_data = location_data[
        location_data["time"] == requested_time
    ]

    if time_data.empty:
        return {
            "success": False,
            "message": "No data available for the requested time."
        }

    # Find the nearest location using latitude and longitude
    distances = (
        (time_data["latitude"] - data.latitude) ** 2
        + (time_data["longitude"] - data.longitude) ** 2
    )

    nearest_index = distances.idxmin()
    row = location_data.loc[nearest_index]

    # Prepare the model input using the dataset's actual values
    input_data = pd.DataFrame(
        [[row[feature] for feature in features]],
        columns=features
    )

    # Predict environmental heat index
    prediction = float(model.predict(input_data)[0])

    # Assign a category using the existing thresholds
    if prediction < 27:
        category = "Low"
    elif prediction < 32:
        category = "Moderate"
    elif prediction < 37:
        category = "High"
    else:
        category = "Very High"

    return {
        "success": True,
        "location_id": row["location_id"],
        "requested_coordinates": {
            "latitude": data.latitude,
            "longitude": data.longitude
        },
        "matched_coordinates": {
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"])
        },
        "time": str(row["time"]),
        "environmental_data": {
            feature: float(row[feature])
            for feature in features
        },
        "predicted_environmental_heat_index_c": round(prediction, 2),
        "category": category,
        "methodology": (
            "Random Forest prediction using the nearest available dataset "
            "location and requested timestamp. This is a provisional "
            "environmental estimate, not a health-validated prediction."
        )
    }