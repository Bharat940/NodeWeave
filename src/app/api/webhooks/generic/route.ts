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

        // Verify workflow exists and has a webhook trigger
        const workflow = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                nodes: {
                    some: {
                        type: "WEBHOOK"
                    }
                }
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
                { error: "Workflow not found or missing webhook trigger" },
                { status: 404 }
            );
        }

        // Get request data
        const body = await req.json().catch(() => ({}));
        const headers = Object.fromEntries(req.headers.entries());
        const query = Object.fromEntries(searchParams.entries());

        // Trigger Workflow Execution directly
        await sendWorkflowExecution({
            workflowId,
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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
