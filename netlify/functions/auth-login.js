import { v2 } from "./lib/v2.mjs";
import { handler } from "./lib/handlers/auth-login.mjs";

export default v2(handler);
