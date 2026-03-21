"use client";

import {
    MousePointerIcon,
    WebhookIcon,
    ClockIcon,
    GitBranchIcon,
    ArrowRightLeftIcon,
    CodeIcon,
    TimerIcon,
    GlobeIcon,
    LayoutTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";

export const templateIcons = {
    // Triggers
    "manual": MousePointerIcon,
    "google-form": "/logos/googleform.svg",
    "stripe": "/logos/stripe.svg",
    "whatsapp": "/logos/whatsapp.svg",
    "telegram": "/logos/telegram.svg",
    "github": "/logos/github.svg",
    "email": "/logos/resend.svg",
    "webhook": WebhookIcon,
    "cron": ClockIcon,

    // AI
    "gemini": "/logos/gemini.svg",
    "openai": "/logos/openai.svg",
    "anthropic": "/logos/anthropic.svg",

    // Messaging
    "discord": "/logos/discord.svg",
    "slack": "/logos/slack.svg",

    // Logic
    "condition": GitBranchIcon,
    "transformer": ArrowRightLeftIcon,
    "code": CodeIcon,
    "delay": TimerIcon,

    // Dev
    "http": GlobeIcon,
    "layout": LayoutTemplate,
} as const;

export type TemplateIconType = keyof typeof templateIcons;

interface TemplateIconProps {
    name: string | null;
    className?: string;
}

export function TemplateIcon({ name, className }: TemplateIconProps) {
    const icon = (templateIcons as any)[name as any] || templateIcons.layout;

    if (typeof icon === "string") {
        return (
            <img
                src={icon}
                alt={name || "icon"}
                className={cn("size-6 object-contain rounded-sm", className)}
            />
        );
    }

    const Icon = icon;
    return <Icon className={cn("size-6", className)} />;
}
