import { requireSupabaseAdmin } from "@/lib/supabase";

export interface Subscriber {
  id: string;
  email: string;
  status: "active" | "unsubscribed" | "bounced";
  createdAt: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  status: "active" | "unsubscribed" | "bounced";
  created_at: string;
}

function mapSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function upsertSubscriber(email: string): Promise<Subscriber> {
  const supabase = requireSupabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("subscribers")
    .upsert(
      { email: normalizedEmail, status: "active" },
      { onConflict: "email" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapSubscriber(data as SubscriberRow);
}
