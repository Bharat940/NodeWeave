import { LoginForm } from "@/app/features/auth/components/login-form";
import { requireUnAuth } from "@/lib/auth-utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your NodeWeave account to manage your automation workflows.",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = async () => {
  await requireUnAuth();

  return <LoginForm />;
};

export default Page;
