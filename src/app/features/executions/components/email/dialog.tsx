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
import { useCredentialsByType } from "@/app/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma/browser";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    provider: z.enum(["resend", "smtp"], {
        message: "Please select a provider",
    }),
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Variable name must start with a letter or underscore and contains only letters, numbers, and underscores.",
        }),
    // SMTP fields (optional in base schema, validated conditionally)
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().positive().optional(),
    smtpUsername: z.string().optional(),
    smtpPassword: z.string().optional(),
    smtpSecure: z.boolean().optional(),
    // Resend fields (optional in base schema, validated conditionally)
    credentialId: z.string().optional(),
    // Common fields
    from: z.string().min(1, "From email is required"),
    to: z.string().min(1, "To email is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
}).superRefine((data, ctx) => {
    // Validate Resend-specific fields
    if (data.provider === "resend") {
        if (!data.credentialId) {
            ctx.addIssue({
                code: "custom",
                message: "Credential is required for Resend",
                path: ["credentialId"],
            });
        }
    }

    // Validate SMTP-specific fields
    if (data.provider === "smtp") {
        if (!data.smtpHost) {
            ctx.addIssue({
                code: "custom",
                message: "SMTP Host is required",
                path: ["smtpHost"],
            });
        }

        if (!data.smtpPort) {
            ctx.addIssue({
                code: "custom",
                message: "SMTP Port is required",
                path: ["smtpPort"],
            });
        }

        if (!data.smtpUsername) {
            ctx.addIssue({
                code: "custom",
                message: "SMTP Username is required",
                path: ["smtpUsername"],
            });
        }

        if (!data.smtpPassword) {
            ctx.addIssue({
                code: "custom",
                message: "SMTP Password is required",
                path: ["smtpPassword"],
            });
        }
    }
});

export type EmailFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: EmailFormValues) => void;
    defaultValues?: Partial<EmailFormValues>;
};

export const EmailDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const { data: credentials } = useCredentialsByType(CredentialType.RESEND);

    const form = useForm<EmailFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: defaultValues.provider || "resend",
            variableName: defaultValues.variableName || "",
            smtpHost: defaultValues.smtpHost || "",
            smtpPort: defaultValues.smtpPort || 587,
            smtpUsername: defaultValues.smtpUsername || "",
            smtpPassword: defaultValues.smtpPassword || "",
            smtpSecure: defaultValues.smtpSecure ?? true,
            credentialId: defaultValues.credentialId || "",
            from: defaultValues.from || "",
            to: defaultValues.to || "",
            subject: defaultValues.subject || "",
            body: defaultValues.body || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                provider: defaultValues.provider || "resend",
                variableName: defaultValues.variableName || "",
                smtpHost: defaultValues.smtpHost || "",
                smtpPort: defaultValues.smtpPort || 587,
                smtpUsername: defaultValues.smtpUsername || "",
                smtpPassword: defaultValues.smtpPassword || "",
                smtpSecure: defaultValues.smtpSecure ?? true,
                credentialId: defaultValues.credentialId || "",
                from: defaultValues.from || "",
                to: defaultValues.to || "",
                subject: defaultValues.subject || "",
                body: defaultValues.body || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myEmail";
    const watchProvider = form.watch("provider");

    const handleSubmit = (values: EmailFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Email Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure the Email settings for this node using Resend or SMTP.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider</FormLabel>
                                    <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="resend">Resend</TabsTrigger>
                                            <TabsTrigger value="smtp">SMTP</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="resend" className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Resend:</strong> Simple API-based email delivery with a clean API.
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
                                                <p className="font-semibold">Setup Steps:</p>
                                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                                    <li>Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">resend.com</a></li>
                                                    <li>Navigate to API Keys section</li>
                                                    <li>Create a new API key</li>
                                                    <li>Add the API key as a credential in Settings → Credentials</li>
                                                    <li>Verify your domain to send from custom addresses</li>
                                                </ol>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="smtp" className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>SMTP:</strong> Use any SMTP server (Gmail, Hostinger, etc.).
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-md">
                                                <div>
                                                    <p className="font-semibold mb-1">Gmail Setup:</p>
                                                    <ol className="list-decimal list-inside space-y-1 ml-2">
                                                        <li>Host: <code className="bg-muted px-1 rounded">smtp.gmail.com</code></li>
                                                        <li>Port: <code className="bg-muted px-1 rounded">587</code> (TLS) or <code className="bg-muted px-1 rounded">465</code> (SSL)</li>
                                                        <li>Enable 2FA on your Google Account</li>
                                                        <li>Generate App Password: Account → Security → 2-Step Verification → App Passwords</li>
                                                        <li>Use your email as username and the App Password as password</li>
                                                    </ol>
                                                </div>
                                                <div>
                                                    <p className="font-semibold mb-1">Hostinger/Other SMTP:</p>
                                                    <ol className="list-decimal list-inside space-y-1 ml-2">
                                                        <li>Check your hosting provider's SMTP settings</li>
                                                        <li>Common format: <code className="bg-muted px-1 rounded">smtp.yourdomain.com</code></li>
                                                        <li>Use your email credentials (username and password)</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="myEmail"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Use this name to reference the result in other nodes:{" "} {`{{${watchVariableName}.id}}`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Resend Credential */}
                        {watchProvider === "resend" &&
                            (<>
                                <FormField
                                    control={form.control}
                                    name="credentialId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Resend Credential</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a credential" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {credentials?.map((cred) => (
                                                        <SelectItem key={cred.id} value={cred.id}>
                                                            {cred.name}
                                                        </SelectItem>
                                                    ))}
                                                    {(!credentials || credentials.length === 0) && (
                                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                                            No Resend credentials found. Add one in Settings.
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Select your Resend API key credential.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                            )}

                        {/* SMTP Provider */}
                        {watchProvider === "smtp" && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="smtpHost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SMTP Host</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="smtp.gmail.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Your SMTP server address
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="smtpPort"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SMTP Port</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="587"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Usually 587 (TLS) or 465 (SSL)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="smtpUsername"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="your-email@gmail.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Your SMTP username (usually your email address)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="smtpPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Your SMTP password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Your SMTP password (App Password for Gmail)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="smtpSecure"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Use TLS/SSL
                                                </FormLabel>
                                                <FormDescription>
                                                    Enable secure connection (recommended for port 587 or 465)
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="from"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={watchProvider === "resend" ? "onboarding@resend.dev" : "your-email@gmail.com"}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {watchProvider === "resend" ? "Must be a verified domain in Resend" : "Your email address"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="to"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="user@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Supports variables like {"{{trigger.email}}"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Hello {{trigger.name}}"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Body (HTML)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="<h1>Welcome {{trigger.name}}!</h1>"
                                            className="min-h-[150px] font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        HTML content supported. use {"{{variables}}"} for dynamic values.
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