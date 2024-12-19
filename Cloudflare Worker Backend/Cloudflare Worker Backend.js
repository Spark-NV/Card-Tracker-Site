export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    const allowedOrigins = [
      "yoursite3.com",
      "yoursite2.com",
      "yoursite1.com",
    ];

    const origin = req.headers.get("Origin");

    const corsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    } else {
      corsHeaders["Access-Control-Allow-Origin"] = "null";
    }

    let userAuthorized = false;

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (path === "/getCollection") {
      try {
          const response = await getCollection(req, env);
          return new Response(response, {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      } catch (error) {
          return new Response("Error fetching collection", { 
            status: 500, 
            headers: corsHeaders 
          });
      }
    } else if (path === "/updateCollection") {
      try {
          const authHeader = req.headers.get("Authorization");
  
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
              return new Response(
                  JSON.stringify({ error: "Unauthorized: Missing or invalid token" }),
                  { 
                    status: 401, 
                    headers: { ...corsHeaders, "Content-Type": "application/json" 
                  } 
              });
          }
  
          const token = authHeader.split(" ")[1];
          const userData = await verifyToken(token, env);
          if (!userData || !userData.email) {
              return new Response(
                  JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
                  { 
                    status: 401, 
                    headers: { ...corsHeaders, "Content-Type": "application/json" 
                  } 
              });
          }
  
          console.log(`Authorized request by user: ${userData.email}`);
  
          const response = await updateCollection(req, env, userData.email);
  
          return new Response(JSON.stringify(response), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      } catch (error) {
          console.error("Error in /updateCollection:", error);
          return new Response(
              JSON.stringify({ error: "Error updating collection" }),
              { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" 
              } 
          });
      }
    } else if (path === "/authorize" && req.method === "POST") {
      try {
          const body = await req.json();
          const verificationResult = await verifyToken(body.credential);
          return new Response(JSON.stringify(verificationResult), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      } catch (error) {
          console.error("Authorization error:", error);
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: corsHeaders,
          });
      }
    } else {
      return new Response("Not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }
  }
};

async function getCollection(req, env) {
  try {
    const cards = await env.D1_TABLE.prepare(
      "SELECT card_id, collected, price, grade, date FROM collection"
    ).all();
    return JSON.stringify(cards.results);
  } catch (error) {
    console.error("Error fetching collection:", error);
    throw new Error("Failed to fetch collection");
  }
}

async function updateCollection(req, env) {
  const { card_id, collected, price, grade, date } = await req.json();

  try {
    const existingEntry = await env.D1_TABLE
      .prepare("SELECT * FROM collection WHERE card_id = ?")
      .bind(card_id)
      .first();

    if (existingEntry) {
      await env.D1_TABLE
        .prepare("UPDATE collection SET collected = ?, price = ?, grade = ?, date = ? WHERE card_id = ?")
        .bind(collected, price, grade, date, card_id)
        .run();
    } else {
      await env.D1_TABLE
        .prepare("INSERT INTO collection (card_id, collected, price, grade, date) VALUES (?, ?, ?, ?, ?)")
        .bind(card_id, collected, price, grade, date)
        .run();
    }

    return JSON.stringify({ message: "Collection updated successfully" });
  } catch (error) {
    console.error("Error updating collection:", error);
    throw new Error("Failed to update collection");
  }
}

async function verifyToken(token) {
  const GOOGLE_API_URL = "https://oauth2.googleapis.com/tokeninfo";

  try {
    const response = await fetch(`${GOOGLE_API_URL}?id_token=${token}`);
    if (!response.ok) {
      console.error("Token verification failed:", response.status, response.statusText);
      throw new Error("Invalid token");
    }

    const data = await response.json();

    const authorizedEmails = ["youremail@youremail.com"];
    const isAuthorized = authorizedEmails.includes(data.email);

    return {
      authorized: isAuthorized,
      email: data.email,
    };
  } catch (error) {
    console.error("Error during token verification:", error);
    throw new Error("Failed to verify token");
  }
}