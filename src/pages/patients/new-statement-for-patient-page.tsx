import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPatientDetailsQueryOptions } from "@/lib/tanstack-query/patients";
import { LoadingMessage } from "@/components/table-loading";
import { ErrorMessage } from "@/components/error-message";
import { NewStatementForm } from "@/pages/statements/components/new-statement-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

function NewStatementForPatientPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const patientDetails = useQuery(getPatientDetailsQueryOptions(id!));

  if (patientDetails.isPending) {
    return <LoadingMessage message={t("patients.loading_details")} />;
  }

  if (patientDetails.isError) {
    return <ErrorMessage error={patientDetails.error} />;
  }

  const patient = patientDetails.data;

  if (!patient) {
    return <ErrorMessage error={new Error(t("patients.not_found"))} />;
  }

  return (
    <div className="container mx-auto py-6 px-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {t("statements.statement_for", { name: "" })}
            <span className="font-bold text-primary">{patient.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewStatementForm
            patientId={patient.id}
            onSuccess={() => {
              navigate(`/patients/${patient.id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default NewStatementForPatientPage;
