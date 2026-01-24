import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClinicsQueryOptions, updateClinicMutationOptions, deleteClinicMutationOptions } from "@/lib/tanstack-query/clinics";
import { Clinic, UpdateClinicSchema } from "@/lib/types/clinics";
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

function EditClinicForm({ clinic, onSuccess }: { clinic: Clinic; onSuccess: () => void }) {
  const { t } = useTranslation();
  const form = useForm<UpdateClinicSchema>({
    resolver: zodResolver(UpdateClinicSchema),
    defaultValues: {
      name: clinic.name,
    },
  });

  const updateMutation = useMutation({
    ...updateClinicMutationOptions(),
    onSuccess: () => onSuccess(),
  });

  const onSubmit = (data: UpdateClinicSchema) => {
    updateMutation.mutate({ id: clinic.id, updateClinic: data });
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
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Spinner className="mr-2" />}
          {t("common.update")}
        </Button>
      </div>
    </form>
  );
}

export function ClinicsTable() {
  const { t } = useTranslation();
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null);
  
  const clinicsQuery = useQuery(getClinicsQueryOptions());

  const deleteMutation = useMutation({
    ...deleteClinicMutationOptions(),
    onSuccess: () => setDeletingClinic(null),
  });

  if (clinicsQuery.isPending) return <div>{t("common.loading")}</div>;
  if (clinicsQuery.isError) return <div>{t("common.error")}</div>;

  const clinics = clinicsQuery.data || [];

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map((clinic) => (
              <TableRow key={clinic.id}>
                <TableCell>{clinic.name}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingClinic(clinic)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeletingClinic(clinic)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {clinics.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  {t("common.no_data")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingClinic} onOpenChange={(open) => !open && setEditingClinic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          {editingClinic && (
            <EditClinicForm clinic={editingClinic} onSuccess={() => setEditingClinic(null)} />
          )}
        </DialogContent>
      </Dialog>

      <RestrictiveDeleteDialog
        open={!!deletingClinic}
        onOpenChange={(open) => !open && setDeletingClinic(null)}
        onConfirm={() => deletingClinic && deleteMutation.mutate(deletingClinic.id)}
        title={t("common.are_you_sure")}
        description={t("common.cannot_be_undone")}
        entityName={deletingClinic?.name}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}