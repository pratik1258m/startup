/**
 * Netlify Function: referrals
 * 
 * Serverless backend for managing and tracking cohort referrals in real-time.
 * Uses a free, zero-config, serverless-safe JSON storage (kvdb.io)
 * to persist and retrieve stats across different users and devices.
 */

const DB_URL = "https://kvdb.io/mb_cohort_ref_db_prakash7/referrals";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    // -------------------------------------------------------------
    // GET /api/referrals?query=XXX - Lookup Ambassador Statistics
    // -------------------------------------------------------------
    if (event.httpMethod === "GET") {
      const query = (event.queryStringParameters.query || "").trim().toUpperCase();
      if (!query) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Query parameter is required" })
        };
      }

      // Fetch database
      let db = {};
      try {
        const response = await fetch(DB_URL);
        if (response.ok) {
          db = await response.json();
        }
      } catch (err) {
        console.warn("Could not read from database, returning empty/not found:", err);
      }

      // Search by exact referral code or by registered name
      let ambassador = db[query];
      let ambassadorCode = query;

      if (!ambassador) {
        // Try searching by name (case-insensitive)
        const matchedEntry = Object.entries(db).find(([code, data]) => {
          return data.name && data.name.toUpperCase() === query;
        });
        if (matchedEntry) {
          ambassadorCode = matchedEntry[0];
          ambassador = matchedEntry[1];
        }
      }

      if (ambassador) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            found: true,
            code: ambassadorCode,
            name: ambassador.name,
            count: ambassador.count || 0,
            referrals: ambassador.referrals || []
          })
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            found: false,
            message: "No ambassador registered under this name or code yet."
          })
        };
      }
    }

    // -------------------------------------------------------------
    // POST /api/referrals - Register New User and Process Referrals
    // -------------------------------------------------------------
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { name, code, referrerCode } = body;

      if (!name || !code) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Name and generated code are required" })
        };
      }

      const normalizedCode = code.trim().toUpperCase();
      const normalizedReferrerCode = (referrerCode || "").trim().toUpperCase();

      // Fetch database
      let db = {};
      try {
        const response = await fetch(DB_URL);
        if (response.ok) {
          db = await response.json();
        }
      } catch (err) {
        console.log("Database initialized for first-time use");
      }

      // 1. Create or update the registered user's entry
      if (!db[normalizedCode]) {
        db[normalizedCode] = {
          name: name.trim(),
          count: 0,
          referrals: []
        };
      } else {
        // If already exists, update name if changed
        db[normalizedCode].name = name.trim();
      }

      // 2. Process referral linkage if referrerCode is present and valid
      if (normalizedReferrerCode && normalizedReferrerCode !== normalizedCode) {
        // Check if referrer exists in the database
        if (!db[normalizedReferrerCode]) {
          // Self-healing: create the referrer entry dynamically so they don't lose the referral
          const rawName = normalizedReferrerCode.replace("MISSION-", "").replace(/[0-9]/g, "");
          const formattedName = rawName ? rawName.charAt(0) + rawName.slice(1).toLowerCase() : "Ambassador";
          db[normalizedReferrerCode] = {
            name: formattedName,
            count: 0,
            referrals: []
          };
        }

        // Check if this user was already registered under their referrals to prevent duplicate counting
        const alreadyReferred = db[normalizedReferrerCode].referrals.some(refName => refName.toUpperCase() === name.toUpperCase());
        if (!alreadyReferred) {
          db[normalizedReferrerCode].count += 1;
          db[normalizedReferrerCode].referrals.push(name.trim());
        }
      }

      // Save database back to serverless store
      const saveResponse = await fetch(DB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(db)
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save database: ${saveResponse.statusText}`);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "User and referral processed successfully",
          user: db[normalizedCode]
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Method not allowed" })
    };

  } catch (error) {
    console.error("Error in referrals function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error during referral operation"
      })
    };
  }
};
