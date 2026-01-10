import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getBackRoute } from "@/lib/routes";
import { useTranslation } from "react-i18next";

export function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const backTarget = getBackRoute(location.pathname);

  if (!backTarget) {
    return null;
  }

  const handleBack = () => {
    if (typeof backTarget === "number") {
      navigate(backTarget);
    } else {
      navigate(backTarget);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      onClick={handleBack}
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
      <span>{t("common.back")}</span>
    </Button>
  );
}
