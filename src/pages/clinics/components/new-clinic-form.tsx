import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addClinicMutationOptions } from "@/lib/tanstack-query/clinics";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { AddClinicSchema } from "@/lib/types/clinics";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NewClinicFormProps {
  onSuccess?: () => void;
}

export function NewClinicForm({ onSuccess }: NewClinicFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<AddClinicSchema>({
    resolver: zodResolver(AddClinicSchema),
    defaultValues: {
      name: "",
    },
  });

  const addMutation = useMutation({
    ...addClinicMutationOptions(),
    onSuccess: () => {
      onSuccess?.();
      navigate("/clinics");
    },
  });

  const onSubmit = async (data: AddClinicSchema) => {
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
              placeholder={t("clinics.form.name_placeholder")}
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
          onClick={() => navigate("/clinics")}
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
