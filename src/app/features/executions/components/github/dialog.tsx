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
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CredentialType } from "@/generated/prisma/browser";
import { useCredentialsByType } from "@/app/features/credentials/hooks/use-credentials";
import Image from "next/image";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Variable name must start with a letter or underscore and contains only letters, numbers, and underscores.",
        }),
    credentialId: z.string().min(1, "GitHub Credential is required"),
    owner: z.string().min(1, "Repository owner is required"),
    repo: z.string().min(1, "Repository name is required"),
    issueNumber: z.string().min(1, "Issue/PR number is required"),
    commentBody: z.string().min(1, "Comment body is required"),
});

export type GitHubFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<GitHubFormValues>;
};

export const GitHubDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {

    const {
        data: credentials,
        isLoading: isLoadingCredentials,
    } = useCredentialsByType(CredentialType.GITHUB);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "",
            credentialId: defaultValues.credentialId || "",
            owner: defaultValues.owner || "",
            repo: defaultValues.repo || "",
            issueNumber: defaultValues.issueNumber || "",
            commentBody: defaultValues.commentBody || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "",
                credentialId: defaultValues.credentialId || "",
                owner: defaultValues.owner || "",
                repo: defaultValues.repo || "",
                issueNumber: defaultValues.issueNumber || "",
                commentBody: defaultValues.commentBody || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myGitHub";

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        GitHub Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure GitHub to post a comment on an issue or pull request.
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
                                            placeholder="myGitHub"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Use this name to reference the result in other nodes:{" "} {`{{${watchVariableName}.commentUrl}}`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="credentialId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        GitHub Credential
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoadingCredentials || !credentials?.length}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a credential" />
                                            </SelectTrigger>
                                        </FormControl>

                                        <SelectContent>
                                            {credentials?.map((credential) => (
                                                <SelectItem
                                                    key={credential.id}
                                                    value={credential.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Image
                                                            src="/logos/github.svg"
                                                            alt="GitHub"
                                                            width={16}
                                                            height={16}
                                                        />
                                                        {credential.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Select a GitHub Personal Access Token (PAT) credential
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="owner"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Repository Owner
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="{{github.repository.owner.login}}"
                                                className="font-mono text-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Username or organization
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="repo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Repository Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="{{github.repository.name}}"
                                                className="font-mono text-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Repository name
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="issueNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Issue/PR Number
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="{{github.number}}"
                                            className="font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Issue or Pull Request number
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="commentBody"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comment Body</FormLabel>
                                    <Textarea
                                        placeholder="AI Analysis: {{myAI.text}}"
                                        className="min-h-[120px] font-mono text-sm"
                                        {...field}
                                    />
                                    <FormDescription>
                                        The comment to post. Use {"{{variables}}"} for simple values or {"{{json variable}}"} to stringify objects
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
