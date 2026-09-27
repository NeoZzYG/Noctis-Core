const { getSession } = require("./lib/session");

exports.handler = async (event) => {
  const session = getSession(event);
  return {
    statusCode: session ? 200 : 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ user: session || null }),
  };
};
