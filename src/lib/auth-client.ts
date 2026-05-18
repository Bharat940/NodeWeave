import { polarClient } from "@polar-sh/better-auth/client";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
    plugins: [polarClient(), adminClient()],
});
