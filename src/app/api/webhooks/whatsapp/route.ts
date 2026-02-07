import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";

// Verify Meta Webhook (GET)
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const workflowId = url.searchParams.get("workflowId");

        // Check if mode and token exist
        if (mode && token) {
            if (mode === "subscribe" && token === workflowId) {
                console.log("Meta Webhook Verified!");
                return new NextResponse(challenge, { status: 200 });
            } else {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    } catch (error) {
        console.error("Meta verification error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Handle Incoming Messages (POST)
export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const workflowId = url.searchParams.get("workflowId");

        if (!workflowId) {
            return NextResponse.json(
                { error: "Missing required query parameter: workflowId" },
                { status: 400 }
            );
        }

        // Clone request to read body safely if needed multiple times
        const bodyText = await request.text();
        const contentType = request.headers.get("content-type") || "";

        let payload: any = {};

        // Detect Provider and Parse Body
        if (contentType.includes("application/json")) {
            // Likely Meta (JSON)
            try {
                payload = JSON.parse(bodyText);
            } catch (e) {
                return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
            }
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            // Likely Twilio (Form Data)
            const params = new URLSearchParams(bodyText);
            const entries: Record<string, string> = {};
            for (const [key, value] of params.entries()) {
                entries[key] = value;
            }
            payload = entries;
        }

        // Normalize Data
        let triggerData = null;

        // Check if it's Twilio
        if (payload.SmsMessageSid || payload.MessageSid) {
            triggerData = {
                provider: "twilio",
                from: payload.From?.replace("whatsapp:", "") || "",
                body: payload.Body || "",
                senderName: payload.ProfileName || "Unknown",
                raw: payload
            };
        }
        // Check if it's Meta
        else if (payload.object === "whatsapp_business_account") {
            const entry = payload.entry?.[0];
            const change = entry?.changes?.[0];
            const message = change?.value?.messages?.[0];
            const contact = change?.value?.contacts?.[0];

            if (message) {
                triggerData = {
                    provider: "meta",
                    from: message.from || "",
                    body: message.text?.body || "", // Only supporting text for now
                    senderName: contact?.profile?.name || "Unknown",
                    raw: payload
                };
            }
        }

        if (triggerData) {
            await sendWorkflowExecution({
                workflowId,
                initialData: {
                    whatsapp: triggerData,
                }
            });

            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            // Not a message we care about (e.g. status update), but return 200 to keep provider happy
            return NextResponse.json({ success: true, ignored: true }, { status: 200 });
        }

    } catch (error) {
        console.error("WhatsApp webhook error", error);
        return NextResponse.json(
            { success: false, error: "Failed to process WhatsApp message" },
            { status: 500 }
        );
    }
}
