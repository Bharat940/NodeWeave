import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background flex min-h-svh flex-col justify-center items-center gap-6 p-6 md:p-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image src="/logos/logo.svg" alt="NodeWeave" width={30} height={30} style={{ height: "auto" }} />
          NodeWeave
        </Link>
        <div>{children}</div>
      </div>
    </div>
  );
};
