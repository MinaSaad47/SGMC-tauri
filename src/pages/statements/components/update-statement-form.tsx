import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateStatementMutationOptions } from "@/lib/tanstack-query/statements";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  UpdateStatementSchema,
  type UpdateStatementSchema as UpdateStatementSchemaType,
} from "@/lib/types/statements";
import { useTranslation } from "react-i18next";

interface UpdateStatementFormProps {
  statementId: string;
  initialTotal: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UpdateStatementForm({
  statementId,
  initialTotal,
  onSuccess,
  onCancel,
}: UpdateStatementFormProps) {
  const { t } = useTranslation();
  const form = useForm<UpdateStatementSchemaType>({
    resolver: zodResolver(UpdateStatementSchema),
    defaultValues: {
      total: initialTotal,
    },
  });

  const updateMutation = useMutation({
    ...updateStatementMutationOptions(),
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = async (data: UpdateStatementSchemaType) => {
    updateMutation.mutate({
      id: statementId,
      updateStatement: data,
    });
  };

  const isValid = form.formState.isValid;
  const loading = updateMutation.isPending;
  const disabled = !isValid || loading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="total"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("statements.total")}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="number"
              aria-invalid={fieldState.invalid}
              placeholder={t("statements.form.total_placeholder")}
              autoComplete="off"
              onChange={(e) => field.onChange(e.target.valueAsNumber * 100)} // Store as cents
              value={field.value / 100} // Display as units
            />
            <FieldDescription>
              {t("statements.form.total_description")}
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
          {loading && <Spinner className="mr-2" />}
          {t("common.update")}
        </Button>
      </div>
    </form>
  );
}
