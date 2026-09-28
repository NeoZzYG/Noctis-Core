// Adaptateur : fait tourner nos fonctions au format "moderne" de Netlify
// (nécessaire pour que le stockage renvoie toujours la dernière version enregistrée)
export function v2(handler) {
  return async (req, context) => {
    const url = new URL(req.url);
    const event = {
      httpMethod: req.method,
      headers: Object.fromEntries(req.headers),
      queryStringParameters: Object.fromEntries(url.searchParams),
      body: req.method === "GET" || req.method === "HEAD" ? null : await req.text(),
      rawUrl: req.url,
    };
    const r = await handler(event, context);
    const headers = new Headers();
    for (const [k, v] of Object.entries(r.headers || {})) headers.append(k, v);
    for (const [k, vs] of Object.entries(r.multiValueHeaders || {})) for (const v of vs) headers.append(k, v);
    let body = r.body == null || r.body === "" ? null : r.body;
    if (body && r.isBase64Encoded) body = Buffer.from(body, "base64");
    return new Response(body, { status: r.statusCode || 200, headers });
  };
}
