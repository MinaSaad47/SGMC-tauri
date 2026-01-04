import { Button } from "@/components/ui/button";
import { PatientsTable } from "./components/patients-table";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

function PatientsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6 flex flex-col px-2 gap-2">
      <Link to="/patients/new" className="self-end">
        <Button>
          <Plus /> {t("patients.add_new")}
        </Button>
      </Link>
      <PatientsTable />
    </div>
  );
}

export default PatientsPage;
