const express = require("express");
require("dotenv").config({ path: __dirname + "/.env" });
const connectDB = require("./config/db");
const session = require("express-session");
const passport = require("passport");
const axios = require("axios");


const heatRoutes = require("./routes/heatRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "heathealth-dev-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60
        }
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Load Passport configuration
require("./config/passport")(passport);

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.json());


app.use("/api", heatRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/area", (req, res) => {
    res.render("area");
});

app.get("/city", (req, res) => {
    res.render("city", {
        selectedCity: "Pune, Maharashtra"
    });
});
app.use(express.urlencoded({ extended: true }));

app.post("/city", (req, res) => {
    const selectedCity = req.body.city;

    res.redirect("/area?city=" + encodeURIComponent(selectedCity));
});

app.get("/map", (req, res) => {
    res.render("map");
});

app.get("/analysis", async (req, res) => {
    const selectedArea = req.query.area || "Shivajinagar";
    const city = req.query.city || "Pune, Maharashtra";

    // Coordinates for the selected area
    const areaCoordinates = {
        "Shivajinagar": { latitude: 18.5308, longitude: 73.8475 },
        "Aundh": { latitude: 18.5580, longitude: 73.8075 },
        "Yerawada": { latitude: 18.5515, longitude: 73.8790 },
        "Deccan": { latitude: 18.5160, longitude: 73.8410 },
        "Camp": { latitude: 18.5130, longitude: 73.8790 },
        "Kothrud": { latitude: 18.5074, longitude: 73.8077 },
        "Hadapsar": { latitude: 18.5089, longitude: 73.9260 },
        "Hinjawadi": { latitude: 18.5913, longitude: 73.7389 },
        "Koregaon Park": { latitude: 18.5362, longitude: 73.8939 },
        "Pune Station": { latitude: 18.5289, longitude: 73.8744 },
        "Swargate": { latitude: 18.5018, longitude: 73.8636 },
        "Baner": { latitude: 18.5590, longitude: 73.7868 },
        "Wakad": { latitude: 18.5990, longitude: 73.7626 },
        "Katraj": { latitude: 18.4529, longitude: 73.8652 }
    };

    const coordinates =
        areaCoordinates[selectedArea] || areaCoordinates["Shivajinagar"];

    try {
        // Call the Python Random Forest API
        const pythonResponse = await axios.post(
            "http://127.0.0.1:8000/predict-location",
            {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                time: req.query.time || "2026-10-10 12:00:00"
            }
        );

        const prediction = pythonResponse.data;

        if (!prediction.success) {
            throw new Error(
                prediction.message || "Prediction could not be generated"
            );
        }

        const environmentalData = prediction.environmental_data;

        // Show the model's predicted environmental heat index
        res.render("analysis", {
            selectedArea,
            city,

            riskLevel: prediction.category,

            temperature: `${environmentalData.temperature_2m} °C`,
            humidity: `${environmentalData.relative_humidity_2m}%`,
            landSurfaceTemp: `${environmentalData.surface_temp_c} °C`,

            vegetation: `NDVI: ${environmentalData.NDVI}`,
            vulnerability: "Not available",
            aqi: "Not available",

            // Additional values from the model
            predictedHeatIndex:
                `${prediction.predicted_environmental_heat_index_c} °C`,

            apparentTemperature:
                `${environmentalData.apparent_temperature} °C`,

            windSpeed:
                `${environmentalData.wind_speed_10m} km/h`,

            wetBulbTemperature:
                `${environmentalData.wet_bulb_temperature_2m} °C`,

            predictionTime: prediction.time,
            matchedCoordinates: prediction.matched_coordinates,

            factors: [
                `Predicted environmental heat index: ${prediction.predicted_environmental_heat_index_c} °C.`,
                `Air temperature: ${environmentalData.temperature_2m} °C.`,
                `Relative humidity: ${environmentalData.relative_humidity_2m}%.`,
                `Wind speed: ${environmentalData.wind_speed_10m} km/h.`
            ],

            precautions: [
                "Prioritize shaded public areas.",
                "Provide drinking water and hydration facilities.",
                "Identify locations for additional greenery.",
                "Use official weather and heat-health alerts for safety decisions."
            ]
        });

    } catch (error) {
        console.error(
            "Analysis page error:",
            error.response?.data || error.message
        );

        // Keep the page available if the prediction service is unavailable
        res.render("analysis", {
            selectedArea,
            city,

            riskLevel: "Unavailable",
            temperature: "Not available",
            humidity: "Not available",
            landSurfaceTemp: "Not available",
            vegetation: "Not available",
            vulnerability: "Not available",
            aqi: "Not available",

            predictedHeatIndex: "Not available",
            apparentTemperature: "Not available",
            windSpeed: "Not available",
            wetBulbTemperature: "Not available",
            predictionTime: "Not available",
            matchedCoordinates: null,

            factors: [
                "The Python prediction service could not provide a result.",
                "Check whether the Python API is running."
            ],

            precautions: [
                "Check official weather and heat-health alerts."
            ]
        });
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/admin-login", (req, res) => {
    res.render("admin-login");
});

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();

