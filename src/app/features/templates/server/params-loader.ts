import { createLoader } from "nuqs/server";
import { workflowsParams } from "@/app/features/workflows/params";

export const templatesParamsLoader = createLoader(workflowsParams);
