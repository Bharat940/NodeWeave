import { InitialNode } from "@/components/initial-node"
import { NodeType } from "@/generated/prisma/browser"
import type { NodeTypes } from "@xyflow/react"

import { HttpRequestNode } from "@/app/features/executions/components/http-request/node";
import { ManualTriggerNode } from "@/app/features/triggers/components/manual-trigger/node";
import { GoogleFormlTriggerNode } from "@/app/features/triggers/components/google-form-trigger/node";
import { StripeTriggerNode } from "@/app/features/triggers/components/stripe-trigger/node";
import { GeminiNode } from "@/app/features/executions/components/gemini/node";
import { OpenAiNode } from "@/app/features/executions/components/openai/node";
import { AnthropicNode } from "@/app/features/executions/components/anthropic/node";
import { DiscordNode } from "@/app/features/executions/components/discord/node";
import { SlackNode } from "@/app/features/executions/components/slack/node";
import { WhatsappNode } from "@/app/features/executions/components/whatsapp/node";
import { WhatsappTriggerNode } from "@/app/features/triggers/components/whatsapp-trigger/node";
import { TelegramNode } from "@/app/features/executions/components/telegram/node";
import { TelegramTriggerNode } from "@/app/features/triggers/components/telegram-trigger/node";
import { GitHubNode } from "@/app/features/executions/components/github/node";
import { GitHubTriggerNode } from "@/app/features/triggers/components/github-trigger/node";
import { EmailNode } from "@/app/features/executions/components/email/node";
import { EmailTriggerNode } from "@/app/features/triggers/components/email-trigger/node";
import { WebhookTriggerNode } from "@/app/features/triggers/components/webhook-trigger/node";
import { CronTriggerNode } from "@/app/features/triggers/components/cron-trigger/node";
import { ConditionNode } from "@/app/features/executions/components/condition/node";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode,
    [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
    [NodeType.HTTP_REQUEST]: HttpRequestNode,
    [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormlTriggerNode,
    [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
    [NodeType.GEMINI]: GeminiNode,
    [NodeType.OPENAI]: OpenAiNode,
    [NodeType.ANTHROPIC]: AnthropicNode,
    [NodeType.DISCORD]: DiscordNode,
    [NodeType.SLACK]: SlackNode,
    [NodeType.WHATSAPP]: WhatsappNode,
    [NodeType.WHATSAPP_TRIGGER]: WhatsappTriggerNode,
    [NodeType.TELEGRAM]: TelegramNode,
    [NodeType.TELEGRAM_TRIGGER]: TelegramTriggerNode,
    [NodeType.GITHUB]: GitHubNode,
    [NodeType.GITHUB_TRIGGER]: GitHubTriggerNode,
    [NodeType.EMAIL]: EmailNode,
    [NodeType.EMAIL_TRIGGER]: EmailTriggerNode,
    [NodeType.CONDITION]: ConditionNode,
    [NodeType.WEBHOOK]: WebhookTriggerNode,
    [NodeType.CRON_TRIGGER]: CronTriggerNode,
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents;