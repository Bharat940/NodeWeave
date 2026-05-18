import { Polar } from "@polar-sh/sdk";

export const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN || "",
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "production",
});

/**
 * Ensures a Polar customer exists for the given user.
 * If not found (404), it creates one silently using the externalId.
 */
export const ensurePolarCustomer = async (user: { id: string; email: string; name?: string | null }) => {
    try {
        await polarClient.customers.getStateExternal({
            externalId: user.id,
        });
    } catch (error: any) {
        const is404 = error.response?.status === 404 || 
                      error.status === 404 || 
                      error.statusCode === 404 ||
                      error.message?.includes("404") ||
                      (typeof error.body === 'string' && error.body.includes("ResourceNotFound"));

        if (is404) {
            console.log(`[Polar Sync] Customer not found for user ${user.id}, creating...`);
            try {
                await polarClient.customers.create({
                    email: user.email,
                    externalId: user.id,
                    metadata: {
                        name: user.name || "",
                        syncedAt: new Date().toISOString(),
                    }
                });
                console.log(`[Polar Sync] Successfully created customer for user ${user.id}`);
            } catch (createError) {
                console.error("[Polar Sync] Failed to create customer:", createError);
            }
        } else {
            console.error("[Polar Sync] Error checking customer state:", error);
        }
    }
};

export const isUserPremium = async (userId: string) => {
    try {
        const customer = await polarClient.customers.getStateExternal({
            externalId: userId,
        });

        return !!(customer.activeSubscriptions && customer.activeSubscriptions.length > 0);
    } catch (error) {
        console.error("Error checking subscription status:", error);
        return false;
    }
}