import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";

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

        // Send to Inngest workflow
        await sendWorkflowExecution({
            workflowId,
            initialData: {
                github: triggerData,
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("GitHub webhook error", error);
        return NextResponse.json(
            { success: false, error: "Failed to process GitHub webhook" },
            { status: 500 }
        );
    }
}
