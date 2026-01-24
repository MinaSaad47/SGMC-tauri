import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addStatementMutationOptions } from "@/lib/tanstack-query/statements";
import { getDoctorsQueryOptions } from "@/lib/tanstack-query/doctors";
import { getClinicsQueryOptions } from "@/lib/tanstack-query/clinics";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const FormSchema = AddStatementSchema.pick({ total: true, doctorId: true, clinicId: true });
type FormSchemaType = Pick<AddStatementSchemaType, "total" | "doctorId" | "clinicId">;

export function NewStatementForm({
  patientId,
  onSuccess,
}: NewStatementFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const doctorsQuery = useQuery(getDoctorsQueryOptions());
  const clinicsQuery = useQuery(getClinicsQueryOptions());

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      total: 0,
      doctorId: undefined,
      clinicId: undefined,
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
      doctorId: data.doctorId,
      clinicId: data.clinicId,
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
              onChange={(e) => field.onChange(e.target.valueAsNumber * 100)}
              value={field.value / 100}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="doctorId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("doctors.title")}</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder={t("doctors.select_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {doctorsQuery.data?.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name="clinicId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("clinics.title")}</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder={t("clinics.select_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clinicsQuery.data?.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>

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
