const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

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

    // Required browser-like headers ONLY
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": "https://devoice.io",
      "Referer": "https://devoice.io/",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
    };

    // Backend will send the required POST request
    const body = { url: videoUrl };

    const upstream = await axios.post(apiUrl, body, {
      headers,
      timeout: 20000,
      validateStatus: () => true
    });

    if (upstream.status !== 200) {
      return res.status(500).json({
        success: false,
        author: "ItachiXD",
        message: "Upstream request failed",
        upstream_status: upstream.status,
        upstream_message: upstream.data
      });
    }

    return res.json({
      success: true,
      author: "ItachiXD",
      data: upstream.data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      author: "ItachiXD",
      message: "Internal server error",
      error: err.message
    });
  }
});

module.exports = app;
