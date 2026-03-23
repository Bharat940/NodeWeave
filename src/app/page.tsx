import { redirect } from "next/navigation";

export default function RootPage() {
    // Redirect to workflows as the primary entry point
    redirect("/workflows");
}
