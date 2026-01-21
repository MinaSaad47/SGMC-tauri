import NewPatientPage from "@/pages/patients/new-patient-page";
import PatientsPage from "@/pages/patients/patients-page";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { error, info } from "@tauri-apps/plugin-log";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout";
import HomePage from "./pages/home-page";
import NewStatementForPatientPage from "./pages/patients/new-statement-for-patient-page";
import PatientDetailsPage from "./pages/patients/patient-details-page";
import SettingsPage from "./pages/settings-page";
import NewStatementPage from "./pages/statements/new-statement-page";
import StatementDetailsPage from "./pages/statements/statement-details-page";
import StatementsPage from "./pages/statements/statements-page";

import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { toast } from "sonner";
import { googleDrive } from "./lib/google-drive";

function App() {
  useEffect(() => {
    info("App started");

    const setupDeepLink = async () =>
    {
      const unlisten = await onOpenUrl(async (urls) =>
      {
        for (const url of urls)
        {
          info(`Received deep link: ${url}`);
          if (url.startsWith("sgmc://auth/callback"))
          {
            const urlObj = new URL(url.replace("sgmc://", "http://localhost/"));
            const code = urlObj.searchParams.get("code");
            if (code)
            {
              try
              {
                await googleDrive.exchangeCodeForToken(code);
                toast.success("Successfully connected to Google Drive");
                // Trigger a refresh of settings if we are there
                window.dispatchEvent(new CustomEvent("google-drive-connected"));
              } catch (e)
              {
                error(`OAuth error: ${e}`);
                toast.error("Failed to connect to Google Drive");
              }
            }
          }
        }
      });
      return unlisten;
    };

    const unlistenPromise = setupDeepLink();

    return () =>
    {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/patients" element={<PatientsPage />}></Route>
          <Route path="/patients/new" element={<NewPatientPage />}></Route>
          <Route path="/patients/:id" element={<PatientDetailsPage />}></Route>
          <Route
            path="/patients/:id/statements/new"
            element={<NewStatementForPatientPage />}
          ></Route>
          <Route path="/statements" element={<StatementsPage />}></Route>
          <Route path="/statements/new" element={<NewStatementPage />}></Route>
          <Route
            path="/statements/:id"
            element={<StatementDetailsPage />}
          ></Route>
          <Route path="/settings" element={<SettingsPage />}></Route>
        </Route>
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
