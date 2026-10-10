const axios = require("axios");

const analyseHeatRisk = async (req, res) => {
    try {
        const { latitude, longitude, time } = req.body;

        // Validate required input
        if (
            latitude === undefined ||
            longitude === undefined ||
            !time
        ) {
            return res.status(400).json({
                success: false,
                message: "Latitude, longitude, and time are required"
            });
        }

        // Call the Python FastAPI prediction service
        const pythonResponse = await axios.post(
            "http://127.0.0.1:8000/predict-location",
            {
                latitude,
                longitude,
                time
            }
        );

        const prediction = pythonResponse.data;

        // Return the actual model prediction to the client
        return res.status(200).json({
            success: true,
            message: "Heat analysis completed successfully",
            data: {
                locationId: prediction.location_id,
                time: prediction.time,

                requestedCoordinates: prediction.requested_coordinates,
                matchedCoordinates: prediction.matched_coordinates,

                predictionTarget: "environmental_heat_index",
                predictedValue:
                    prediction.predicted_environmental_heat_index_c,

                riskLevel: prediction.category,
                environmentalData: prediction.environmental_data,

                methodology: prediction.methodology
            }
        });

    } catch (error) {
        console.error(
            "Heat analysis error:",
            error.response?.data || error.message
        );

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: "Python prediction service returned an error",
                details: error.response.data
            });
        }

        return res.status(502).json({
            success: false,
            message: "Could not connect to the Python prediction service. Check whether it is running."
        });
    }
};

//for color
const getNeighbourhoodHeatPredictions = async (req, res) => {
    try {
        const Neighbourhood = require("../models/Neighbourhood");

        const neighbourhoods = await Neighbourhood.find();

        if (neighbourhoods.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No neighbourhoods found in the database"
            });
        }

        const time = req.query.time || "2026-10-10 12:00:00";

        // Get predictions for all neighbourhoods
        const results = await Promise.all(
            neighbourhoods.map(async (area) => {
                try {
                    const pythonResponse = await axios.post(
                        "http://127.0.0.1:8000/predict-location",
                        {
                            latitude: area.latitude,
                            longitude: area.longitude,
                            time
                        }
                    );

                    const prediction = pythonResponse.data;

                    if (!prediction.success) {
                        throw new Error(
                            prediction.message || "Prediction unavailable"
                        );
                    }

                    return {
                        neighbourhoodId: area._id,
                        name: area.name,
                        coordinates: {
                            latitude: area.latitude,
                            longitude: area.longitude
                        },
                        predictedHeatIndex:
                            prediction.predicted_environmental_heat_index_c,
                        riskLevel: prediction.category,
                        matchedCoordinates:
                            prediction.matched_coordinates,
                        time: prediction.time
                    };
                } catch (error) {
                    return {
                        neighbourhoodId: area._id,
                        name: area.name,
                        coordinates: {
                            latitude: area.latitude,
                            longitude: area.longitude
                        },
                        success: false,
                        message: "Prediction unavailable"
                    };
                }
            })
        );

        return res.status(200).json({
            success: true,
            count: results.length,
            time,
            data: results
        });

    } catch (error) {
        console.error("Neighbourhood predictions error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to get neighbourhood predictions"
        });
    }
};
module.exports = { analyseHeatRisk, getNeighbourhoodHeatPredictions};