import NewPatientPage from "@/pages/patients/new-patient-page";
import PatientsPage from "@/pages/patients/patients-page";
import NewStatementPage from "@/pages/statements/new-statement-page";
import StatementDetailsPage from "@/pages/statements/statement-details-page";
import StatementsPage from "@/pages/statements/statements-page";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { info } from "@tauri-apps/plugin-log";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout";
import { SyncOverlay } from "./components/sync-overlay";
import { useAutoSync } from "./hooks/use-auto-sync";
import HomePage from "./pages/home-page";
import NewStatementForPatientPage from "./pages/patients/new-statement-for-patient-page";
import PatientDetailsPage from "./pages/patients/patient-details-page";
import SettingsPage from "./pages/settings-page";
import { useGlobalOnlineStatus } from "./hooks/use-global-online-status";

function App() {
  useAutoSync();
  useGlobalOnlineStatus();

  useEffect(() => {
    info("App started");
  }, []);

  return (
    <>
      <SyncOverlay />
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
