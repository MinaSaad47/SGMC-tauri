import { mutationOptions } from "@tanstack/react-query";
import { debug } from "@tauri-apps/plugin-log";
import { v7 as uuid } from "uuid";
import { getDb } from "../database";
import i18n from "../i18n";
import { AddPaymentSchema, UpdatePaymentSchema } from "../types/payments";
import
{
  getStatementDetailsQueryKey,
  getStatementsQueryKey,
} from "./statements";

export function addPaymentMutationOptions() {
  return mutationOptions({
    mutationFn: async (addPayment: AddPaymentSchema) => {
      debug(`Adding payment for ${JSON.stringify(addPayment, null, 2)}`);

      const parseResult = AddPaymentSchema.safeParse(addPayment);

      if (!parseResult.success) {
        throw new Error(i18n.t("common.invalid_data"));
      }

      const data = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const queryResult = await db.execute(
        `
        INSERT INTO payments (id, statement_id, amount, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
        [id, data.statementId, data.amount],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("common.operation_failed"));
      }

      return { id, ...data };
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.payment_added"),
    },
  });
}

export function updatePaymentMutationOptions(statementId: string) {
  return mutationOptions({
    mutationFn: async (data: {
      id: string;
      updatePayment: UpdatePaymentSchema;
    }) => {
      const parseResult = UpdatePaymentSchema.safeParse(data.updatePayment);

      if (!parseResult.success) {
        throw new Error(i18n.t("statements.payments.no_payments"));
      }

      const updateData = parseResult.data;

      const db = await getDb();

      const queryResult = await db.execute(
        `
              UPDATE payments
              SET amount = ?, updated_at = datetime('now')
              WHERE id = ?
            `,
        [updateData.amount, data.id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.payment_updated_failed"));
      }

      return { id: data.id, ...updateData };
    },
    meta: {
      invalidatesQueries: [getStatementDetailsQueryKey(statementId)],
      successMessage: i18n.t("messages.payment_updated"),
    },
  });
}

export function deletePaymentMutationOptions(statementId: string) {
  return mutationOptions({
    mutationFn: async (id: string) => {
      const db = await getDb();

      const queryResult = await db.execute(
        `DELETE FROM payments WHERE id = ?`,
        [id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.payment_deleted_failed"));
      }

      return id;
    },
    meta: {
      invalidatesQueries: [getStatementDetailsQueryKey(statementId)],
      successMessage: i18n.t("messages.payment_deleted"),
    },
  });
}
