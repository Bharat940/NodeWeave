import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
    plugins: [polarClient(), adminClient()],
});
