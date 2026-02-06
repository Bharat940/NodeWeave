import { InitialNode } from "@/components/initial-node"
import { NodeType } from "@/generated/prisma"
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
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents;