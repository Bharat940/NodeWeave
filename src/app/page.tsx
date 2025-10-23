"use client"


import { useTRPC } from "@/trpc/client";
// import { requireAuth } from "@/lib/auth-utils";
// import { caller } from "@/trpc/server";
import LogoutButton from "./logout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const Page = () => {
  // await requireAuth();

  // const data = await caller.getUsers();

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.getWorkflows.queryOptions())

  const create = useMutation(trpc.createWorkFlow.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.getWorkflows.queryOptions());
    }
  }))

  const testAi = useMutation(trpc.testAi.mutationOptions())

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
      Protected Server components
      <div>{JSON.stringify(data, null, 2)}</div>
      <Button onClick={() => testAi.mutate()} disabled={testAi.isPending}>Test AI</Button>
      <Button onClick={() => create.mutate()} disabled={create.isPending}>Create Workflow</Button>
      <LogoutButton />
    </div>
  );
};

export default Page;
