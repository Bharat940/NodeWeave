"use client";

import { PlusIcon } from "lucide-react";
import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { NodeSelector } from "@/components/node-selector";

export const AddNodeButton = memo(() => {
    const [selectorOpen, setSelectorOper] = useState(false);

    return (
        <NodeSelector open={selectorOpen} onOpenChange={setSelectorOper}>
            <Button
                onClick={() => setSelectorOper(true)}
                size="icon"
                variant="outline"
                className="bg-background"
            >
                <PlusIcon />
            </Button>
        </NodeSelector>
    )
});

AddNodeButton.displayName = "AddNodeButton"