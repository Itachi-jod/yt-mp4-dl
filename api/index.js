// Author: ItachiXD

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const qs = require("querystring");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pretty print
function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

// Root
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(
    pretty({
      author: "ItachiXD",
      status: "SocialFans Video Downloader API Running...",
      usage: "/api/download?url=VIDEO_URL"
    })
  );
});

// Main GET API (with cookie)
app.get("/api/download", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).send(
      pretty({
        author: "ItachiXD",
        success: false,
        error: "Missing ?url="
      })
    );
  }

  try {
    const postData = qs.stringify({
      url: videoUrl
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      "Origin": "https://socialfans.io",
      "Referer": "https://socialfans.io/free-youtube-video-downloader",
      "X-Requested-With": "XMLHttpRequest",
      "Cookie": "c_session-mkkj3pod9lposv@sh5cmhoa/5568150 csrf_cookie-23be5951b15b2615da626d4187593ad2"
    };

    const apiRes = await axios.post(
      "https://socialfans.io/get_social_video.php",
      postData,
      { headers }
    );

    res.setHeader("Content-Type", "application/json");
    return res.send(
      pretty({
        author: "ItachiXD",
        success: true,
        data: apiRes.data
      })
    );
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);

    res.setHeader("Content-Type", "application/json");
    return res.status(500).send(
      pretty({
        author: "ItachiXD",
        success: false,
        error: "Failed to fetch video",
        details: err.response?.data || err.message
      })
    );
  }
});

module.exports = app;
