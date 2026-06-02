import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { userId } = context as { userId: string };
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin", "moderator"])
      .eq("is_active", true);
    if (!data?.length) throw new Error("Forbidden: admin only");
    return next({ context: { adminId: userId } });
  });

export const askQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      product_id: z.string().uuid(),
      question: z.string().trim().min(3).max(1000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { data: u } = await supabaseAdmin
      .from("users")
      .select("full_name,email")
      .eq("id", userId)
      .maybeSingle();
    const name = (u as any)?.full_name || ((u as any)?.email ? String((u as any).email).split("@")[0] : "User");
    const { error } = await supabaseAdmin.from("product_questions").insert({
      product_id: data.product_id,
      user_id: userId,
      user_name: name,
      question: data.question,
    } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const answerQuestion = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      answer: z.string().trim().min(1).max(2000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { adminId } = context as { adminId: string };
    const { error } = await supabaseAdmin
      .from("product_questions")
      .update({
        answer: data.answer,
        answered_at: new Date().toISOString(),
        answered_by: adminId,
      } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("product_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
