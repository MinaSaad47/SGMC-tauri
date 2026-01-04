import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, FileText, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.svg";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <img src={logo} alt={`${t("common.app_name")} Logo`} className="w-24 h-24 mb-4 rounded-2xl shadow-lg" />
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          {t("home.welcome")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-[700px]">
          {t("home.description")}
        </p>
        <div className="flex gap-4 pt-4">
          <Link to="/patients">
            <Button size="lg" className="gap-2">
              {t("home.get_started")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center space-y-0 gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>{t("common.patients")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("home.patients_description")}
            </p>
            <Link to="/patients">
              <Button variant="outline" size="sm">{t("common.view")}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center space-y-0 gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>{t("common.statements")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("home.statements_description")}
            </p>
            <Link to="/statements">
              <Button variant="outline" size="sm">{t("common.view")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
