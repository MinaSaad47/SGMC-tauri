import { useTranslation } from "react-i18next";

function NewStatementPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto py-6 px-2">
      <h1 className="text-2xl font-bold">{t("statements.add_new")}</h1>
      <p>{t("common.no_data")}</p>
    </div>
  );
}

export default NewStatementPage;
