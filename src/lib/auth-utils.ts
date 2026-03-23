import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { ensurePolarCustomer } from "./polar";

export const requireAuth = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // Silent sync Polar customer if they don't exist
  // We don't await this to avoid blocking the initial page load, 
  // but it will run in the background.
  ensurePolarCustomer(session.user).catch(err => {
    console.error("[Auth Utils] Failed to sync Polar customer:", err);
  });

  return session;
};

export const requireUnAuth = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/");
  }
};
