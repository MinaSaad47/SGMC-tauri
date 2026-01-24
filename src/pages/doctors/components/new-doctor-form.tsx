import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addDoctorMutationOptions } from "@/lib/tanstack-query/doctors";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { AddDoctorSchema } from "@/lib/types/doctors";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NewDoctorFormProps {
  onSuccess?: () => void;
}

export function NewDoctorForm({ onSuccess }: NewDoctorFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<AddDoctorSchema>({
    resolver: zodResolver(AddDoctorSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const addMutation = useMutation({
    ...addDoctorMutationOptions(),
    onSuccess: () => {
      onSuccess?.();
      navigate("/doctors");
    },
  });

  const onSubmit = async (data: AddDoctorSchema) => {
    addMutation.mutate(data);
  };

  const isValid = form.formState.isValid;
  const loading = addMutation.isPending;
  const disabled = !isValid || loading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("common.name")}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={t("doctors.form.name_placeholder")}
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{t("common.phone")}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={t("doctors.form.phone_placeholder")}
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/doctors")}
          disabled={loading}
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
