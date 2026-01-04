import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addSessionMutationOptions,
  deleteSessionMutationOptions,
  updateSessionMutationOptions,
} from "@/lib/tanstack-query/sessions";
import {
  Session,
  AddSessionSchema,
  UpdateSessionSchema,
} from "@/lib/types/sessions";
import { formatDate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface SessionFormProps {
  statementId: string;
  initialData?: Session;
  onSuccess: () => void;
  onCancel: () => void;
}

function SessionForm({
  statementId,
  initialData,
  onSuccess,
  onCancel,
}: SessionFormProps) {
  const { t } = useTranslation();
  const isEditing = !!initialData;
  const schema = isEditing
    ? UpdateSessionSchema
    : AddSessionSchema.pick({ procedure: true });
  type SchemaType = z.infer<typeof schema>;

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      procedure: initialData?.procedure || "",
    },
  });

  const addMutation = useMutation({
    ...addSessionMutationOptions(),
    onSuccess,
  });

  const updateMutation = useMutation({
    ...updateSessionMutationOptions(),
    onSuccess,
  });

  const onSubmit = (data: SchemaType) => {
    if (isEditing) {
      updateMutation.mutate({
        id: initialData.id,
        updateSession: data as UpdateSessionSchema,
      });
    } else {
      addMutation.mutate({
        statementId,
        procedure: (data as any).procedure,
      });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel>{t("statements.sessions.procedure")}</FieldLabel>
        <Input
          {...form.register("procedure")}
          placeholder={t("statements.sessions.procedure_placeholder")}
          disabled={isPending}
        />
        {form.formState.errors.procedure && (
          <FieldError errors={[form.formState.errors.procedure]} />
        )}
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="mr-2" />}
          {isEditing ? t("common.update") : t("common.add")}
        </Button>
      </div>
    </form>
  );
}

export function SessionsList({
  statementId,
  sessions,
}: {
  statementId: string;
  sessions: Session[];
}) {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);

  const deleteMutation = useMutation({
    ...deleteSessionMutationOptions(),
    onSuccess: () => setDeletingSession(null),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("statements.sessions.title")}</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="me-2 h-4 w-4" />
              {t("statements.sessions.add_session")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("statements.sessions.add_new_session")}</DialogTitle>
            </DialogHeader>
            <SessionForm
              statementId={statementId}
              onSuccess={() => setIsAddOpen(false)}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("statements.sessions.procedure")}</TableHead>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  {t("statements.sessions.no_sessions")}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.procedure}</TableCell>
                  <TableCell>{formatDate(session.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingSession(session)}
                        >
                          <Pencil className="me-2 h-4 w-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeletingSession(session)}
                        >
                          <Trash className="me-2 h-4 w-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("statements.sessions.edit_session")}</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <SessionForm
              statementId={statementId}
              initialData={editingSession}
              onSuccess={() => setEditingSession(null)}
              onCancel={() => setEditingSession(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingSession}
        onOpenChange={(open) => !open && setDeletingSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.cannot_be_undone")} {t("statements.sessions.delete_session_confirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deletingSession && deleteMutation.mutate(deletingSession.id)
              }
            >
              {deleteMutation.isPending && (
                <Spinner className="me-2 text-white" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
