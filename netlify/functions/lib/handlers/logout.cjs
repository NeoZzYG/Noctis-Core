const { cookie, SESSION_COOKIE } = require("../session.cjs");

exports.handler = async () => ({
  statusCode: 302,
  headers: { Location: "/connexion.html", "Set-Cookie": cookie(SESSION_COOKIE, "", 0) },
});
