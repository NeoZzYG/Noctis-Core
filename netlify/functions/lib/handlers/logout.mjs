import { cookie, SESSION_COOKIE } from "../session.mjs";

export const handler = async () => ({
  statusCode: 302,
  headers: { Location: "/connexion.html", "Set-Cookie": cookie(SESSION_COOKIE, "", 0) },
});
