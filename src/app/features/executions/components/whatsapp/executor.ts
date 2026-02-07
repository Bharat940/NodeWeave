import Handlebars from "handlebars";
import { decode } from "html-entities"
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { whatsappChannel } from "@/inngest/channels/whatsapp";
import { WhatsappFormValues } from "./dialog";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type WhatsappData = Partial<WhatsappFormValues>;

export const whatsappExecutor: NodeExecutor<WhatsappData> = async ({
    data,
    context,
    nodeId,
    step,
    publish
}) => {

    await publish(
        whatsappChannel().status({
            nodeId,
            status: "loading"
        }),
    );

    // Validate common required fields
    if (!data.provider) {
        await publish(
            whatsappChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("WhatsApp Node: Provider is required");
    }

    if (!data.toNumber) {
        await publish(
            whatsappChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("WhatsApp Node: To number is required");
    }

    if (!data.content) {
        await publish(
            whatsappChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("WhatsApp Node: Message content is required");
    }

    if (!data.variableName) {
        await publish(
            whatsappChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("WhatsApp Node: Variable name is required");
    }

    // Compile message content with Handlebars
    const rawContent = Handlebars.compile(data.content)(context);
    const content = decode(rawContent);

    // Compile phone numbers with Handlebars (to support variables like {{whatsapp.from}})
    const toNumber = data.toNumber ? Handlebars.compile(data.toNumber)(context) : data.toNumber;
    const fromNumber = data.fromNumber ? Handlebars.compile(data.fromNumber)(context) : data.fromNumber;

    try {
        const result = await step.run("whatsapp-message", async () => {
            if (data.provider === "twilio") {
                return await sendViaTwilio(data, content, toNumber, fromNumber, context);
            } else if (data.provider === "meta") {
                return await sendViaMeta(data, content, toNumber, fromNumber, context);
            } else {
                throw new NonRetriableError(`WhatsApp Node: Unknown provider: ${data.provider}`);
            }
        });

        await publish(
            whatsappChannel().status({
                nodeId,
                status: "success"
            }),
        );

        return result;
    } catch (error) {
        await publish(
            whatsappChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw error;
    }
}

// Twilio API Integration
async function sendViaTwilio(
    data: WhatsappData,
    content: string,
    toNumber: string | undefined,
    fromNumber: string | undefined,
    context: Record<string, any>
) {
    // Validate Twilio-specific fields
    if (!data.accountSid) {
        throw new NonRetriableError("WhatsApp Node: Account SID is required for Twilio");
    }
    if (!data.authToken) {
        throw new NonRetriableError("WhatsApp Node: Auth Token is required for Twilio");
    }
    if (!fromNumber) {
        throw new NonRetriableError("WhatsApp Node: From number is required for Twilio");
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${data.accountSid}:${data.authToken}`).toString('base64');

    // Twilio API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${data.accountSid}/Messages.json`;

    // Prepare form data for Twilio
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${fromNumber}`);
    formData.append('To', `whatsapp:${toNumber}`);
    formData.append('Body', content.slice(0, 1600));

    // Send message via Twilio API
    const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new NonRetriableError(`WhatsApp Node (Twilio): ${errorData.message || response.statusText}`);
    }

    const responseData = await response.json();

    return {
        ...context,
        [data.variableName!]: {
            provider: 'twilio',
            messageSid: responseData.sid,
            status: responseData.status,
            to: responseData.to,
            from: responseData.from,
            body: responseData.body,
            dateCreated: responseData.date_created,
        },
    };
}

// Meta Business API Integration
async function sendViaMeta(
    data: WhatsappData,
    content: string,
    toNumber: string | undefined,
    fromNumber: string | undefined,
    context: Record<string, any>
) {
    // Validate Meta-specific fields
    if (!data.accessToken) {
        throw new NonRetriableError("WhatsApp Node: Access Token is required for Meta");
    }
    if (!data.phoneNumberId) {
        throw new NonRetriableError("WhatsApp Node: Phone Number ID is required for Meta");
    }

    // Meta WhatsApp Cloud API endpoint
    const metaUrl = `https://graph.facebook.com/v21.0/${data.phoneNumberId}/messages`;

    // Prepare request body for Meta
    const requestBody = {
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: {
            body: content.slice(0, 1600)
        }
    };

    // Send message via Meta Cloud API
    const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${data.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;
        throw new NonRetriableError(`WhatsApp Node (Meta): ${errorMessage}`);
    }

    const responseData = await response.json();

    return {
        ...context,
        [data.variableName!]: {
            provider: 'meta',
            messageId: responseData.messages?.[0]?.id,
            status: 'sent',
            to: data.toNumber,
            contacts: responseData.contacts,
        },
    };
}