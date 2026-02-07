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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    provider: z.enum(["twilio", "meta"], {
        message: "Please select a provider",
    }),
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Variable name must start with a letter or underscore and contains only letters, numbers, and underscores.",
        }),
    // Twilio-specific fields
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    fromNumber: z.string().optional(),
    // Meta-specific fields
    accessToken: z.string().optional(),
    phoneNumberId: z.string().optional(),
    // Common fields
    toNumber: z
        .string()
        .min(1, "To number is required")
        .refine(
            (val) => /^\+[1-9]\d{1,14}$/.test(val) || /\{\{.+?\}\}/.test(val),
            {
                message: "Phone number must be in E.164 format (e.g., +919876543210) or a variable like {{whatsapp.from}}",
            }
        ),
    content: z
        .string()
        .min(1, "Message content is required")
        .max(1600, "WhatsApp messages cannot exceed 1600 characters"),
}).superRefine((data, ctx) => {
    // Validate Twilio-specific fields
    if (data.provider === "twilio") {
        if (!data.accountSid) {
            ctx.addIssue({
                code: "custom",
                message: "Account SID is required for Twilio",
                path: ["accountSid"],
            });
        } else if (!/^AC[a-f0-9]{32}$/.test(data.accountSid)) {
            ctx.addIssue({
                code: "custom",
                message: "Account SID must start with 'AC' followed by 32 hex characters",
                path: ["accountSid"],
            });
        }

        if (!data.authToken) {
            ctx.addIssue({
                code: "custom",
                message: "Auth Token is required for Twilio",
                path: ["authToken"],
            });
        }

        if (!data.fromNumber) {
            ctx.addIssue({
                code: "custom",
                message: "From number is required for Twilio",
                path: ["fromNumber"],
            });
        } else if (!/^\+[1-9]\d{1,14}$/.test(data.fromNumber) && !/\{\{.+?\}\}/.test(data.fromNumber)) {
            ctx.addIssue({
                code: "custom",
                message: "Phone number must be in E.164 format (e.g., +14155238886) or a variable like {{whatsapp.from}}",
                path: ["fromNumber"],
            });
        }
    }

    // Validate Meta-specific fields
    if (data.provider === "meta") {
        if (!data.accessToken) {
            ctx.addIssue({
                code: "custom",
                message: "Access Token is required for Meta",
                path: ["accessToken"],
            });
        }

        if (!data.phoneNumberId) {
            ctx.addIssue({
                code: "custom",
                message: "Phone Number ID is required for Meta",
                path: ["phoneNumberId"],
            });
        }
    }
});

export type WhatsappFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<WhatsappFormValues>;
};

export const WhatsappDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: defaultValues.provider || "twilio",
            variableName: defaultValues.variableName || "",
            accountSid: defaultValues.accountSid || "",
            authToken: defaultValues.authToken || "",
            fromNumber: defaultValues.fromNumber || "+14155238886",
            accessToken: defaultValues.accessToken || "",
            phoneNumberId: defaultValues.phoneNumberId || "",
            toNumber: defaultValues.toNumber || "",
            content: defaultValues.content || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                provider: defaultValues.provider || "twilio",
                variableName: defaultValues.variableName || "",
                accountSid: defaultValues.accountSid || "",
                authToken: defaultValues.authToken || "",
                fromNumber: defaultValues.fromNumber || "+14155238886",
                accessToken: defaultValues.accessToken || "",
                phoneNumberId: defaultValues.phoneNumberId || "",
                toNumber: defaultValues.toNumber || "",
                content: defaultValues.content || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myWhatsapp";
    const watchProvider = form.watch("provider");

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-scroll">
                <DialogHeader>
                    <DialogTitle>
                        WhatsApp Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure WhatsApp settings using Twilio or Meta Business API.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 mt-4"
                    >
                        {/* Provider Selection with Tabs */}
                        <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider</FormLabel>
                                    <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="twilio">Twilio</TabsTrigger>
                                            <TabsTrigger value="meta">Meta Business API</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="twilio" className="mt-2">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Twilio:</strong> Easy setup, sandbox for testing. Good for quick prototyping.
                                            </p>
                                        </TabsContent>
                                        <TabsContent value="meta" className="mt-2">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Meta:</strong> Free messages, requires business verification. Best for production.
                                            </p>
                                        </TabsContent>
                                    </Tabs>
                                    <FormMessage />
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
                                            placeholder="myWhatsapp"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Use this name to reference the result in other nodes:{" "} {`{{${watchVariableName}.messageSid}}`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Conditional Provider-Specific Fields */}
                        {watchProvider === "twilio" && (
                            <>
                                <div className="grid grid-cols-2 gap-4 items-start">
                                    <FormField
                                        control={form.control}
                                        name="accountSid"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Account SID
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    <strong>How to find:</strong> Go to <a href="https://console.twilio.com" target="_blank" className="underline">console.twilio.com</a> → Dashboard → Copy Account SID (starts with AC...)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="authToken"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Auth Token
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Your Twilio Auth Token"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    <strong>How to find:</strong> Go to <a href="https://console.twilio.com" target="_blank" className="underline">console.twilio.com</a> → Dashboard → Click "Show" next to Auth Token
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="fromNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                From Number (Twilio)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="+14155238886"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                <strong>Sandbox:</strong> Use +14155238886. <strong>Production:</strong> Buy a Twilio number and enable WhatsApp on it.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {watchProvider === "meta" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="accessToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Access Token
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Your Meta permanent access token"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                <strong>Steps:</strong> 1) Go to <a href="https://business.facebook.com" target="_blank" className="underline">business.facebook.com</a> → Business Settings → System Users → Add. 2) Assign your WhatsApp app. 3) Generate Token with whatsapp_business_messaging permission.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumberId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Phone Number ID
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="123456789012345"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                <strong>How to find:</strong> Go to <a href="https://developers.facebook.com" target="_blank" className="underline">developers.facebook.com</a> → My Apps → Your App → WhatsApp → API Setup → Look under "From" section for Phone Number ID (15-digit number)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Common Fields */}
                        <FormField
                            control={form.control}
                            name="toNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        To Number (Recipient)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+919876543210"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        <strong>Format:</strong> Must be E.164 format with country code (e.g., +919876543210 for India, +14155238886 for USA). No spaces or dashes.
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
                                    <Textarea
                                        placeholder="Hello! Your workflow result: {{myGemini.text}}"
                                        className="min-h-[80px] font-mono text-sm"
                                        {...field}
                                    />
                                    <FormDescription>
                                        The message to send. Use {"{{variables}}"} for dynamic content.
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