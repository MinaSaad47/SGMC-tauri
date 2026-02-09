import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getStatementDetailsQueryOptions, deleteStatementMutationOptions } from "@/lib/tanstack-query/statements";
import { addAttachmentMutationOptions } from "@/lib/tanstack-query/attachments";
import { LoadingMessage } from "@/components/table-loading";
import { ErrorMessage } from "@/components/error-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Pencil, Printer, Stethoscope, Building2, Trash, Camera } from "lucide-react";
import { NewPaymentForm } from "./components/new-payment-form";
import { UpdateStatementForm } from "./components/update-statement-form";
import { PrintPreview } from "./components/print-preview";
import { RestrictiveDeleteDialog } from "@/components/restrictive-delete-dialog";
import { ScannerModal } from "@/components/scanner-modal";
import { ImageEditorModal } from "@/components/image-editor-modal";
import { AttachmentsList } from "./components/attachments-list";
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
  
  // Modals state
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingImageData, setEditingImageData] = useState<string | null>(null);
  
  const statementDetails = useQuery(getStatementDetailsQueryOptions(id!));

  const deleteMutation = useMutation({
    ...deleteStatementMutationOptions(),
    onSuccess: () => navigate("/statements"),
  });

  const addAttachmentMutation = useMutation({
    ...addAttachmentMutationOptions(),
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

  const handleScanReceived = (data: { mime: string; data: string }) => {
    setEditingImageData(data.data);
  };

  const handleSaveAttachment = (processedBase64: string) => {
    addAttachmentMutation.mutate({
      statementId: statement.id,
      fileData: processedBase64,
      fileName: `scan_${Date.now()}.jpg`,
      fileType: "image/jpeg",
    });
    setEditingImageData(null);
  };

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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsScannerOpen(true)}>
              <Camera className="h-4 w-4" />
              {t("scanner.scan_now")}
            </Button>

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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsPrintPreviewOpen(true)}>
              <Printer className="h-4 w-4" />
              {t("common.print")}
            </Button>

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

      {/* Attachments Section */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            {t("attachments.title")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsScannerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          <AttachmentsList statementId={statement.id} attachments={statement.attachments} />
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="border shadow-sm">
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
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <SessionsList
            statementId={statement.id}
            sessions={statement.sessions}
          />
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="border shadow-sm">
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

      <ScannerModal 
        isOpen={isScannerOpen} 
        onOpenChange={setIsScannerOpen}
        onScanReceived={handleScanReceived}
      />

      {editingImageData && (
        <ImageEditorModal
          isOpen={true}
          onOpenChange={(open) => !open && setEditingImageData(null)}
          imageData={editingImageData}
          onSave={handleSaveAttachment}
        />
      )}

      {/* New Print Preview Component */}
      <PrintPreview 
        isOpen={isPrintPreviewOpen} 
        onOpenChange={setIsPrintPreviewOpen}
        statement={statement}
      />
    </div>
  );
}

export default StatementDetailsPage;
