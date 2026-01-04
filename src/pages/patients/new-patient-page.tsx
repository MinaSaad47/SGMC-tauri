import { AddPatientSchema } from "@/lib/types/patients";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { addPatientMutationOptions } from "@/lib/tanstack-query/patients";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function NewPatientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<AddPatientSchema>({
    defaultValues: {
      name: "",
      phone: "",
    },
    resolver: zodResolver(AddPatientSchema),
  });

  const addPatient = useMutation({
    ...addPatientMutationOptions(),
    onSuccess: () => {
      form.reset();
      navigate("/patients");
    },
  });

  const onSubmit = async (data: AddPatientSchema) => {
    addPatient.mutate(data);
  };

  const isValid = form.formState.isValid;
  const loading = addPatient.isPending;
  const disabled = !isValid || loading;

  return (
    <div className="container mx-auto py-6 px-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("patients.add_new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={disabled}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {loading && <Spinner className="mr-2" />}
            {t("patients.save")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default NewPatientPage;
