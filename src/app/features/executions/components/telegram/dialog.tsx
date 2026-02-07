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
import { Textarea } from "@/components/ui/textarea";
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
    botToken: z.string().min(1, "Bot token is required"),
    chatId: z.string().min(1, "Chat ID is required"),
    content: z
        .string()
        .min(1, "Message content is required")
        .max(4096, "Telegram messages cannot exceed 4096 characters"),
});

export type TelegramFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<TelegramFormValues>;
};

export const TelegramDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "",
            botToken: defaultValues.botToken || "",
            chatId: defaultValues.chatId || "",
            content: defaultValues.content || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "",
                botToken: defaultValues.botToken || "",
                chatId: defaultValues.chatId || "",
                content: defaultValues.content || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myTelegram";

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-scroll">
                <DialogHeader>
                    <DialogTitle>
                        Telegram Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure Telegram bot settings to send messages.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="myTelegram"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Use this name to reference the result in other nodes:{" "} {`{{${watchVariableName}.messageId}}`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="botToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Bot Token
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        <strong>How to get:</strong> Open Telegram → Search <strong>@BotFather</strong> → Send <code>/newbot</code> → Follow instructions → Copy the token
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="chatId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Chat ID
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="123456789 or {{telegram.chatId}}"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        <strong>How to find:</strong> Message your bot → Visit <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> → Find <code>chat.id</code> in JSON. Or use variables like <code>{"{{telegram.chatId}}"}</code>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hello! Your workflow result: {{ai.text}}"
                                            className="min-h-[80px] font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The message to send. Use {"{{variables}}"} for dynamic content. Supports Markdown formatting.
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
        </Dialog >
    );
};