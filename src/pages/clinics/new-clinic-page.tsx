import { useTranslation } from "react-i18next";
import { NewClinicForm } from "./components/new-clinic-form";

function NewClinicPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">{t("clinics.add_new")}</h1>
      <NewClinicForm />
    </div>
  );
}

export default NewClinicPage;
