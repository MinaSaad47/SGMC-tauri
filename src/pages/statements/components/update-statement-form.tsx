import { Button } from "@/components/ui/button";
import
{
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import
{
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getClinicsQueryOptions } from "@/lib/tanstack-query/clinics";
import { getDoctorsQueryOptions } from "@/lib/tanstack-query/doctors";
import { updateStatementMutationOptions } from "@/lib/tanstack-query/statements";
import
{
  UpdateStatementSchema,
  type UpdateStatementSchema as UpdateStatementSchemaType,
} from "@/lib/types/statements";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface UpdateStatementFormProps {
  statementId: string;
  initialTotal: number;
  initialDoctorId?: string;
  initialClinicId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UpdateStatementForm({
  statementId,
  initialTotal,
  initialDoctorId,
  initialClinicId,
  onSuccess,
  onCancel,
}: UpdateStatementFormProps) {
  const { t } = useTranslation();

  const doctorsQuery = useQuery(getDoctorsQueryOptions());
  const clinicsQuery = useQuery(getClinicsQueryOptions());

  const form = useForm<UpdateStatementSchemaType>({
    resolver: zodResolver(UpdateStatementSchema),
    defaultValues: {
      total: initialTotal,
      doctorId: initialDoctorId,
      clinicId: initialClinicId,
    },
  });

  const updateMutation = useMutation({
    ...updateStatementMutationOptions(),
    onSuccess: () =>
    {
      onSuccess();
    }
  });

  const onSubmit = async (data: UpdateStatementSchemaType) => {
    updateMutation.mutate({
      id: statementId,
      updateStatement: data,
    },);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="doctorId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("doctors.title")}</FieldLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "null" ? null : val)}
                value={field.value || "null"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("doctors.select_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">{t("common.none")}</SelectItem>
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
              <Select
                onValueChange={(val) => field.onChange(val === "null" ? null : val)}
                value={field.value || "null"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("clinics.select_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">{t("common.none")}</SelectItem>
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
