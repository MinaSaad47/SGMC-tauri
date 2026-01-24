import { useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getStatementDetailsQueryOptions, deleteStatementMutationOptions } from "@/lib/tanstack-query/statements";
import { LoadingMessage } from "@/components/table-loading";
import { ErrorMessage } from "@/components/error-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Pencil, Printer, Stethoscope, Building2, Trash } from "lucide-react";
import { NewPaymentForm } from "./components/new-payment-form";
import { UpdateStatementForm } from "./components/update-statement-form";
import { PrintableStatement } from "./components/printable-statement";
import { useReactToPrint } from "react-to-print";
import { RestrictiveDeleteDialog } from "@/components/restrictive-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SessionsList } from "./components/sessions-list";
import { PaymentsList } from "./components/payments-list";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/status-badge";

function StatementDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const statementDetails = useQuery(getStatementDetailsQueryOptions(id!));

  const deleteMutation = useMutation({
    ...deleteStatementMutationOptions(),
    onSuccess: () => navigate("/statements"),
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Statement-${id}`,
  });

  if (deleteMutation.isSuccess) return null;

  if (statementDetails.isPending) {
    return <LoadingMessage message={t("statements.loading_details")} />;
  }

  if (statementDetails.isError) {
    return <ErrorMessage error={statementDetails.error} />;
  }

  const statement = statementDetails.data;

  if (!statement) {
    return <ErrorMessage error={new Error(t("statements.not_found"))} />;
  }

  const status: "Paid" | "Partial" | "Unpaid" =
    statement.totalPaid >= statement.total
      ? "Paid"
      : statement.totalPaid > 0
        ? "Partial"
        : "Unpaid";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Top Section: Header & Main Info */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold">
              {t("statements.statement_for", { name: statement.patient.name })}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{statement.patient.phone}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Edit Button */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  {t("common.edit")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("common.edit")} {t("statements.details_title")}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <UpdateStatementForm
                    statementId={statement.id}
                    initialTotal={statement.total}
                    initialDoctorId={statement.doctor?.id}
                    initialClinicId={statement.clinic?.id}
                    onSuccess={() => setIsEditOpen(false)}
                    onCancel={() => setIsEditOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Print Button */}
            <Dialog open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  {t("common.print")}
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 shrink-0">
                  <DialogTitle>
                    {t("common.print")} {t("statements.details_title")}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
                  <div className="shadow-lg origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.8]">
                    <PrintableStatement ref={printRef} statement={statement} />
                  </div>
                </div>
                <div className="p-4 border-t flex justify-end shrink-0 bg-background">
                  <Button onClick={() => handlePrint()} className="w-full sm:w-auto">
                    <Printer className="me-2 h-4 w-4" />
                    {t("common.print")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Link to={`/patients/${statement.patient.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {t("common.view_patient")}
              </Button>
            </Link>

            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setIsDeleting(true)}>
              <Trash className="h-4 w-4" />
              {t("common.delete")}
            </Button>
          </div>
        </CardHeader>
        
        {(statement.doctor || statement.clinic) && (
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {statement.doctor && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("doctors.singular")}</p>
                    <p className="text-base font-semibold">{statement.doctor.name}</p>
                    {statement.doctor.phone && <p className="text-xs text-muted-foreground">{statement.doctor.phone}</p>}
                  </div>
                </div>
              )}
              {statement.clinic && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("clinics.singular")}</p>
                    <p className="text-base font-semibold">{statement.clinic.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t("financial.summary")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t("common.status")}
            </p>
            <StatusBadge status={status} className="text-lg" />
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t("financial.total_required")}
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(statement.total)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t("financial.total_paid")}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(statement.totalPaid)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t("financial.total_remaining")}
            </p>
            <p
              className={`text-2xl font-bold ${
                statement.totalRemaining > 0 ? "text-red-500" : ""
              }`}
            >
              {formatCurrency(statement.totalRemaining)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardContent className="pt-6">
          <SessionsList
            statementId={statement.id}
            sessions={statement.sessions}
          />
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("common.payment_history")}</CardTitle>
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("common.add_payment")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("common.add_payment")}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <NewPaymentForm
                  statementId={statement.id}
                  onSuccess={() => setIsAddPaymentOpen(false)}
                  onCancel={() => setIsAddPaymentOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <PaymentsList
            statementId={statement.id}
            payments={statement.payments}
          />
        </CardContent>
      </Card>

      <RestrictiveDeleteDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        onConfirm={() => deleteMutation.mutate(statement.id)}
        title={t("common.are_you_sure")}
        description={`${t("common.cannot_be_undone")} ${t("statements.delete_warning")}`}
        entityName={t("statements.statement_for", { name: statement.patient.name })}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export default StatementDetailsPage;
