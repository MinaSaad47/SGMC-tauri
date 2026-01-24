import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDoctorsQueryOptions, updateDoctorMutationOptions, deleteDoctorMutationOptions } from "@/lib/tanstack-query/doctors";
import { Doctor, UpdateDoctorSchema } from "@/lib/types/doctors";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { RestrictiveDeleteDialog } from "@/components/restrictive-delete-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function EditDoctorForm({ doctor, onSuccess }: { doctor: Doctor; onSuccess: () => void }) {
  const { t } = useTranslation();
  const form = useForm<UpdateDoctorSchema>({
    resolver: zodResolver(UpdateDoctorSchema),
    defaultValues: {
      name: doctor.name,
      phone: doctor.phone || "",
    },
  });

  const updateMutation = useMutation({
    ...updateDoctorMutationOptions(),
    onSuccess: () => onSuccess(),
  });

  const onSubmit = (data: UpdateDoctorSchema) => {
    updateMutation.mutate({ id: doctor.id, updateDoctor: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>{t("common.name")}</FieldLabel>
            <Input {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>{t("common.phone")}</FieldLabel>
            <Input {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Spinner className="mr-2" />}
          {t("common.update")}
        </Button>
      </div>
    </form>
  );
}

export function DoctorsTable() {
  const { t } = useTranslation();
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  
  const doctorsQuery = useQuery(getDoctorsQueryOptions());

  const deleteMutation = useMutation({
    ...deleteDoctorMutationOptions(),
    onSuccess: () => setDeletingDoctor(null),
  });

  if (doctorsQuery.isPending) return <div>{t("common.loading")}</div>;
  if (doctorsQuery.isError) return <div>{t("common.error")}</div>;

  const doctors = doctorsQuery.data || [];

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.phone")}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>{doctor.name}</TableCell>
                <TableCell>{doctor.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingDoctor(doctor)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeletingDoctor(doctor)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {t("common.no_data")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          {editingDoctor && (
            <EditDoctorForm doctor={editingDoctor} onSuccess={() => setEditingDoctor(null)} />
          )}
        </DialogContent>
      </Dialog>

      <RestrictiveDeleteDialog
        open={!!deletingDoctor}
        onOpenChange={(open) => !open && setDeletingDoctor(null)}
        onConfirm={() => deletingDoctor && deleteMutation.mutate(deletingDoctor.id)}
        title={t("common.are_you_sure")}
        description={t("common.cannot_be_undone")}
        entityName={deletingDoctor?.name}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
