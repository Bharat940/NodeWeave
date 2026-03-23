'use client';

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for debugging (e.g., Sentry, etc.)
        console.error("Critical Runtime Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-destructive/10 via-background to-background">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
            
            <div className="relative glass-card max-w-md w-full p-8 md:p-12 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-destructive/20 shadow-lg shadow-destructive/5">
                    <AlertCircle className="size-10 text-destructive animate-pulse" />
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight mb-2">Something went wrong</h1>
                <h2 className="text-lg text-muted-foreground mb-8 leading-relaxed italic">
                    A node failed to process its thread.
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button 
                        onClick={() => reset()} 
                        className="flex-1 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 cursor-pointer" 
                        size="lg"
                    >
                        <RotateCcw className="mr-2 size-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" className="flex-1 cursor-pointer" size="lg">
                        <Link href="/workflows">
                            <Home className="mr-2 size-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-border/50 w-full">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-50 mb-4">
                        Error Digest
                    </p>
                    <code className="text-[10px] bg-muted px-2 py-1 rounded font-mono text-muted-foreground break-all">
                        {error.digest || "RUNTIME_EXCEPTION_0x11"}
                    </code>
                </div>
            </div>
        </div>
    );
}
