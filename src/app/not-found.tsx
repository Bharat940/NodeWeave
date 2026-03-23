import Link from "next/link";
import { MoveLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
            
            <div className="relative glass-card max-w-md w-full p-8 md:p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-primary/20">
                    <Search className="size-10 text-primary animate-pulse" />
                </div>
                
                <h1 className="text-7xl font-bold tracking-tighter text-primary mb-2">404</h1>
                <h2 className="text-2xl font-semibold mb-4 italic">The weave is tangled.</h2>
                
                <p className="text-muted-foreground mb-8 leading-relaxed">
                    We couldn't find the path you were looking for. 
                    It might have been moved, deleted, or never existed in this thread of the weave.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button asChild className="flex-1 shadow-lg shadow-primary/20 cursor-pointer" size="lg">
                        <Link href="/workflows">
                            <MoveLeft className="mr-2 size-4" />
                            Back to Workflows
                        </Link>
                    </Button>
                </div>
                
                <p className="mt-8 text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-50">
                    NodeWeave &bull; Automation Redefined
                </p>
            </div>
        </div>
    );
}
