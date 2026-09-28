import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "";
const SESSION_COOKIE = "nc_session";
const STATE_COOKIE = "nc_state";

function hmac(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

function sign(payload, maxAgeSec) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  return `${body}.${hmac(body)}`;
}

function verify(token) {
  if (!token || !SECRET) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(hmac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function cookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

function getSession(event) {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  return verify(cookies[SESSION_COOKIE]);
}

export { sign, verify, parseCookies, cookie, getSession, SESSION_COOKIE, STATE_COOKIE };
