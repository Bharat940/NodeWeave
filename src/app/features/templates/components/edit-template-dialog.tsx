"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().optional(),
  isFeatured: z.boolean(),
});

type EditTemplateFormValues = z.infer<typeof formSchema>;

interface EditTemplateDialogProps {
  template: {
    id: string;
    name: string;
    description: string;
    icon: string | null;
    isFeatured: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTemplateDialog({
  template,
  open,
  onOpenChange,
}: EditTemplateDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<EditTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template.name,
      description: template.description,
      icon: template.icon || "layout",
      isFeatured: template.isFeatured,
    },
  });

  const updateMutation = useMutation(
    trpc.template.update.mutationOptions({
      onSuccess: () => {
        toast.success("Template updated successfully");
        queryClient.invalidateQueries({ queryKey: trpc.template.getById.queryKey({ id: template.id }) });
        queryClient.invalidateQueries({ queryKey: trpc.template.getFeatured.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.template.getMany.queryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update template");
      },
    })
  );

  function onSubmit(values: EditTemplateFormValues) {
    updateMutation.mutate({
      id: template.id,
      ...values,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b bg-muted/30">
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update the template metadata. These changes will be visible to all users.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Stripe to Discord sync" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain what this template does..." 
                      className="min-h-[120px] resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="layout">Default</SelectItem>
                        
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Triggers</div>
                        <SelectItem value="manual">Manual Trigger</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="cron">Schedule (Cron)</SelectItem>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="google-form">Google Form</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="email">Email (Resend)</SelectItem>

                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI & Intelligence</div>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>

                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Communication</div>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>

                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logic & Dev</div>
                        <SelectItem value="condition">If/Else Condition</SelectItem>
                        <SelectItem value="transformer">Data Transformer</SelectItem>
                        <SelectItem value="code">Custom Code</SelectItem>
                        <SelectItem value="delay">Delay / Wait</SelectItem>
                        <SelectItem value="http">HTTP Request</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="mb-0 cursor-pointer">Featured</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <DialogFooter className="pt-4 sm:pt-6 gap-3 flex-col sm:flex-row">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
