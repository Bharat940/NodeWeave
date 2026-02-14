import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";

// Normalized email data structure passed to workflows
interface EmailTriggerData {
    provider: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    html: string;
    cc: string;
    replyTo: string;
    date: string;
    messageId: string;
    attachments: Array<{ filename: string; contentType: string; size?: number }>;
    raw: Record<string, unknown>;
}

/**
 * Normalize email data from various provider formats into a consistent structure.
 * Supports: Resend, Mailgun, SendGrid, Postmark, and generic/cURL payloads.
 */
function normalizeEmailPayload(payload: Record<string, any>): EmailTriggerData | null {
    // ── Resend Inbound ──
    // Format: { type: "email.received", data: { from, to, subject, text, html, ... } }
    if (payload.type === "email.received" && payload.data) {
        const d = payload.data;
        return {
            provider: "resend",
            from: d.from || "",
            to: Array.isArray(d.to) ? d.to.join(", ") : (d.to || ""),
            subject: d.subject || "",
            body: d.text || d.plain_text || "",
            html: d.html || "",
            cc: Array.isArray(d.cc) ? d.cc.join(", ") : (d.cc || ""),
            replyTo: d.reply_to || d.replyTo || "",
            date: d.created_at || d.date || "",
            messageId: d.message_id || "",
            attachments: Array.isArray(d.attachments)
                ? d.attachments.map((a: any) => ({
                    filename: a.filename || a.name || "",
                    contentType: a.content_type || a.type || "",
                    size: a.size,
                }))
                : [],
            raw: payload,
        };
    }

    // ── SendGrid Inbound Parse ──
    // Format: form-urlencoded with fields: from, to, subject, text, html, envelope, ...
    if (payload.envelope || (payload.charsets && payload.from)) {
        return {
            provider: "sendgrid",
            from: payload.from || "",
            to: payload.to || "",
            subject: payload.subject || "",
            body: payload.text || "",
            html: payload.html || "",
            cc: payload.cc || "",
            replyTo: payload.from || "",
            date: payload.Date || payload.date || "",
            messageId: payload["Message-Id"] || payload.message_id || "",
            attachments: [],
            raw: payload,
        };
    }

    // ── Mailgun Inbound ──
    // Format: form-urlencoded with fields: sender, recipient, subject, body-plain, body-html, ...
    if (payload.sender && payload.recipient && payload["body-plain"] !== undefined) {
        return {
            provider: "mailgun",
            from: payload.sender || payload.from || "",
            to: payload.recipient || "",
            subject: payload.subject || "",
            body: payload["body-plain"] || "",
            html: payload["body-html"] || "",
            cc: payload.Cc || payload.cc || "",
            replyTo: payload["Reply-To"] || payload.sender || "",
            date: payload.Date || payload.date || "",
            messageId: payload["Message-Id"] || "",
            attachments: [],
            raw: payload,
        };
    }

    // ── Postmark Inbound ──
    // Format: JSON with fields: From, To, Subject, TextBody, HtmlBody, ...
    if (payload.From && payload.TextBody !== undefined) {
        return {
            provider: "postmark",
            from: payload.FromFull?.Email || payload.From || "",
            to: payload.ToFull?.Email || payload.To || "",
            subject: payload.Subject || "",
            body: payload.TextBody || "",
            html: payload.HtmlBody || "",
            cc: payload.Cc || "",
            replyTo: payload.ReplyTo || payload.From || "",
            date: payload.Date || "",
            messageId: payload.MessageID || "",
            attachments: Array.isArray(payload.Attachments)
                ? payload.Attachments.map((a: any) => ({
                    filename: a.Name || "",
                    contentType: a.ContentType || "",
                    size: a.ContentLength,
                }))
                : [],
            raw: payload,
        };
    }

    // ── Generic / cURL testing ──
    // Format: JSON with common fields: from, to, subject, body/text
    if (payload.from || payload.sender || payload.email) {
        return {
            provider: "generic",
            from: payload.from || payload.sender || payload.email || "",
            to: payload.to || payload.recipient || "",
            subject: payload.subject || "",
            body: payload.body || payload.text || payload.message || payload.content || "",
            html: payload.html || "",
            cc: payload.cc || "",
            replyTo: payload.replyTo || payload.reply_to || "",
            date: payload.date || "",
            messageId: payload.messageId || payload.message_id || "",
            attachments: [],
            raw: payload,
        };
    }

    return null;
}

// Handle Incoming Email Webhooks (POST)
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

        const contentType = request.headers.get("content-type") || "";
        let payload: Record<string, any> = {};

        // Parse body based on content type
        if (contentType.includes("multipart/form-data")) {
            // Handle multipart (SendGrid, some Mailgun configs)
            const formData = await request.formData();
            for (const [key, value] of formData.entries()) {
                if (typeof value === "string") {
                    payload[key] = value;
                }
            }
        } else {
            const bodyText = await request.text();

            if (contentType.includes("application/json")) {
                try {
                    payload = JSON.parse(bodyText);
                } catch {
                    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
                }
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
                const params = new URLSearchParams(bodyText);
                for (const [key, value] of params.entries()) {
                    payload[key] = value;
                }
            } else {
                // Try JSON as fallback
                try {
                    payload = JSON.parse(bodyText);
                } catch {
                    payload = { body: bodyText };
                }
            }
        }

        // Normalize the payload to a consistent format
        const triggerData = normalizeEmailPayload(payload);

        if (triggerData) {
            console.log(`[Email Webhook] Received from provider: ${triggerData.provider}, from: ${triggerData.from}, subject: ${triggerData.subject}`);

            await sendWorkflowExecution({
                workflowId,
                initialData: {
                    email: triggerData,
                },
            });

            return NextResponse.json(
                { success: true, provider: triggerData.provider },
                { status: 200 }
            );
        } else {
            console.log("[Email Webhook] Unrecognized payload format, ignoring:", Object.keys(payload));
            // Return 200 to keep provider happy (avoids retries)
            return NextResponse.json({ success: true, ignored: true }, { status: 200 });
        }
    } catch (error) {
        console.error("[Email Webhook] Error processing request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process email webhook" },
            { status: 500 }
        );
    }
}

// Some providers send a GET request for verification
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");

    return NextResponse.json({
        status: "ok",
        message: "Email webhook endpoint is active",
        workflowId: workflowId || "not specified",
        supportedProviders: ["resend", "sendgrid", "mailgun", "postmark", "generic"],
    });
}
