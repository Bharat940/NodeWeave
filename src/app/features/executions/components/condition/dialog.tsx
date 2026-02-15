"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Variable name must start with a letter or underscore and contains only letters, numbers, and underscores.",
        }),
    leftOperand: z.string().min(1, "Left operand is required"),
    operator: z.enum([
        "equals", "not_equals", "contains", "not_contains",
        "greater_than", "less_than", "is_empty", "is_not_empty",
        "starts_with", "ends_with"
    ]),
    rightOperand: z.string().optional(),
});

export type ConditionFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: ConditionFormValues) => void;
    defaultValues?: Partial<ConditionFormValues>;
};

export const ConditionDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {

    const form = useForm<ConditionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "",
            leftOperand: defaultValues.leftOperand || "",
            operator: defaultValues.operator || "equals",
            rightOperand: defaultValues.rightOperand || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "",
                leftOperand: defaultValues.leftOperand || "",
                operator: defaultValues.operator || "equals",
                rightOperand: defaultValues.rightOperand || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchOperator = form.watch("operator");
    const watchVariableName = form.watch("variableName") || "myCondition";
    const showRightOperand = !["is_empty", "is_not_empty"].includes(watchOperator);

    const handleSubmit = (values: ConditionFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Condition Logic
                    </DialogTitle>
                    <DialogDescription>
                        Configure the condition to branch your workflow.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="isUrgent"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Reference result:{" "} {`{{${watchVariableName}.result}}`}. Returns true or false.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="leftOperand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Left Value</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="{{email.subject}}"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="operator"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operator</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select operator" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="equals">Equals</SelectItem>
                                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                                <SelectItem value="contains">Contains</SelectItem>
                                                <SelectItem value="not_contains">Does Not Contain</SelectItem>
                                                <SelectItem value="starts_with">Starts With</SelectItem>
                                                <SelectItem value="ends_with">Ends With</SelectItem>
                                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                                <SelectItem value="less_than">Less Than</SelectItem>
                                                <SelectItem value="is_empty">Is Empty</SelectItem>
                                                <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {showRightOperand && (
                            <FormField
                                control={form.control}
                                name="rightOperand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Right Value</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="urgent"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter className="mt-4">
                            <Button type="submit">Save Condition</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
