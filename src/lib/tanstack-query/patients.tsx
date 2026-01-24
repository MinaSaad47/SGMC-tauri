import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getDb } from "../db";
import { PagedList, PagingParams } from "../types";
import {
  AddPatientSchema,
  Patient,
  PatientDetails,
  UpdatePatientSchema,
} from "../types/patients";
import { v7 as uuid } from "uuid";
import i18n from "../i18n";

export function getPatientsQueryKey(
  params: Record<string, any> | undefined = undefined,
) {
  return params
    ? (["patients", { ...params }] as const)
    : (["patients"] as const);
}

export class GetPatientsParams extends PagingParams {
  search?: string;

  constructor(init?: Partial<GetPatientsParams>) {
    super(init);
    Object.assign(this, init);
  }
}

export function getPatientsQueryOptions(
  params: GetPatientsParams = new GetPatientsParams(),
) {
  return queryOptions({
    queryKey: getPatientsQueryKey(params),
    queryFn: async () => {
      const db = await getDb();

      const { search, offset, limit } = params;

      const patients = await db.select<Patient[]>(
        `
          SELECT
            id,
            name,
            phone,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM patients
          WHERE (? IS NULL OR name LIKE '%' || ? || '%' OR phone LIKE '%' || ? || '%')
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        [search, search, search, limit, offset],
      );

      const [total] = await db.select<number[]>(
        `
          SELECT COUNT(*) as count
          FROM patients
          WHERE (? IS NULL OR name LIKE '%' || ? || '%' OR phone LIKE '%' || ? || '%')
        `,
        [search, search, search],
      );

      return new PagedList(patients, params, total);
    },
  });
}

export function getPatientDetailsQueryKey(id: string) {
  return [...getPatientsQueryKey(), { patientId: id }] as const;
}

async function getPatientDetails(id: string) {
  const db = await getDb();

  const patients = await db.select<PatientDetails[]>(
    `
      WITH statement_totals AS (
        SELECT
          s.id,
          s.patient_id,
          s.total as statement_total,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE statement_id = s.id) as deposited_total
        FROM statements s
      ),
      patient_aggregates AS (
        SELECT
          p.id,
          p.name,
          p.phone,
          p.created_at,
          p.updated_at,
          COUNT(DISTINCT st.id) as statementCount,
          SUM(st.statement_total) as totalRequired,
          SUM(st.deposited_total) as totalPaid,
          COUNT(DISTINCT CASE WHEN st.statement_total > st.deposited_total THEN st.id END) as overdueCount
        FROM patients p
        LEFT JOIN statement_totals st ON p.id = st.patient_id
        WHERE p.id = ?
        GROUP BY p.id
      )
      SELECT
        id,
        name,
        phone,
        statementCount,
        overdueCount,
        COALESCE(totalRequired, 0) as totalRequired,
        COALESCE(totalPaid, 0) as totalPaid,
        COALESCE(totalRequired, 0) - COALESCE(totalPaid, 0) as totalRemaining,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM patient_aggregates
    `,
    [id],
  );

  return patients?.[0] as PatientDetails | undefined;
}

export function getPatientDetailsQueryOptions(id: string) {
  return queryOptions({
    queryKey: getPatientDetailsQueryKey(id),
    queryFn: async () => {
      return await getPatientDetails(id);
    },
  });
}

export function addPatientMutationOptions() {
  return mutationOptions({
    mutationFn: async (addPatient: AddPatientSchema) => {
      const parseResult = AddPatientSchema.safeParse(addPatient);

      if (!parseResult.success) {
        throw new Error("Invalid patient data");
      }

      addPatient = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const queryResult = await db.execute(
        `
        INSERT INTO patients (id, name, phone, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
        RETURNING
          id,
          name,
          phone,
          created_at AS createdAt,
          updated_at AS updatedAt
      `,
        [id, addPatient.name, addPatient.phone],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error("Failed to add patient");
      }

      return (await getPatientDetails(id))!;
    },
    meta: {
      invalidatesQueries: [getPatientsQueryKey()],
      successMessage: i18n.t("messages.patient_added"),
    },
  });
}

export function updatePatientMutationOptions() {
  return mutationOptions({
    mutationFn: async (data: {
      id: string;
      updatePatient: UpdatePatientSchema;
    }) => {
      const parseResult = UpdatePatientSchema.safeParse(data.updatePatient);

      if (!parseResult.success) {
        throw new Error(i18n.t("patients.not_found"));
      }

      const updatePatient = parseResult.data;

      const db = await getDb();

      const queryResult = await db.execute(
        `
              UPDATE patients
              SET name = ?, phone = ?, updated_at = datetime('now')
              WHERE id = ?
            `,
        [updatePatient.name, updatePatient.phone, data.id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.patient_updated_failed"));
      }

      return (await getPatientDetails(data.id))!;
    },
    meta: {
      invalidatesQueries: [getPatientsQueryKey()],
      successMessage: i18n.t("messages.patient_updated"),
    },
  });
}

export function deletePatientMutationOptions() {
  return mutationOptions({
    mutationFn: async (id: string) => {
      const db = await getDb();
      const queryResult = await db.execute("DELETE FROM patients WHERE id = ?", [id]);

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.patient_deleted_failed"));
      }
      return id;
    },
    meta: {
      invalidatesQueries: [getPatientsQueryKey()],
      successMessage: i18n.t("messages.patient_deleted"),
    },
  });
}
