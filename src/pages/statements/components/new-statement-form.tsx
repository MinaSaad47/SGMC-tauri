import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addStatementMutationOptions } from "@/lib/tanstack-query/statements";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  AddStatementSchema,
  type AddStatementSchema as AddStatementSchemaType,
} from "@/lib/types/statements";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NewStatementFormProps {
  patientId: string;
  onSuccess: () => void;
}

// We only need the 'total' from the form, patientId comes from props
const FormSchema = AddStatementSchema.pick({ total: true });
type FormSchemaType = Pick<AddStatementSchemaType, "total">;

export function NewStatementForm({
  patientId,
  onSuccess,
}: NewStatementFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      total: 0,
    },
  });

  const addMutation = useMutation({
    ...addStatementMutationOptions(),
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    addMutation.mutate({
      patientId,
      total: data.total,
    });
  };

  const isValid = form.formState.isValid;
  const loading = addMutation.isPending;
  const disabled = !isValid || loading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
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
              value={field.value / 100} // Display as dollars/pounds
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
          onClick={() => navigate(`/patients/${patientId}`)}
          disabled={loading}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={disabled}>
          {loading && <Spinner />}
          {t("statements.create")}
        </Button>
      </div>
    </form>
  );
}
