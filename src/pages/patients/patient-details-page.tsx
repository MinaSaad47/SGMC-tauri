import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar, Phone, Plus } from "lucide-react";
import { PatientDetailsForm } from "./components/patient-details-form";
import { getPatientDetailsQueryOptions } from "@/lib/tanstack-query/patients";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingMessage } from "@/components/table-loading";
import { ErrorMessage } from "@/components/error-message";
import { Badge } from "@/components/ui/badge";
import { StatementsTable } from "../statements/components/statements-table";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PatientDetailsPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);

  const patientDetails = useQuery(getPatientDetailsQueryOptions(id!));

  if (patientDetails.isPending) {
    return <LoadingMessage message={t("patients.loading_details")} />;
  }

  if (patientDetails.isError) {
    return <ErrorMessage error={patientDetails.error} />;
  }

  if (!patientDetails.data) {
    return <ErrorMessage error={new Error(t("patients.not_found"))} />;
  }

  const patient = patientDetails.data;

  return (
    <div className="mx-auto p-6 space-y-6">
      {/* Top Section: Details/Edit Form */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold">{patient.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{patient.phone}</span>
            </div>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? t("common.cancel") : t("common.edit")}
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {isEditing ? (
            <PatientDetailsForm
              patient={patient}
              onSuccess={() => {
                setIsEditing(false);
                patientDetails.refetch();
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Patient Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {t("patients.info")}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t("patients.full_name")}
                      </p>
                      <p className="text-base font-medium">{patient.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t("patients.phone_number")}
                      </p>
                      <p className="text-base font-medium">{patient.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("patients.member_since")}
                        </p>
                        <p className="text-sm">
                          {formatDate(patient.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column: Financial Summary */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  {t("financial.summary")}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Statements Card */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("financial.total_statements")}
                        </p>
                        <p className="text-2xl font-bold">
                          {patient.statementCount}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {patient.statementCount}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("financial.all_statements_created")}
                    </p>
                  </div>

                  {/* Total Required Card */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("financial.total_required")}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(patient.totalRequired)}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          $
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("financial.total_amount_required")}
                    </p>
                  </div>

                  {/* Total Paid Card */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("financial.total_paid")}
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(patient.totalPaid)}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          $
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("financial.total_amount_paid")}
                    </p>
                  </div>

                  {/* Remaining Balance Card */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("financial.total_remaining")}
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            patient.totalRemaining > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {formatCurrency(patient.totalRemaining)}
                        </p>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          patient.totalRemaining > 0
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-gray-200 dark:bg-gray-800"
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            patient.totalRemaining > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          $
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {t("financial.outstanding_amount")}
                      </p>
                      {patient.totalRemaining > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {t("statements.status.payment_due")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overdue Summary */}
                {patient.overdueCount > 0 && (
                  <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-300">
                          {t("financial.overdue_statements")}
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          {patient.overdueCount} {t("financial.require_attention")}
                        </p>
                      </div>
                      <Badge variant="destructive" className="px-3 py-1">
                        {patient.overdueCount} {t("statements.status.overdue")}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {patient.totalRequired > 0 && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{t("financial.payment_progress")}</span>
                      <span className="text-muted-foreground">
                        {Math.round(
                          (patient.totalPaid / patient.totalRequired) * 100,
                        )}
                        % {t("financial.complete")}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (patient.totalPaid / patient.totalRequired) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("financial.total_paid")}: {formatCurrency(patient.totalPaid)}</span>
                      <span>
                        {t("financial.total_required")}: {formatCurrency(patient.totalRequired)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section: Tabs */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <Tabs defaultValue="statements" dir={i18n.dir()}>
            <TabsList className="mb-6">
              <TabsTrigger value="statements" className="gap-2">
                <span>{t("tabs.statements")}</span>
                {patient.statementCount > 0 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">
                    {patient.statementCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="transactions">{t("tabs.transactions")}</TabsTrigger>
              <TabsTrigger value="notes">{t("tabs.notes")}</TabsTrigger>
            </TabsList>

            <TabsContent value="statements" className="space-y-4">
              <div className="flex justify-end">
                <Link to={`/patients/${patient.id}/statements/new`}>
                  <Button>
                    <Plus className="me-2 h-4 w-4" />
                    {t("statements.add_new")}
                  </Button>
                </Link>
              </div>
              <StatementsTable patientId={patient.id} />
            </TabsContent>

            <TabsContent value="transactions">
              <div className="rounded-lg border p-8 text-center">
                <div className="mx-auto max-w-md">
                  <h3 className="text-lg font-medium mb-2">
                    {t("tabs.transaction_history")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("tabs.transaction_history_desc")}
                  </p>
                  <Button variant="outline" size="sm">
                    {t("tabs.view_transaction_log")}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="rounded-lg border p-8 text-center">
                <div className="mx-auto max-w-md">
                  <h3 className="text-lg font-medium mb-2">{t("tabs.patient_notes")}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t("tabs.patient_notes_desc")}
                  </p>
                  <Button variant="outline" size="sm">
                    {t("tabs.add_note")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
