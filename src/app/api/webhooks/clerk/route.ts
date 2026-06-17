import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { upsertUserFromClerk, deleteUserByClerkId } from "@/lib/db/users";

/**
 * Clerk → Supabase user sync webhook.
 *
 * Verifies the svix signature using CLERK_WEBHOOK_SECRET, then mirrors Clerk
 * users into the Supabase `users` table on create/update and removes them on
 * delete. Returns 400 on verification failure, 200 on success.
 *
 * Configure in the Clerk Dashboard → Webhooks with endpoint
 * /api/webhooks/clerk subscribed to user.created, user.updated, user.deleted.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  let evt: WebhookEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url } =
          evt.data;
        const primaryEmail =
          email_addresses.find((e) => e.id === primary_email_address_id)
            ?.email_address ?? email_addresses[0]?.email_address;

        if (!primaryEmail) {
          console.error(`Clerk user ${id} has no email address`);
          return new Response("No email on user", { status: 400 });
        }

        await upsertUserFromClerk({
          clerk_id: id,
          email: primaryEmail,
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          avatar_url: image_url ?? null,
        });
        break;
      }
      case "user.deleted": {
        if (evt.data.id) {
          await deleteUserByClerkId(evt.data.id);
        }
        break;
      }
      default:
        // Ignore other event types.
        break;
    }
  } catch (err) {
    console.error("Clerk webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
