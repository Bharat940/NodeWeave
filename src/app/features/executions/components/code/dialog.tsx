"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must start with a letter or underscore and contain only letters, numbers, and underscores.",
        }),
    code: z.string().min(1, "Code is required"),
});

export type CodeFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: CodeFormValues) => void;
    defaultValues?: Partial<CodeFormValues>;
}

const DEFAULT_CODE = `// 'context' contains all data from previous nodes
// Simply return the data you want to save.
// It will be accessible via your variable name.

return {
  score: Math.floor(Math.random() * 100),
  status: 'SUCCESS'
};`;

export const CodeDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const form = useForm<CodeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName ?? "",
            code: defaultValues.code ?? DEFAULT_CODE,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName ?? "",
                code: defaultValues.code ?? DEFAULT_CODE,
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myCode";

    const handleSubmit = (values: CodeFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Code Node</DialogTitle>
                    <DialogDescription>
                        Write JavaScript to transform workflow data. Must return a plain object.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">

                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="myCode" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Access the result as{" "}
                                        <code className="bg-muted text-xs px-1 py-0.5 rounded">
                                            {`{{${watchVariableName}.yourKey}}`}
                                        </code>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>JavaScript Code</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="font-mono text-sm min-h-[240px] resize-y"
                                            spellCheck={false}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Reference guide */}
                        <Accordion type="single" collapsible>
                            <AccordionItem value="help" className="border rounded-md px-3">
                                <AccordionTrigger className="text-sm text-muted-foreground py-2">
                                    Reference &amp; Examples
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pb-3">
                                    <div>
                                        <p className="text-xs font-medium mb-1">Available variable</p>
                                        <code className="text-xs bg-muted px-2 py-1 rounded block">
                                            context — the current workflow execution data
                                        </code>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium mb-1">Example: extract a Stripe field</p>
                                        <pre className="text-xs bg-muted px-2 py-2 rounded">{`return {
  ...context,
  email: context.stripe.customer_email,
  amount: context.stripe.amount / 100,
};`}</pre>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        ⚠ Code runs with a 5-second timeout. Execution stops if the limit is exceeded.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <DialogFooter>
                            <Button type="submit">Save Code</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
