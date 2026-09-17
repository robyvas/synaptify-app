const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQFWTRTVzfq_-Pxucm9ZZeKOdZXrP1-ANit_U6W8fGB0nes4Gs3dZqqpwXU7PaOYMC/exec";

export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  
  // LOG pentru debug în Cloudflare Dashboard
  console.log(`Request received: ${request.method} ${url.pathname}`);

  // 1. Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    const fetchOptions: any = {
      method: request.method,
      redirect: "follow",
    };

    if (request.method === "POST") {
      const bodyText = await request.text();
      fetchOptions.body = bodyText;
      fetchOptions.headers = { 
        "Content-Type": "text/plain", // GAS preferă text/plain pentru a evita preflight
      };
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, fetchOptions);
    
    // Verificăm dacă răspunsul este valid
    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error("Google Script did not return valid JSON");
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error(`API Error: ${error.message}`);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
