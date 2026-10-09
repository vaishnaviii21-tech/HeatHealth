const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const Neighbourhood = require("../models/Neighbourhood");
const { analyseHeatRisk } = require("../controllers/heatController");

// GET API: Retrieve all neighbourhoods
router.get("/neighbourhoods", isAuthenticated, async (req, res) => {
    try {
        const neighbourhoods = await Neighbourhood.find();

        res.status(200).json({
            success: true,
            count: neighbourhoods.length,
            data: neighbourhoods
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch neighbourhoods",
            error: error.message
        });
    }
});
// POST API: Add a new neighbourhood
router.post("/neighbourhoods", isAuthenticated, async (req, res) => {
    try {
        const { name, city, latitude, longitude } = req.body;

        const neighbourhood = new Neighbourhood({
            name,
            city,
            latitude,
            longitude
        });

        const savedNeighbourhood = await neighbourhood.save();

        res.status(201).json({
            success: true,
            message: "Neighbourhood added successfully!",
            data: savedNeighbourhood
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to add neighbourhood",
            error: error.message
        });
    }
});

router.post("/heat-analysis", isAuthenticated, analyseHeatRisk);

module.exports = router;