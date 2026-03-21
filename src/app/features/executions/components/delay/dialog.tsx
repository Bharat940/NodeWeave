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
    SelectValue
} from "@/components/ui/select";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    delayValue: z.number().int({ message: "Duration must be a whole number" }).min(1, { message: "Duration must be at least 1" }),
    delayUnit: z.enum(["seconds", "minutes", "hours", "days"]),
});

export type DelayFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: DelayFormValues) => void;
    defaultValues?: Partial<DelayFormValues>;
};

export const DelayDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const form = useForm<DelayFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            delayValue: defaultValues.delayValue ?? 5,
            delayUnit: defaultValues.delayUnit ?? "minutes",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                delayValue: defaultValues.delayValue ?? 5,
                delayUnit: defaultValues.delayUnit ?? "minutes",
            });
        }
    }, [open, defaultValues, form]);

    const watchValue = form.watch("delayValue");
    const watchUnit = form.watch("delayUnit");

    const handleSubmit = (values: DelayFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Delay / Wait
                    </DialogTitle>
                    <DialogDescription>
                        Pause the workflow for a set amount of time before continuing.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit as any)}
                        className="space-y-6 mt-4"
                    >
                        <FormField
                            control={form.control as any}
                            name="delayValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder="5"
                                            {...field}
                                            onChange={(e) => {
                                                const parsed = parseInt(e.target.value, 10);
                                                field.onChange(isNaN(parsed) ? undefined : parsed);
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        How long to pause before continuing.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="delayUnit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="seconds">Seconds</SelectItem>
                                            <SelectItem value="minutes">Minutes</SelectItem>
                                            <SelectItem value="hours">Hours</SelectItem>
                                            <SelectItem value="days">Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {watchValue && watchUnit
                                            ? `This node will pause for ${watchValue} ${watchUnit}.`
                                            : "Choose a time unit."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
