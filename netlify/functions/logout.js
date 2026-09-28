const { cookie, SESSION_COOKIE } = require("./lib/session");

exports.handler = async () => ({
  statusCode: 302,
  headers: { Location: "/connexion.html", "Set-Cookie": cookie(SESSION_COOKIE, "", 0) },
});
