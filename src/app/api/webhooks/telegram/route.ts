import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";

// Handle Incoming Telegram Messages (POST)
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

        // Parse Telegram webhook payload
        const payload = await request.json();

        // Telegram sends updates with this structure
        // https://core.telegram.org/bots/api#update
        const message = payload.message;

        if (!message) {
            // Not a message update (could be edited_message, channel_post, etc.)
            // Return 200 to acknowledge receipt
            return NextResponse.json({ success: true, ignored: true }, { status: 200 });
        }

        // Extract message data
        const triggerData = {
            chatId: message.chat.id,
            text: message.text || "",
            username: message.from.username || "",
            firstName: message.from.first_name || "",
            lastName: message.from.last_name || "",
            messageId: message.message_id,
            date: message.date,
            raw: payload
        };

        // Send to Inngest workflow
        await sendWorkflowExecution({
            workflowId,
            initialData: {
                telegram: triggerData,
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Telegram webhook error", error);
        return NextResponse.json(
            { success: false, error: "Failed to process Telegram message" },
            { status: 500 }
        );
    }
}
