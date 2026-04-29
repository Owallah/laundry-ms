import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated admin/manager
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || !["admin", "manager"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { full_name, email, phone, role, password } = body;

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use service role to create user (bypasses email confirmation)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: newUser, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr) throw createErr;

    // Upsert profile — the auto-profile trigger may have already inserted a row
    // the moment auth.user was created, so we use upsert to safely overwrite it
    // with the correct full_name, phone and role supplied by the form.
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert(
        { id: newUser.user.id, full_name, phone: phone || null, role },
        { onConflict: "id" }
      );

    if (profileErr) throw profileErr;

    return NextResponse.json({ message: "Staff member created", id: newUser.user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
