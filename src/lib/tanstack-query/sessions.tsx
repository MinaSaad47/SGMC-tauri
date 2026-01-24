import { mutationOptions } from "@tanstack/react-query";
import { v7 as uuid } from "uuid";
import { getDb } from "../db";
import { AddSessionSchema, UpdateSessionSchema } from "../types/sessions";
import { getStatementsQueryKey } from "./statements";
import { debug } from "@tauri-apps/plugin-log";
import i18n from "../i18n";

export function addSessionMutationOptions() {
  return mutationOptions({
    mutationFn: async (addSession: AddSessionSchema) => {
      debug(`Adding session for ${JSON.stringify(addSession, null, 2)}`);

      const parseResult = AddSessionSchema.safeParse(addSession);

      if (!parseResult.success) {
        throw new Error(i18n.t("common.invalid_data"));
      }

      const data = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const queryResult = await db.execute(
        `
        INSERT INTO sessions (id, statement_id, "procedure", created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
        [id, data.statementId, data.procedure],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("common.operation_failed"));
      }

      return { id, ...data };
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.session_added"),
    },
  });
}

export function updateSessionMutationOptions() {
  return mutationOptions({
    mutationFn: async (data: {
      id: string;
      updateSession: UpdateSessionSchema;
    }) => {
      const parseResult = UpdateSessionSchema.safeParse(data.updateSession);

      if (!parseResult.success) {
        throw new Error(i18n.t("statements.sessions.no_sessions"));
      }

      const updateData = parseResult.data;

      const db = await getDb();

      const queryResult = await db.execute(
        `
              UPDATE sessions
              SET "procedure" = ?, updated_at = datetime('now')
              WHERE id = ?
            `,
        [updateData.procedure, data.id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.session_updated_failed"));
      }

      return { id: data.id, ...updateData };
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.session_updated"),
    },
  });
}

export function deleteSessionMutationOptions() {
  return mutationOptions({
    mutationFn: async (id: string) => {
      const db = await getDb();

      const queryResult = await db.execute(
        `DELETE FROM sessions WHERE id = ?`,
        [id],
      );

      if (queryResult.rowsAffected === 0) {
        throw new Error(i18n.t("messages.session_deleted_failed"));
      }

      return id;
    },
    meta: {
      invalidatesQueries: [getStatementsQueryKey()],
      successMessage: i18n.t("messages.session_deleted"),
    },
  });
}
