import Handlebars from "handlebars";
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import ky from "ky";
import { githubChannel } from "@/inngest/channels/github";
import { GitHubFormValues } from "./dialog";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type GitHubData = Partial<GitHubFormValues>;

export const githubExecutor: NodeExecutor<GitHubData> = async ({
    data,
    context,
    userId,
    nodeId,
    step,
    publish
}) => {

    await publish(
        githubChannel().status({
            nodeId,
            status: "loading"
        }),
    );

    if (!data.variableName) {
        await publish(
            githubChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("GitHub Node: Variable name is missing");
    }

    if (!data.credentialId) {
        await publish(
            githubChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw new NonRetriableError("GitHub node: Credential is required");
    }

    if (!data.owner || !data.repo || !data.issueNumber || !data.commentBody) {
        await publish(
            githubChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("GitHub Node: Owner, repo, issue number, and comment body are required");
    }

    const credential = await step.run("get-credential", () => {
        return prisma.credential.findUnique({
            where: {
                id: data.credentialId,
                userId,
            },
        });
    });

    if (!credential) {
        await publish(
            githubChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw new NonRetriableError("GitHub Node: Credential not found");
    }

    const token = decrypt(credential.value);
    const owner = Handlebars.compile(data.owner)(context);
    const repo = Handlebars.compile(data.repo)(context);
    const issueNumber = Handlebars.compile(data.issueNumber)(context);
    const commentBody = Handlebars.compile(data.commentBody)(context);

    try {
        const response = await step.run("post-github-comment", async () => {
            return await ky.post(
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                    json: {
                        body: commentBody,
                    },
                }
            ).json<{ html_url: string; id: number }>();
        });

        await publish(
            githubChannel().status({
                nodeId,
                status: "success"
            }),
        );

        return {
            ...context,
            [data.variableName]: {
                commentUrl: response.html_url,
                commentId: response.id,
            },
        };
    } catch (error) {
        await publish(
            githubChannel().status({
                nodeId,
                status: "error"
            }),
        );
        throw error;
    }
}
