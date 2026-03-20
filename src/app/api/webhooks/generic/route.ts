import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const workflowId = searchParams.get("workflowId");

        if (!workflowId) {
            return NextResponse.json(
                { error: "Missing workflowId parameter" },
                { status: 400 }
            );
        }

        // Verify workflow exists, is active, and has a webhook trigger
        const workflow = await prisma.workflow.findUnique({
            where: {
                id: workflowId,
            },
            include: {
                nodes: {
                    where: {
                        type: "WEBHOOK"
                    }
                }
            }
        });

        if (!workflow) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        if (!workflow.isActive) {
            return NextResponse.json(
                { error: "Workflow is disabled" },
                { status: 400 }
            );
        }

        if (workflow.nodes.length === 0) {
            return NextResponse.json(
                { error: "Workflow does not have a webhook trigger" },
                { status: 400 }
            );
        }

        // Get request data
        const body = await req.json().catch(() => ({}));
        const headers = Object.fromEntries(req.headers.entries());
        const query = Object.fromEntries(searchParams.entries());

        // Trigger Workflow Execution directly
        await sendWorkflowExecution({
            workflowId,
            triggerType: "webhook",
            initialData: {
                webhook: {
                    body,
                    headers,
                    query,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Workflow triggered successfully",
        });

    } catch (error) {
        console.error("Error triggering webhook workflow:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        const isQuotaError = errorMessage.includes("Execution quota exceeded");

        return NextResponse.json(
            { error: errorMessage },
            { status: isQuotaError ? 403 : 500 }
        );
    }
}
