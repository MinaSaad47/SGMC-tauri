import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deletePaymentMutationOptions,
  updatePaymentMutationOptions,
} from "@/lib/tanstack-query/payments";
import { Payment, UpdatePaymentSchema } from "@/lib/types/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentFormProps {
  statementId: string;
  initialData: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditPaymentForm({
  statementId,
  initialData,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const { t } = useTranslation();
  const form = useForm<UpdatePaymentSchema>({
    resolver: zodResolver(UpdatePaymentSchema),
    defaultValues: {
      amount: initialData.amount,
    },
  });

  const updateMutation = useMutation({
    ...updatePaymentMutationOptions(statementId),
    onSuccess,
  });

  const onSubmit = (data: UpdatePaymentSchema) => {
    updateMutation.mutate({
      id: initialData.id,
      updatePayment: data,
    });
  };

  const isPending = updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="amount"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>{t("common.amount")}</FieldLabel>
            <Input
              {...field}
              type="number"
              placeholder={t("common.amount")}
              onChange={(e) => field.onChange(e.target.valueAsNumber * 100)}
              value={field.value / 100}
              disabled={isPending}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="mr-2" />}
          {t("common.update")}
        </Button>
      </div>
    </form>
  );
}

export function PaymentsList({
  statementId,
  payments,
}: {
  statementId: string;
  payments: Payment[];
}) {
  const { t } = useTranslation();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const deleteMutation = useMutation({
    ...deletePaymentMutationOptions(statementId),
    onSuccess: () => setDeletingPayment(null),
  });

  if (payments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {t("statements.payments.no_payments")}
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead className="text-end">
                {t("statements.payments.form.amount_label")}
              </TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.createdAt)}</TableCell>
                <TableCell className="text-end">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingPayment(payment)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeletingPayment(payment)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingPayment}
        onOpenChange={(open) => !open && setEditingPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("common.edit")} {t("common.amount")}
            </DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <EditPaymentForm
              statementId={statementId}
              initialData={editingPayment}
              onSuccess={() => setEditingPayment(null)}
              onCancel={() => setEditingPayment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingPayment}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.cannot_be_undone")}{" "}
              {t("statements.payments.no_payments")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deletingPayment && deleteMutation.mutate(deletingPayment.id)
              }
            >
              {deleteMutation.isPending && (
                <Spinner className="mr-2 text-white" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
