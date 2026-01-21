import
{
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackupFile, googleDrive } from "@/lib/google-drive";
import { invoke } from "@tauri-apps/api/core";
import { writeFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { Cloud, CloudOff, Download, Loader2, LogOut, RefreshCw, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function SettingsPage()
{
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isFetchingBackups, setIsFetchingBackups] = useState(false);

  useEffect(() =>
  {
    checkConnection();

    // Listen for OAuth completion event from App.tsx
    const handleConnected = () =>
    {
      checkConnection();
    };
    window.addEventListener("google-drive-connected", handleConnected);
    return () => window.removeEventListener("google-drive-connected", handleConnected);
  }, []);

  const checkConnection = async () =>
  {
    setIsLoading(true);
    const auth = await googleDrive.isAuthenticated();
    setIsConnected(auth);
    if (auth)
    {
      await fetchBackups();
    }
    setIsLoading(false);
  };

  const handleConnect = async () =>
  {
    try
    {
      const url = await googleDrive.getAuthUrl();
      await openUrl(url);
    } catch (e)
    {
      toast.error("Failed to start authentication flow");
    }
  };

  const handleLogout = async () =>
  {
    await googleDrive.logout();
    setIsConnected(false);
    setBackups([]);
    toast.info("Logged out from Google Drive");
  };

  const handleBackup = async () =>
  {
    setIsBackingUp(true);
    const id = toast.loading("Creating safe snapshot and uploading...");
    try
    {
      await googleDrive.uploadBackup();
      toast.success("Backup uploaded successfully", { id });
      await fetchBackups();
    } catch (e)
    {
      console.error(e);
      toast.error("Failed to upload backup", { id });
    } finally
    {
      setIsBackingUp(false);
    }
  };

  const fetchBackups = async () =>
  {
    setIsFetchingBackups(true);
    try
    {
      const list = await googleDrive.listBackups();
      setBackups(list);
    } catch (e)
    {
      toast.error("Failed to fetch backups list");
    } finally
    {
      setIsFetchingBackups(false);
    }
  };

  const handleRestore = async (fileId: string) =>
  {
    const id = toast.loading("Downloading and restoring database...");
    try
    {
      const data = await googleDrive.downloadBackup(fileId);
      const dbPath = await invoke<string>("db_path");

      // Critical: Overwrite the SQLite file. 
      // tauri-plugin-fs handles permission requests if needed.
      await writeFile(dbPath, data);

      toast.success("Database restored! Relaunching application...", { id });

      setTimeout(async () =>
      {
        await relaunch();
      }, 2000);
    } catch (e)
    {
      console.error(e);
      toast.error("Failed to restore database", { id });
    }
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
              <CardTitle>Cloud Synchronization</CardTitle>
              <CardDescription>
                Securely back up your data to your private Google Drive space.
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
                Connect your Google account to enable cloud backups.
                Your data stays in your Drive in a folder named "SGMC Backups".
              </p>
              <Button onClick={handleConnect} size="lg" className="gap-2">
                <Cloud className="h-4 w-4" /> Connect Google Drive
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Connected to Google Drive</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-destructive">
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                  <Button onClick={handleBackup} disabled={isBackingUp} size="sm" className="gap-2">
                    {isBackingUp ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    Backup Now
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Available Backups</h3>
                  <Button variant="ghost" size="icon" onClick={fetchBackups} disabled={isFetchingBackups}>
                    <RefreshCw className={`h-4 w-4 ${isFetchingBackups ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-xs font-medium grid grid-cols-2">
                    <span>File Details</span>
                    <span className="text-right">Actions</span>
                  </div>
                  <div className="divide-y">
                    {backups.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground italic">
                        No backups found.
                      </div>
                    ) : (
                      backups.map((backup) => (
                        <div key={backup.id} className="px-4 py-3 grid grid-cols-2 items-center hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate">{backup.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(backup.createdTime).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Download className="h-3 w-3" /> Restore
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Replace local data?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    You are about to restore the backup from **{new Date(backup.createdTime).toLocaleString()}**.
                                    This will overwrite your current database. The app will restart automatically.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRestore(backup.id)} className="bg-destructive hover:bg-destructive/90 text-white">
                                    Restore & Relaunch
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
