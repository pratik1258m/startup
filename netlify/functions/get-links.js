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
    const communityLink = process.env.COMMUNITY_LINK || "https://chat.whatsapp.com/Fvle1AqA2IuFMrRCN89IA2"; 
    const giftLink = process.env.GIFT_LINK || "https://drive.google.com/drive/folders/109vVuWoOWRovIJgkgN_C1LP9TPI2sxVA?usp=sharing";

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
