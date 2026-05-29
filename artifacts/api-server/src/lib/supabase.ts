import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env["VITE_SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn("Supabase credentials missing — VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseServiceKey ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
