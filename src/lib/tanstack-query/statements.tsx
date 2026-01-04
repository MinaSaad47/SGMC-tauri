import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { v7 as uuid } from "uuid";
import { getDb } from "../db";
import { PagedList, PagingParams } from "../types";
import {
  AddStatementSchema,
  Statement,
  StatementDetails,
  UpdateStatementSchema,
} from "../types/statements";
import { AddPaymentSchema } from "../types/payments";
import { debug } from "@tauri-apps/plugin-log";
import i18n from "../i18n";

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

      const { search, offset, limit, patientId, remainingFilter } = params;

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
              ) as patient
            FROM statements s
            JOIN patients p ON s.patient_id = p.id
            WHERE
                (?1 IS NULL OR s.patient_id = ?1) AND
                (?2 IS NULL OR p.name LIKE '%' || ?2 || '%' OR p.phone LIKE '%' || ?2 || '%')
          )
          WHERE
            (?5 = 'all' OR ?5 IS NULL) OR
            (?5 = 'positive' AND totalRemaining > 0) OR
            (?5 = 'negative' AND totalRemaining < 0)
          ORDER BY createdAt DESC
          LIMIT ?3 OFFSET ?4
        `,
        [patientId, search, limit, offset, remainingFilter],
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
              (?2 IS NULL OR p.name LIKE '%' || ?2 || '%' OR p.phone LIKE '%' || ?2 || '%')
          )
          WHERE
            (?3 = 'all' OR ?3 IS NULL) OR
            (?3 = 'positive' AND totalRemaining > 0) OR
            (?3 = 'negative' AND totalRemaining < 0)
        `,
        [patientId, search, remainingFilter],
      );

      const statements = items.map((i) => ({
        ...i,
        patient: JSON.parse(i.patient),
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
          COALESCE(sp.totalPaid, 0) as totalPaid,
          (s.total - COALESCE(sp.totalPaid, 0)) as totalRemaining,
          COALESCE(ss.sessions, '[]') as sessions,
          COALESCE(sp.payments, '[]') as payments
      FROM statements s
      JOIN patients p ON s.patient_id = p.id
      LEFT JOIN statement_sessions ss ON s.id = ss.statement_id
      LEFT JOIN statement_payments sp ON s.id = sp.statement_id
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
    payments: statement.payments && JSON.parse(statement.payments),
    sessions: statement.sessions && JSON.parse(statement.sessions),
  } satisfies StatementDetails;
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
        INSERT INTO statements (id, patient_id, total, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
        [id, addStatement.patientId, addStatement.total],
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
              SET total = ?, updated_at = datetime('now')
              WHERE id = ?
            `,
        [updateStatement.total, data.id],
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
      successMessage: "Payment added successfully",
    },
  });
}
