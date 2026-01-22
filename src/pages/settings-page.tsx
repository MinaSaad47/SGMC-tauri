import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { googleDrive } from "@/lib/google-drive";
import { error } from "@tauri-apps/plugin-log";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SyncManager } from "./settings/components/sync-manager";

export default function SettingsPage()
{
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() =>
  {
    checkConnection();
  }, []);

  const checkConnection = async () =>
  {
    setIsLoading(true);
    const auth = await googleDrive.isAuthenticated();
    setIsConnected(auth);
    setIsLoading(false);
  };

  const handleConnect = async () =>
  {

    const id = toast.loading(t("sync.waiting_for_login"));

    try
    {

      await googleDrive.authenticate();

      toast.success(t("sync.connected_status"), { id });

      checkConnection();

    } catch (e: any)
    {

      error(e);

      toast.error(t("sync.failed"), { id });

    }

  };



  const handleLogout = async () =>
  {

    await googleDrive.logout();

    setIsConnected(false);

    toast.info(t("sync.disconnect_button"));

  };



  if (isLoading)
  {

    return (

      <div className="container mx-auto py-12 flex justify-center">

        <Loader2 className="animate-spin h-8 w-8 text-primary" />

      </div>

    );

  }



  return (

    <div className="container mx-auto py-8 px-4 space-y-8">

      <h1 className="text-3xl font-bold tracking-tight">{t("common.settings")}</h1>



      <Card>

        <CardHeader>

          <div className="flex items-center justify-between">

            <div className="space-y-1">

              <CardTitle>{t("sync.cloud_backups")}</CardTitle>

              <CardDescription>

                {t("sync.cloud_description")}

              </CardDescription>

            </div>

            {isConnected ? (

              <Cloud className="h-8 w-8 text-green-500" />

            ) : (

                <CloudOff className="h-8 w-8 text-muted-foreground" />

            )}

          </div>

        </CardHeader>

        <CardContent className="space-y-6">

          {!isConnected ? (

            <div className="flex flex-col items-center py-6 space-y-4">

              <p className="text-sm text-muted-foreground text-center max-w-sm">

                {t("sync.connect_description")}

              </p>

              <Button onClick={handleConnect} size="lg" className="gap-2">

                <Cloud className="h-4 w-4" /> {t("sync.connect_button")}

              </Button>

            </div>

          ) : (

              <div className="space-y-6">

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">

                  <div className="flex items-center gap-2">

                    <div className="h-2 w-2 rounded-full bg-green-500" />

                    <span className="text-sm font-medium">{t("sync.connected_status")}</span>

                  </div>

                  <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">

                    {t("sync.disconnect_button")}

                  </Button>

                </div>



                <SyncManager />

              </div>

          )}

        </CardContent>

      </Card>

    </div>

  );

}

