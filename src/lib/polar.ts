import { Polar } from "@polar-sh/sdk";

export const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN || "",
    server: "sandbox",
});

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