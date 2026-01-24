import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DoctorsTable } from "./components/doctors-table";

function DoctorsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("doctors.title")}</h1>
        <Link to="/doctors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("doctors.add_new")}
          </Button>
        </Link>
      </div>
      <DoctorsTable />
    </div>
  );
}

export default DoctorsPage;
