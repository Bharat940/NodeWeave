import { credentialsRouters } from "@/app/features/credentials/server/routers";
import { createTRPCRouter,} from "../init";
import { workflowRouters } from "@/app/features/workflows/server/routers";
import { executionsRouters } from "@/app/features/executions/server/routers";

export const appRouter = createTRPCRouter({
  workflows: workflowRouters,
  credentials: credentialsRouters,
  executions: executionsRouters
});
// export type definition of API
export type AppRouter = typeof appRouter;
