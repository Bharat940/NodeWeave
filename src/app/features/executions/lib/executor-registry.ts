import { NodeType } from "@/generated/prisma";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "../../triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "../../triggers/components/google-form-trigger/executor";
import { stripeTriggerExecutor } from "../../triggers/components/stripe-trigger/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { openaiExecutor } from "../components/openai/executor";
import { anthropicExecutor } from "../components/anthropic/executor";
import { discordExecutor } from "../components/discord/executor";
import { slackExecutor } from "../components/slack/executor";
import { whatsappExecutor } from "../components/whatsapp/executor";
import { whatsappTriggerExecutor } from "../../triggers/components/whatsapp-trigger/executor";
import { telegramExecutor } from "../components/telegram/executor";
import { telegramTriggerExecutor } from "../../triggers/components/telegram-trigger/executor";
import { githubExecutor } from "../components/github/executor";
import { githubTriggerExecutor } from "../../triggers/components/github-trigger/executor";

export const executorRegistry: Record<NodeType, NodeExecutor> = {
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
    [NodeType.INITIAL]: manualTriggerExecutor,
    [NodeType.HTTP_REQUEST]: httpRequestExecutor,
    [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
    [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor,
    [NodeType.GEMINI]: geminiExecutor,
    [NodeType.ANTHROPIC]: anthropicExecutor,
    [NodeType.OPENAI]: openaiExecutor,
    [NodeType.DISCORD]: discordExecutor,
    [NodeType.SLACK]: slackExecutor,
    [NodeType.WHATSAPP]: whatsappExecutor,
    [NodeType.WHATSAPP_TRIGGER]: whatsappTriggerExecutor,
    [NodeType.TELEGRAM]: telegramExecutor,
    [NodeType.TELEGRAM_TRIGGER]: telegramTriggerExecutor,
    [NodeType.GITHUB]: githubExecutor,
    [NodeType.GITHUB_TRIGGER]: githubTriggerExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor => {
    const executor = executorRegistry[type];

    if (!executor) {
        throw new Error(`No executor found for node type: ${type}`);
    }

    return executor;
};