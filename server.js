const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const Url = require("./models/Url");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

function generateShortCode() {
    return Math.random().toString(36).substring(2, 8);
}

app.get("/", (req, res) => {
    res.json({
        message: "URL Shortener API is running!"
    });
});

app.post("/api/shorten", async (req, res) => {
    try {
        const { originalUrl } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                message: "originalUrl is required"
            });
        }

        try {
            new URL(originalUrl);
        } catch {
            return res.status(400).json({
                message: "Please provide a valid URL"
            });
        }

        let shortCode;
        let existingUrl;

        do {
            shortCode = generateShortCode();

            existingUrl = await Url.findOne({
                shortCode: shortCode
            });

        } while (existingUrl);

        const url = await Url.create({
            originalUrl: originalUrl,
            shortCode: shortCode
        });

        res.status(201).json({
            message: "URL shortened successfully",
            originalUrl: url.originalUrl,
            shortCode: url.shortCode,
            shortUrl: `http://localhost:${PORT}/${url.shortCode}`
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

app.get("/api/urls/:shortCode", async (req, res) => {
    try {
        const url = await Url.findOne({
            shortCode: req.params.shortCode
        });

        if (!url) {
            return res.status(404).json({
                message: "Short URL not found"
            });
        }

        res.json({
            originalUrl: url.originalUrl,
            shortCode: url.shortCode,
            shortUrl: `http://localhost:${PORT}/${url.shortCode}`,
            clicks: url.clicks,
            createdAt: url.createdAt
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

app.get("/:shortCode", async (req, res) => {
    try {
        const url = await Url.findOneAndUpdate(
            {
                shortCode: req.params.shortCode
            },
            {
                $inc: {
                    clicks: 1
                }
            },
            {
                new: true
            }
        );

        if (!url) {
            return res.status(404).json({
                message: "Short URL not found"
            });
        }

        res.redirect(url.originalUrl);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log(
            "MongoDB connection error:",
            error.message
        );
    });

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});