import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addPaymentMutationOptions } from "@/lib/tanstack-query/payments";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { AddPaymentSchema } from "@/lib/types/payments";
import { useTranslation } from "react-i18next";

interface NewPaymentFormProps {
  statementId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewPaymentForm({
  statementId,
  onSuccess,
  onCancel,
}: NewPaymentFormProps) {
  const { t } = useTranslation();
  const form = useForm<AddPaymentSchema>({
    resolver: zodResolver(AddPaymentSchema),
    defaultValues: {
      statementId,
      amount: 0,
    },
  });

  const addMutation = useMutation({
    ...addPaymentMutationOptions(),
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = async (data: AddPaymentSchema) => {
    addMutation.mutate(data);
  };

  const isValid = form.formState.isValid;
  const loading = addMutation.isPending;
  const disabled = !isValid || loading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="amount"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              {t("statements.payments.form.amount_label")}
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="number"
              aria-invalid={fieldState.invalid}
              placeholder={t("statements.payments.form.amount_placeholder")}
              autoComplete="off"
              onChange={(e) => field.onChange(e.target.valueAsNumber * 100)} // Store as cents
              value={field.value / 100} // Display as dollars/pounds
            />
            <FieldDescription>
              {t("statements.payments.form.amount_description")}
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={disabled}>
          {loading && <Spinner />}
          {t("statements.payments.add_payment")}
        </Button>
      </div>
    </form>
  );
}
