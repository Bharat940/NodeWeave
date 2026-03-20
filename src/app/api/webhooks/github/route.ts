import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Handle Incoming GitHub Webhooks (POST)
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

        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { isActive: true }
        });

        if (!workflow?.isActive) {
            return NextResponse.json(
                { error: "Workflow is disabled" },
                { status: 400 }
            );
        }

        // Parse GitHub webhook payload
        const payload = await request.json();

        // Get the event type from GitHub headers
        const eventType = request.headers.get("x-github-event");

        if (!eventType) {
            return NextResponse.json(
                { error: "Missing x-github-event header" },
                { status: 400 }
            );
        }

        // Extract relevant data based on event type
        let triggerData: any = {
            eventType,
            raw: payload
        };

        // Handle different GitHub event types
        switch (eventType) {
            case "push":
                triggerData = {
                    ...triggerData,
                    repository: payload.repository,
                    pusher: payload.pusher,
                    commits: payload.commits,
                    ref: payload.ref,
                    before: payload.before,
                    after: payload.after,
                };
                break;

            case "pull_request":
                triggerData = {
                    ...triggerData,
                    action: payload.action,
                    pullRequest: payload.pull_request,
                    repository: payload.repository,
                    sender: payload.sender,
                    number: payload.pull_request?.number,
                };
                break;

            case "issues":
                triggerData = {
                    ...triggerData,
                    action: payload.action,
                    issue: payload.issue,
                    repository: payload.repository,
                    sender: payload.sender,
                    number: payload.issue?.number,
                };
                break;

            default:
                // For other events, just pass the raw payload
                break;
        }

        // Trigger Workflow Execution
        await sendWorkflowExecution({
            workflowId,
            triggerType: "github",
            initialData: {
                github: triggerData,
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("GitHub webhook error", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        const isQuotaError = errorMessage.includes("Execution quota exceeded");
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: isQuotaError ? 403 : 500 }
        );
    }
}
