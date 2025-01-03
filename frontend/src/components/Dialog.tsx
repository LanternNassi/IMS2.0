import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import React from "react";

interface DialogProps {
    heading: string;
    description: string;
    triggerComponent: React.ReactNode;
    continueButtonText: string;
    cancelButtonText: string;
    onContinue: () => void;
    onCancel: () => void;
}

const Dialog: React.FC<DialogProps> = ({
    heading,
    description,
    triggerComponent,
    continueButtonText,
    cancelButtonText,
    onContinue,
    onCancel,
}) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {triggerComponent}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{heading}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>{description}</AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>{cancelButtonText}</AlertDialogCancel>
                    <AlertDialogAction onClick={onContinue}>{continueButtonText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default Dialog;
