import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  UpdatePatientSchema,
  type UpdatePatientSchema as UpdatePatientSchemaType,
} from "@/lib/types/patients";
import { updatePatientMutationOptions } from "@/lib/tanstack-query/patients";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useTranslation } from "react-i18next";

interface PatientDetailsFormProps {
  patient: {
    id: string;
    name: string;
    phone: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function PatientDetailsForm({
  patient,
  onSuccess,
  onCancel,
}: PatientDetailsFormProps) {
  const { t } = useTranslation();
  const form = useForm<UpdatePatientSchemaType>({
    resolver: zodResolver(UpdatePatientSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone,
    },
  });

  const updateMutation = useMutation({
    ...updatePatientMutationOptions(),
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = async (data: UpdatePatientSchemaType) => {
    updateMutation.mutate({
      id: patient.id,
      updatePatient: data,
    });
  };

  const isValid = form.formState.isValid;
  const loading = updateMutation.isPending;
  const disabled = !isValid || loading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("patients.form.name_label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t("patients.form.name_placeholder")}
                autoComplete="off"
              />
              <FieldDescription>
                {t("patients.form.name_description")}
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t("patients.form.phone_label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t("patients.form.phone_placeholder")}
                autoComplete="off"
              />
              <FieldDescription>
                {t("patients.form.phone_description")}
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={disabled}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={disabled}>
          {loading && <Spinner />}
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
