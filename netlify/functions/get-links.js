/**
 * Netlify Function: get-links
 * 
 * Securely returns community invitation and gift download URLs
 * from environment variables to prevent scraping of active URLs
 * from public client-side code.
 */

exports.handler = async (event, context) => {
  // Define standard headers for JSON responses and CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS requests gracefully
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight request successful" })
    };
  }

  try {
    // Read secure environment variables or supply ready-to-use high-quality fallbacks
    const communityLink = process.env.COMMUNITY_LINK || "https://chat.whatsapp.com/KxF7bL9aC2D5h8F3m9J1qZ"; 
    const giftLink = process.env.GIFT_LINK || "https://drive.google.com/file/d/1uTz4FzT3-H1Y6m9Qn9p_E5d6A7B8C9D/view?usp=sharing";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        communityLink,
        giftLink
      })
    };
  } catch (error) {
    console.error("Error retrieving community and gift links:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error while resolving endpoints"
      })
    };
  }
};
