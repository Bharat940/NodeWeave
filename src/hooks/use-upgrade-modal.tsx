import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

export const useUpgradeModal = () => {
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    const handleError = (error: unknown) => {
        if (error instanceof TRPCClientError) {
            if (error.data?.code === "FORBIDDEN") {
                setErrorMessage(error.message);
                setOpen(true);
                return true;
            }
        }

        return false;
    };

    const modal = <UpgradeModal open={open} onOpenChange={setOpen} message={errorMessage} />

    return { handleError, modal };
};