import { forwardRef } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatementDetails } from "@/lib/types/statements";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.svg";

interface PrintableStatementProps {
  statement: StatementDetails;
}

export const PrintableStatement = forwardRef<
  HTMLDivElement,
  PrintableStatementProps
>(({ statement }, ref) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      ref={ref}
      id="print-content"
      dir={i18n.dir()}
      className="bg-white text-black p-8 mx-auto font-sans"
      style={{ width: "210mm", minHeight: "297mm" }} // A4 dimensions
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-bold">{t("common.app_name")}</h1>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            <p>
              {t("common.date")}: {formatDate(new Date())}
            </p>
            <p className="text-xs">
              {t("statements.id")}: {statement.id}
            </p>
          </div>
        </div>
        <div className="text-end">
          <h2 className="text-xl font-semibold mb-2">
            {t("statements.details_title")}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-bold text-black text-lg">
              {statement.patient.name}
            </p>
            <p>{statement.patient.phone}</p>
          </div>
        </div>
      </div>

      {/* Basic Info (Doctor/Clinic) */}
      {(statement.doctor || statement.clinic) && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-4 text-sm">
          {statement.doctor && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t("doctors.singular")}</p>
              <p className="font-bold">{statement.doctor.name}</p>
              {statement.doctor.phone && <p className="text-xs text-gray-500">{statement.doctor.phone}</p>}
            </div>
          )}
          {statement.clinic && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t("clinics.singular")}</p>
              <p className="font-bold">{statement.clinic.name}</p>
            </div>
          )}
        </div>
      )}

      {/* Financial Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">
          {t("financial.summary")}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span>{t("financial.total_required")}</span>
            <span className="font-bold">{formatCurrency(statement.total)}</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span>{t("financial.total_paid")}</span>
            <span className="font-bold text-green-700">
              {formatCurrency(statement.totalPaid)}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-gray-50 rounded col-span-2">
            <span>{t("financial.total_remaining")}</span>
            <span
              className={`font-bold ${statement.totalRemaining > 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(statement.totalRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">
          {t("statements.sessions.title")}
        </h3>
        {statement.sessions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-start">
                  {t("statements.sessions.procedure")}
                </th>
                <th className="py-2 text-end">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {statement.sessions.map((session) => (
                <tr key={session.id} className="border-b last:border-0">
                  <td className="py-2 text-start">{session.procedure}</td>
                  <td className="py-2 text-end">
                    {formatDate(session.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 italic">
            {t("statements.sessions.no_sessions")}
          </p>
        )}
      </div>

      {/* Payments */}
      <div>
        <h3 className="text-lg font-bold mb-4 border-b pb-2">
          {t("common.payment_history")}
        </h3>
        {statement.payments.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-start">{t("common.date")}</th>
                <th className="py-2 text-end">{t("common.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {statement.payments.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0">
                  <td className="py-2 text-start">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="py-2 text-end">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 italic">
            {t("statements.payments.no_payments")}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
        <p>Generated by {t("common.app_name")}</p>
      </div>
    </div>
  );
});

PrintableStatement.displayName = "PrintableStatement";
