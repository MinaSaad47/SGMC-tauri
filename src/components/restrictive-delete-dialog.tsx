import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface RestrictiveDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  entityName?: string;
  isPending?: boolean;
}

export function RestrictiveDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  entityName,
  isPending,
}: RestrictiveDeleteDialogProps) {
  const { t } = useTranslation();
  const [verificationNumber, setVerificationNumber] = useState("");
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (open) {
      // Generate a random 4-digit number when dialog opens
      setVerificationNumber(Math.floor(1000 + Math.random() * 9000).toString());
      setUserInput("");
    }
  }, [open]);

  const isValid = userInput === verificationNumber;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p>{description}</p>
              {entityName && (
                <p className="mt-2 font-medium text-foreground">
                  {t("common.deleting_entity")}: <span className="font-bold text-destructive">{entityName}</span>
                </p>
              )}
            </div>
            <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-start">
              <Label className="text-destructive font-bold block mb-2 text-start">
                {t("common.security_check")}
              </Label>
              <p className="text-sm mb-2">
                {t("common.type_number_to_confirm", { number: verificationNumber })}
              </p>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono font-bold tracking-widest select-none bg-background p-2 rounded border">
                  {verificationNumber}
                </div>
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="0000"
                  className="font-mono text-lg tracking-widest w-24 text-center"
                  maxLength={4}
                  autoComplete="off"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!isValid || isPending}
            onClick={onConfirm}
          >
            {isPending ? t("common.deleting") : t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}