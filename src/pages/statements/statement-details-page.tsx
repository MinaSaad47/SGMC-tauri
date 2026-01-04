import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStatementDetailsQueryOptions } from "@/lib/tanstack-query/statements";
import { LoadingMessage } from "@/components/table-loading";
import { ErrorMessage } from "@/components/error-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Pencil } from "lucide-react";
import { NewPaymentForm } from "./components/new-payment-form";
import { UpdateStatementForm } from "./components/update-statement-form";
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
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isEditTotalOpen, setIsEditTotalOpen] = useState(false);
  const statementDetails = useQuery(getStatementDetailsQueryOptions(id!));

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
      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {t("statements.statement_for", { name: statement.patient.name })}
            </span>
            <Link to={`/patients/${statement.patient.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {t("common.view_patient")}
              </Button>
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2 pt-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {statement.patient.phone}
            </span>
          </div>
        </CardHeader>
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
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("financial.total_required")}
              </p>
              <Dialog open={isEditTotalOpen} onOpenChange={setIsEditTotalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t("common.edit")} {t("statements.total")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <UpdateStatementForm
                      statementId={statement.id}
                      initialTotal={statement.total}
                      onSuccess={() => setIsEditTotalOpen(false)}
                      onCancel={() => setIsEditTotalOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
    </div>
  );
}

export default StatementDetailsPage;
