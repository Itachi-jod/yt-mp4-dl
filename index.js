const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        author: "ItachiXD",
        message: "Missing ?url parameter"
      });
    }

    const apiUrl = "https://vapi.extensiondock.com/api/youtube/v4/info";

    // Only send required headers. No garbage.
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": "https://devoice.io",
      "Referer": "https://devoice.io/",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
    };

    // Build minimal body EXACTLY like the real request
    const body = {
      url: videoUrl
    };

    // Forward request
    const upstream = await axios.post(apiUrl, body, {
      headers,
      timeout: 15000,
      validateStatus: () => true
    });

    if (upstream.status !== 200) {
      return res.status(500).json({
        success: false,
        author: "ItachiXD",
        message: "Upstream request failed",
        status: upstream.status,
        data: upstream.data
      });
    }

    res.json({
      success: true,
      author: "ItachiXD",
      data: upstream.data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      author: "ItachiXD",
      message: "Server error",
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server running...");
});
