// Affichage des images envoyées depuis l'espace admin
const { store } = require("../store.cjs");

exports.handler = async (event) => {
  const k = ((event.queryStringParameters || {}).k || "").replace(/[^a-z0-9.]/gi, "");
  if (!k) return { statusCode: 404, body: "" };
  const res = await store(event).getWithMetadata(`img/${k}`, { type: "arrayBuffer" });
  if (!res) return { statusCode: 404, body: "" };
  return {
    statusCode: 200,
    headers: { "Content-Type": res.metadata.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    body: Buffer.from(res.data).toString("base64"),
    isBase64Encoded: true,
  };
};
