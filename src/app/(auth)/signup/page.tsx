import { RegisterForm } from "@/app/features/auth/components/register-form";
import { requireUnAuth } from "@/lib/auth-utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your NodeWeave account and start building powerful automation workflows.",
  robots: {
    index: false,
    follow: false,
  },
};

const Page = async () => {
  await requireUnAuth();

  return (
    <div>
      <RegisterForm />
    </div>
  );
};

export default Page;
