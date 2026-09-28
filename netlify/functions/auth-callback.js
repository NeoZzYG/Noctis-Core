import { v2 } from "./lib/v2.mjs";
import fonction from "./lib/handlers/auth-callback.cjs";

export default v2(fonction.handler);
