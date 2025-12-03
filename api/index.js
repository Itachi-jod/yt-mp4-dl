const axios = require("axios");
const qs = require("qs");

module.exports = async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res
        .status(400)
        .json({ success: false, message: "No URL provided" }, null, 2);
    }

    // Prepare x-www-form-urlencoded data
    const formData = qs.stringify({ url: videoUrl });

    const response = await axios.post(
      "https://socialfans.jo/get_social_video.php",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json, text/javascript, */*;q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
          Origin: "https://socialfans.io",
          Referer: "https://socialfans.jo/free-youtube-video-downloader",
          Cookie:
            "c_session-mkkj3pod9lposv@sh5cmhoa/5568150; csrf_cookie-23be5951b15b2615da626d4187593ad2"
        }
      }
    );

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    // Pretty print JSON
    res.status(200).send(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Download API Error:", error?.response?.data || error);
    res.status(500).json({ success: false, message: "Failed to fetch video" }, null, 2);
  }
};
