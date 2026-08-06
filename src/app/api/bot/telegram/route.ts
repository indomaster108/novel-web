import { NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram-bot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/bot/telegram
 * Webhook handler for Telegram updates.
 */
export async function POST(req: Request) {
  try {
    const body: TelegramUpdate = await req.json();
    
    // Process update asynchronously in server runtime
    await handleTelegramUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Always return 200 OK so Telegram doesn't loop infinite retries on invalid payloads
    return NextResponse.json({ ok: true, note: "Handled with recovery" });
  }
}

/**
 * GET /api/bot/telegram
 * Health verification endpoint for SecOps and monitor uptime.
 */
export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Ruang Aksara Pocket Bot Webhook",
    message: "Endpoint siap menerima sinyal dari pusat komando Telegram.",
  });
}
