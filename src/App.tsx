import { Route, Routes } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Layout from "./components/layout";
import PatientsPage from "@/pages/patients/patients-page";
import NewPatientPage from "@/pages/patients/new-patient-page";
import { useEffect } from "react";
import { info } from "@tauri-apps/plugin-log";
import PatientDetailsPage from "./pages/patients/patient-details-page";
import StatementsPage from "./pages/statements/statements-page";
import NewStatementPage from "./pages/statements/new-statement-page";
import StatementDetailsPage from "./pages/statements/statement-details-page";
import NewStatementForPatientPage from "./pages/patients/new-statement-for-patient-page";
import HomePage from "./pages/home-page";

function App() {
  useEffect(() => {
    info("App started");
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
        </Route>
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
