import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ClinicsTable } from "./components/clinics-table";

function ClinicsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("clinics.title")}</h1>
        <Link to="/clinics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("clinics.add_new")}
          </Button>
        </Link>
      </div>
      <ClinicsTable />
    </div>
  );
}

export default ClinicsPage;
