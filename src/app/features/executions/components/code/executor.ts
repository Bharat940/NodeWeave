import { getQuickJS } from "quickjs-emscripten";
import type { NodeExecutor } from "@/app/features/executions/types";
import { NonRetriableError } from "inngest";
import { codeChannel } from "@/inngest/channels/code";
import { CodeFormValues } from "./dialog";

type CodeData = Partial<CodeFormValues>;

export const codeExecutor: NodeExecutor<CodeData> = async ({
    data,
    context,
    nodeId,
    step,
    publish,
}) => {
    await publish(
        codeChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    if (!data.code || data.code.trim() === "") {
        await publish(
            codeChannel().status({
                nodeId,
                status: "error",
            }),
        );
        throw new NonRetriableError("Code Node: No code provided");
    }

    try {
        const result = await step.run("execute-code", async () => {
            const QuickJS = await getQuickJS();
            const runtime = QuickJS.newRuntime();

            // Set hard 5-second timeout via interrupt handler
            const startTime = Date.now();
            runtime.setInterruptHandler(() => {
                return (Date.now() - startTime) > 5000;
            });

            const vm = runtime.newContext();

            try {
                // Serialize context into the script to keep the Wasm boundary clean
                // Wrap user code in a function so they can 'return'
                const executionScript = `
                    const context = ${JSON.stringify(context)};
                    const executeUserCode = function(context) {
                        ${data.code}
                    };
                    const result = executeUserCode(context);
                    JSON.stringify(result);
                `;

                const resultHandle = vm.evalCode(executionScript);

                if (resultHandle.error) {
                    const errorDump = vm.dump(resultHandle.error) as any;
                    resultHandle.error.dispose();

                    const errorMessage = errorDump?.message || String(errorDump);

                    // If it was interrupted via timeout, the runtime throws "interrupted"
                    if (errorMessage.toLowerCase().includes("interrupted")) {
                        throw new NonRetriableError("Code Node: Execution timed out after 5s");
                    }

                    throw new NonRetriableError(`Code Node: ${errorMessage}`);
                }

                // Extract successful result
                const resultString = vm.getString(resultHandle.value);
                resultHandle.value.dispose();

                let output: unknown;
                try {
                    output = JSON.parse(resultString);
                } catch (e) {
                    throw new NonRetriableError("Code Node: Failed to parse return value.");
                }

                if (
                    typeof output !== "object" ||
                    output === null ||
                    Array.isArray(output)
                ) {
                    throw new NonRetriableError(
                        "Code Node: Code must return a plain object (e.g. return { ...context, myKey: 'value' })"
                    );
                }

                return output as Record<string, unknown>;
            } finally {
                // Always clean up Wasm memory
                vm.dispose();
                runtime.dispose();
            }
        });

        await publish(
            codeChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            codeChannel().status({
                nodeId,
                status: "error",
            }),
        );

        throw error;
    }
};
