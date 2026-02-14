import Handlebars from "handlebars";
import { decode } from "html-entities"
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { emailChannel } from "@/inngest/channels/email";
import { EmailFormValues } from "./dialog";
import ky from "ky";
import { decrypt } from "@/lib/encryption";
import prisma from "@/lib/db";
import nodemailer from "nodemailer";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type EmailData = Partial<EmailFormValues>;

export const emailExecutor: NodeExecutor<EmailData> = async ({
    data,
    context,
    nodeId,
    step,
    publish
}) => {

    await publish(
        emailChannel().status({
            nodeId,
            status: "loading"
        }),
    );

    // Validate common required fields

    if (!data.provider) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Email Node: Provider is required");
    }

    if (!data.to) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Email Node: To is required");
    }

    if (!data.subject) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Email Node: Subject is required");
    }

    if (!data.body) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("Email Node: Body is required");
    }

    // Provider-specific validation is done in the individual send functions



    // Compile templates
    const compile = (template: string) => {
        const raw = Handlebars.compile(template)(context);
        return decode(raw);
    };

    const to = compile(data.to);
    const subject = compile(data.subject);
    const body = compile(data.body);

    try {
        const result = await step.run("send-email", async () => {
            if (data.provider === "resend") {
                return await sendViaResend(data, to, subject, body, context);
            } else if (data.provider === "smtp") {
                return await sendViaSMTP(data, to, subject, body, context);
            } else {
                throw new NonRetriableError("Email Node: Invalid provider");
            }
        })

        await publish(
            emailChannel().status({
                nodeId,
                status: "success"
            }),
        );

        return result;
    } catch (error: any) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

async function sendViaResend(
    data: EmailData,
    to: string,
    subject: string,
    body: string,
    context: Record<string, any>
) {
    // Validate Resend-specific fields
    if (!data.credentialId) {
        throw new NonRetriableError("Email Node: Credential is required for Resend");
    }

    // Get credential
    const credential = await prisma.credential.findUnique({
        where: { id: data.credentialId },
    });

    if (!credential) {
        throw new NonRetriableError("Credential not found");
    }

    const apiKey = decrypt(credential.value);

    // Send via Resend
    const response = await ky.post("https://api.resend.com/emails", {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        json: {
            from: data.from || "onboarding@resend.dev",
            to: to,
            subject: subject,
            html: body,
        },
        timeout: 10000,
    }).json<{ id: string }>();

    if (!data.variableName) {
        throw new NonRetriableError("Email Node: Variable name is missing");
    }

    return {
        ...context,
        [data.variableName]: {
            id: response.id,
            to,
            subject,
            status: "sent"
        },
    }
}

async function sendViaSMTP(
    data: EmailData,
    to: string,
    subject: string,
    body: string,
    context: Record<string, any>
) {
    // Validate SMTP-specific fields
    if (!data.smtpHost) {
        throw new NonRetriableError("Email Node: SMTP Host is required");
    }

    if (!data.smtpPort) {
        throw new NonRetriableError("Email Node: SMTP Port is required");
    }

    if (!data.smtpUsername) {
        throw new NonRetriableError("Email Node: SMTP Username is required");
    }

    if (!data.smtpPassword) {
        throw new NonRetriableError("Email Node: SMTP Password is required");
    }

    if (!data.variableName) {
        throw new NonRetriableError("Email Node: Variable name is missing");
    }

    if (!data.from) {
        throw new NonRetriableError("Email Node: From email is required");
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
        host: data.smtpHost,
        port: data.smtpPort,
        secure: data.smtpSecure ?? false, // true for 465, false for other ports
        auth: {
            user: data.smtpUsername,
            pass: data.smtpPassword,
        },
    });

    // Send email via SMTP
    const info = await transporter.sendMail({
        from: data.from,
        to: to,
        subject: subject,
        html: body,
    });

    return {
        ...context,
        [data.variableName]: {
            id: info.messageId,
            to,
            subject,
            status: "sent",
            response: info.response,
        },
    }
}
