import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  email: z.string().email(),
});

export const subscribeBackInStock = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => subSchema.parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { error } = await supabase.from("stock_notifications").insert({
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
      email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
