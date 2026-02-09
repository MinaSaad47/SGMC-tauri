import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { debug } from "@tauri-apps/plugin-log";
import { v7 as uuid } from "uuid";
import { getDb } from "../database";
import i18n from "../i18n";
import { PagedList, PagingParams } from "../types";
import { AddPaymentSchema } from "../types/payments";
import
{
  AddStatementSchema,
  Statement,
  StatementDetails,
  UpdateStatementSchema,
} from "../types/statements";

export function getStatementsQueryKey(
  params: Record<string, any> | undefined = undefined,
) {
  return params
    ? (["statements", { ...params }] as const)
    : (["statements"] as const);
}

export class GetStatementsParams extends PagingParams {
  search?: string;
  patientId?: string;
  remainingFilter?: "all" | "positive" | "negative";
  doctorId?: string;
  clinicId?: string;

  constructor(init?: Partial<GetStatementsParams>) {
    super(init);
    Object.assign(this, init);
  }
}

export function getStatementsQueryOptions(
  params: GetStatementsParams = new GetStatementsParams(),
) {
  return queryOptions({
    queryKey: getStatementsQueryKey(params),
    queryFn: async () => {
      const db = await getDb();

      const { search, offset, limit, patientId, remainingFilter, doctorId, clinicId } = params;

      const items = await db.select<any[]>(
        `
          SELECT * FROM (
            SELECT
              s.id,
              s.total,
              (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE statement_id = s.id) as totalPaid,
              (s.total - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE statement_id = s.id)) as totalRemaining,
              s.created_at as createdAt,
              s.updated_at as updatedAt,
              json_object(
                  'id', p.id,
                  'name', p.name,
                  'phone', p.phone,
                  'createdAt', p.created_at,
                  'updatedAt', p.updated_at
              ) as patient,
              CASE WHEN s.doctor_id IS NOT NULL THEN
                json_object(
                    'id', d.id,
                    'name', d.name,
                    'phone', d.phone,
                    'createdAt', d.created_at,
                    'updatedAt', d.updated_at
                )
              ELSE NULL END as doctor,
              CASE WHEN s.clinic_id IS NOT NULL THEN
                json_object(
                    'id', c.id,
                    'name', c.name,
                    'createdAt', c.created_at,
                    'updatedAt', c.updated_at
                )
              ELSE NULL END as clinic
            FROM statements s
            JOIN patients p ON s.patient_id = p.id
            LEFT JOIN doctors d ON s.doctor_id = d.id
            LEFT JOIN clinics c ON s.clinic_id = c.id
            WHERE
                (?1 IS NULL OR s.patient_id = ?1) AND
                (?2 IS NULL OR p.name LIKE '%' || ?2 || '%' OR p.phone LIKE '%' || ?2 || '%') AND
                (?6 IS NULL OR s.doctor_id = ?6) AND
                (?7 IS NULL OR s.clinic_id = ?7)
          )
          WHERE
            (?5 = 'all' OR ?5 IS NULL) OR
            (?5 = 'positive' AND totalRemaining > 0) OR
            (?5 = 'negative' AND totalRemaining < 0)
          ORDER BY createdAt DESC
          LIMIT ?3 OFFSET ?4
        `,
        [patientId, search, limit, offset, remainingFilter, doctorId, clinicId],
      );

      const [total] = await db.select<[{ count: number }]>(
        `
          SELECT COUNT(*) as count FROM (
            SELECT
              (s.total - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE statement_id = s.id)) as totalRemaining
            FROM statements s
            JOIN patients p ON s.patient_id = p.id
            WHERE
              (?1 IS NULL OR s.patient_id = ?1) AND
              (?2 IS NULL OR p.name LIKE '%' || ?2 || '%' OR p.phone LIKE '%' || ?2 || '%') AND
              (?4 IS NULL OR s.doctor_id = ?4) AND
              (?5 IS NULL OR s.clinic_id = ?5)
          )
          WHERE
            (?3 = 'all' OR ?3 IS NULL) OR
            (?3 = 'positive' AND totalRemaining > 0) OR
            (?3 = 'negative' AND totalRemaining < 0)
        `,
        [patientId, search, remainingFilter, doctorId, clinicId],
      );

      const statements = items.map((i) => ({
        ...i,
        patient: JSON.parse(i.patient),
        doctor: i.doctor ? JSON.parse(i.doctor) : undefined,
        clinic: i.clinic ? JSON.parse(i.clinic) : undefined,
      }));

      return new PagedList<Statement>(statements, params, total.count);
    },
  });
}

export function getStatementDetailsQueryKey(id: string) {
  return [...getStatementsQueryKey(), { statementId: id }] as const;
}

async function getStatementDetails(id: string) {
  const db = await getDb();

  const [statement] = await db.select<any[]>(
    `
      WITH statement_sessions AS (
        SELECT
            statement_id,
            json_group_array(
                json_object(
                    'id', id,
                    'statementId', statement_id,
                    'procedure', "procedure",
                    'createdAt', created_at,
                    'updatedAt', updated_at
                )
            ) as sessions
        FROM (SELECT * FROM sessions ORDER BY created_at DESC)
        GROUP BY statement_id
      ),
      statement_payments AS (
        SELECT
            statement_id,
            COALESCE(SUM(amount), 0) as totalPaid,
            json_group_array(
                json_object(
                    'id', id,
                    'statementId', statement_id,
                    'amount', amount,
                    'createdAt', created_at,
                    'updatedAt', updated_at
                )
            ) as payments
        FROM (SELECT * FROM payments ORDER BY created_at DESC)
        GROUP BY statement_id
      ),
      statement_attachments AS (
        SELECT
            statement_id,
            json_group_array(
                json_object(
                    'id', id,
                    'statementId', statement_id,
                    'fileName', file_name,
                    'filePath', file_path,
                    'fileType', file_type,
                    'fileSize', file_size,
                    'createdAt', created_at
                )
            ) as attachments
        FROM (SELECT * FROM attachments ORDER BY created_at DESC)
        GROUP BY statement_id
      )
      SELECT
          s.id,
          s.total,
          s.created_at as createdAt,
          s.updated_at as updatedAt,
          json_object(
              'id', p.id,
              'name', p.name,
              'phone', p.phone,
              'createdAt', p.created_at,
              'updatedAt', p.updated_at
          ) as patient,
          CASE WHEN s.doctor_id IS NOT NULL THEN
            json_object(
                'id', d.id,
                'name', d.name,
                'phone', d.phone,
                'createdAt', d.created_at,
                'updatedAt', d.updated_at
            )
          ELSE NULL END as doctor,
          CASE WHEN s.clinic_id IS NOT NULL THEN
            json_object(
                'id', c.id,
                'name', c.name,
                'createdAt', c.created_at,
                'updatedAt', c.updated_at
            )
          ELSE NULL END as clinic,
          COALESCE(sp.totalPaid, 0) as totalPaid,
          (s.total - COALESCE(sp.totalPaid, 0)) as totalRemaining,
          COALESCE(ss.sessions, '[]') as sessions,
          COALESCE(sp.payments, '[]') as payments,
          COALESCE(sa.attachments, '[]') as attachments
      FROM statements s
      JOIN patients p ON s.patient_id = p.id
      LEFT JOIN doctors d ON s.doctor_id = d.id
      LEFT JOIN clinics c ON s.clinic_id = c.id
      LEFT JOIN statement_sessions ss ON s.id = ss.statement_id
      LEFT JOIN statement_payments sp ON s.id = sp.statement_id
      LEFT JOIN statement_attachments sa ON s.id = sa.statement_id
      WHERE s.id = ?
    `,
    [id],
  );

  if (!statement) {
    return undefined;
  }

  return {
    ...statement,
    patient: statement.patient && JSON.parse(statement.patient),
    doctor: statement.doctor ? JSON.parse(statement.doctor) : undefined,
    clinic: statement.clinic ? JSON.parse(statement.clinic) : undefined,
    payments: statement.payments && JSON.parse(statement.payments),
    sessions: statement.sessions && JSON.parse(statement.sessions),
    attachments: statement.attachments && JSON.parse(statement.attachments),
  } as StatementDetails;
}

export function getStatementDetailsQueryOptions(id: string) {
  return queryOptions({
    queryKey: getStatementDetailsQueryKey(id),
    queryFn: async () => {
      return await getStatementDetails(id);
    },
  });
}

export function addStatementMutationOptions() {
  return mutationOptions({
    mutationFn: async (addStatement: AddStatementSchema) => {
      debug(`Adding statement for ${JSON.stringify(addStatement, null, 2)}`);

      const parseResult = AddStatementSchema.safeParse(addStatement);

      if (!parseResult.success) {
        throw new Error("Invalid statement data");
      }

      addStatement = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const queryResult = await db.execute(
        `
        INSERT INTO statements (id, patient_id, total, doctor_id, clinic_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
        [id, addStatement.patientId, addStatement.total, addStatement.doctorId || null, addStatement.clinicId || null],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error("Failed to add statement");
      }

      return (await getStatementDetails(id))!;
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.statement_added"),
    },
  });
}

export function updateStatementMutationOptions() {
  return mutationOptions({
    mutationFn: async (data: {
      id: string;
      updateStatement: UpdateStatementSchema;
    }) => {
      const parseResult = UpdateStatementSchema.safeParse(data.updateStatement);

      if (!parseResult.success) {
        throw new Error(i18n.t("statements.not_found"));
      }

      const updateStatement = parseResult.data;

      const db = await getDb();

      const queryResult = await db.execute(
        `
              UPDATE statements
              SET total = ?, doctor_id = ?, clinic_id = ?, updated_at = datetime('now')
              WHERE id = ?
            `,
        [updateStatement.total, updateStatement.doctorId || null, updateStatement.clinicId || null, data.id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.statement_updated_failed"));
      }

      return (await getStatementDetails(data.id))!;
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.statement_updated"),
    },
  });
}

export function deleteStatementMutationOptions() {
  return mutationOptions({
    mutationFn: async (id: string) => {
      const db = await getDb();

      const queryResult = await db.execute(
        "DELETE FROM statements WHERE id = ?",
        [id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.statement_deleted_failed"));
      }

      return id;
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.statement_deleted"),
    },
  });
}

export function addPaymentMutationOptions() {
  return mutationOptions({
    mutationFn: async (addPayment: AddPaymentSchema) => {
      debug(`Adding payment for ${JSON.stringify(addPayment, null, 2)}`);

      const parseResult = AddPaymentSchema.safeParse(addPayment);

      if (!parseResult.success) {
        throw new Error("Invalid payment data");
      }

      addPayment = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const queryResult = await db.execute(
        `
        INSERT INTO payments (id, statement_id, amount, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
        [id, addPayment.statementId, addPayment.amount],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error("Failed to add payment");
      }

      return (await getStatementDetails(addPayment.statementId))!;
    },
        meta: {
          invalidatesQueries: [getStatementsQueryKey()],
          successMessage: i18n.t("messages.payment_added"),
        },
      });
    }
    