import { useTranslation } from "react-i18next";
import { NewDoctorForm } from "./components/new-doctor-form";

function NewDoctorPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">{t("doctors.add_new")}</h1>
      <NewDoctorForm />
    </div>
  );
}

export default NewDoctorPage;
