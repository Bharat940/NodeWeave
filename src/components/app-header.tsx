import { SidebarTrigger } from "./ui/sidebar";
import { ThemeToggle } from "./theme-toggle";

export const AppHeader = () => {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 bg-background drop-shadow-sm">
            <SidebarTrigger />
            <ThemeToggle />
        </header>
    )
}