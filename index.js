const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// Pretty-print helper
function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

// Upstream base
const UPSTREAM_BASE = "https://vapi.extensiondock.com/api/youtube/v4/info";

// NOTE: these values are taken from your network trace.
// The service may require a correct 'sign' computed for each request.
// I keep SIGN and SECRET here as provided — if upstream validates signatures,
// you'll need to compute the sign according to their algorithm.
const DEFAULT_SIGN = "XLrcPZ2vBzUmya&TaEZHICJD2ASK19XGHWSG9AmIDAGaChMgL6OmEhy400%2B%2BrxFXUqPJzyxVOMISYOUFMST4afzodQQch%2F";
const DEFAULT_SECRET = "dRSdQh7dPCwZ1fjNgzKnoA4pJ0q26TtYo%2FIVuexxKSvMnI8SDLJaCILGHlkanGwHukritWqr95ygJRAKSI%2Fk%2BzMy%2BairwpPzon5GrJ%2BWgKwffR4uealRM5y5HPjR9B%u0c%2FIRBNyKIEHPnySharicloOPwE7ITSNULT3EY%3D";

// Build query string helper (encodes values)
function buildQuery(params) {
  return Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
}

function makeNonce() {
  // fallback to random hex if crypto.randomUUID unavailable
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
}

// Root
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(pretty({ status: "YouTube proxy (extensiondock) is running", author: "ItachiXD" }));
});

// /api/download?url=...
app.get("/api/download", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const userUrl = req.query.url;
  if (!userUrl) {
    return res.status(400).send(pretty({ success: false, message: "Missing ?url= parameter" }));
  }

  try {
    // dynamic timestamp and nonce (these may be required by the upstream)
    const t = Math.floor(Date.now() / 1000);
    const nonce = makeNonce();

    // If you want to compute sign properly, implement the algorithm and replace DEFAULT_SIGN.
    const sign = DEFAULT_SIGN; // if upstream needs real sign, compute here
    const secret_key = DEFAULT_SECRET;

    // Build final upstream URL (query params copied/derived from your trace)
    const qs = buildQuery({
      app_id: "ai_devoice",
      t,
      nonce,
      sign,
      // include secret_key if upstream expects it in query (copied from trace)
      secret_key
    });
    const upstreamUrl = `${UPSTREAM_BASE}?${qs}`;

    // Headers copied/derived from your trace
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/json",
      Origin: "https://devoice.io",
      Referer: "https://devoice.io/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      // UA from your trace
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      // optional – sometimes helpful
      "X-Requested-With": "XMLHttpRequest"
    };

    // Upstream expects POST per your trace. We'll send POST with JSON body containing the target url.
    const bodyPayload = {
      url: userUrl
    };

    const upstreamRes = await axios.post(upstreamUrl, bodyPayload, { headers, timeout: 30000 });

    const upstreamData = upstreamRes.data;

    // Try to extract a usable mp4 download link
    // The structure can vary. We'll attempt a few common paths.
    let download_url = null;

    // Option A: nested formats / links
    if (!download_url) {
      const tryPaths = [
        // common nesting patterns
        upstreamData?.data?.data?.links,
        upstreamData?.data?.links,
        upstreamData?.links,
        upstreamData?.data?.formats,
        upstreamData?.data
      ];

      for (const p of tryPaths) {
        if (Array.isArray(p)) {
          // try find mp4 or best quality
          const mp4 = p.find((item) =>
            (item.type && item.type.toLowerCase().includes("video")) ||
            (item.extension && item.extension.toLowerCase() === "mp4") ||
            (item.download_url && item.download_url.includes(".mp4"))
          );
          if (mp4 && (mp4.download_url || mp4.url)) {
            download_url = mp4.download_url || mp4.url;
            break;
          }
        }
      }
    }

    // Option B: direct url fields
    if (!download_url) {
      download_url =
        upstreamData?.data?.url ||
        upstreamData?.data?.video ||
        upstreamData?.url ||
        upstreamData?.video ||
        null;
    }

    // If download_url found, return compact single-url response as requested
    if (download_url) {
      return res.send(
        pretty({
          success: true,
          author: "ItachiXD",
          platform: "YouTube",
          download_url
        })
      );
    }

    // Fallback: return full upstream payload so user can inspect
    return res.send(
      pretty({
        success: upstreamData?.success ?? true,
        author: "ItachiXD",
        upstream: upstreamData
      })
    );
  } catch (err) {
    // include upstream body when available for debugging
    const upstream = err.response?.data || null;
    return res.status(500).send(
      pretty({
        success: false,
        author: "ItachiXD",
        message: "Upstream request failed",
        error: err.message,
        upstream
      })
    );
  }
});

// Start server locally (Vercel will ignore this)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YouTube proxy running on port ${PORT}`);
});

module.exports = app;
