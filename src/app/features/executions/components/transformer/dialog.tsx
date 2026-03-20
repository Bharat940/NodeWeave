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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

const ruleSchema = z.object({
    outputKey: z.string().min(1, "Output key is required"),
    expression: z.string().min(1, "Expression is required"),
});

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must start with a letter or underscore and contain only letters, numbers, and underscores.",
        }),
    rules: z.array(ruleSchema).min(1, "At least one rule is required"),
});

export type TransformerFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: TransformerFormValues) => void;
    defaultValues?: Partial<TransformerFormValues>;
}

export const TransformerDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const form = useForm<TransformerFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName ?? "",
            rules: defaultValues.rules ?? [{ outputKey: "", expression: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "rules",
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName ?? "",
                rules: defaultValues.rules?.length
                    ? defaultValues.rules
                    : [{ outputKey: "", expression: "" }],
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "mapped";

    const handleSubmit = (values: TransformerFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Data Transformer</DialogTitle>
                    <DialogDescription>
                        Map and reshape data from the workflow context into a new object.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-2">

                        {/* Variable Name */}
                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Output Variable Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="mapped" {...field} />
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

                        {/* Rules */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <FormLabel>Field Rules</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ outputKey: "", expression: "" })}
                                >
                                    <PlusIcon className="size-3.5 mr-1" />
                                    Add Rule
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Use <code className="bg-muted px-1 py-0.5 rounded">{`{{key}}`}</code> or <code className="bg-muted px-1 py-0.5 rounded">{`{{object.nested}}`}</code> to reference context values.
                            </p>

                            {fields.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                    No rules yet. Click "Add Rule" to get started.
                                </p>
                            )}

                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                                        <FormField
                                            control={form.control}
                                            name={`rules.${index}.outputKey`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    {index === 0 && (
                                                        <FormLabel className="text-xs text-muted-foreground">
                                                            Output Key
                                                        </FormLabel>
                                                    )}
                                                    <FormControl>
                                                        <Input placeholder="email" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`rules.${index}.expression`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    {index === 0 && (
                                                        <FormLabel className="text-xs text-muted-foreground">
                                                            Expression
                                                        </FormLabel>
                                                    )}
                                                    <FormControl>
                                                        <Input placeholder="{{stripe.customer_email}}" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className={index === 0 ? "mt-6" : ""}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2Icon className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {form.formState.errors.rules?.root && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.rules.root.message}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="submit">Save Transformer</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
