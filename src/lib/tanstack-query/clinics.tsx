import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { v7 as uuid } from "uuid";
import { getDb } from "../database";
import i18n from "../i18n";
import { AddClinicSchema, Clinic, UpdateClinicSchema } from "../types/clinics";

export function getClinicsQueryKey() {
  return ["clinics"] as const;
}

export function getClinicsQueryOptions() {
  return queryOptions({
    queryKey: getClinicsQueryKey(),
    queryFn: async () => {
      const db = await getDb();
      return await db.select<Clinic[]>("SELECT * FROM clinics ORDER BY name ASC");
    },
  });
}

export function addClinicMutationOptions() {
  return mutationOptions({
    mutationFn: async (addClinic: AddClinicSchema) => {
      const parseResult = AddClinicSchema.safeParse(addClinic);
      if (!parseResult.success) throw new Error(i18n.t("common.invalid_data"));

      const data = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const result = await db.execute(
        "INSERT INTO clinics (id, name, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))",
        [id, data.name]
      );

      if (result.rowsAffected === 0) throw new Error(i18n.t("common.operation_failed"));
      return id;
    },
    meta: {
      invalidatesQueries: [getClinicsQueryKey()],
      successMessage: i18n.t("messages.clinic_added"),
    },
  });
}

export function updateClinicMutationOptions() {
  return mutationOptions({
    mutationFn: async (data: { id: string; updateClinic: UpdateClinicSchema }) => {
      const parseResult = UpdateClinicSchema.safeParse(data.updateClinic);
      if (!parseResult.success) throw new Error(i18n.t("common.invalid_data"));

      const updateData = parseResult.data;
      const db = await getDb();

      const result = await db.execute(
        "UPDATE clinics SET name = ?, updated_at = datetime('now') WHERE id = ?",
        [updateData.name, data.id]
      );

      if (result.rowsAffected === 0) throw new Error(i18n.t("messages.clinic_updated_failed"));
      return data.id;
    },
    meta: {
      invalidatesQueries: [getClinicsQueryKey()],
      successMessage: i18n.t("messages.clinic_updated"),
    },
  });
}

export function deleteClinicMutationOptions() {
  return mutationOptions({
    mutationFn: async (id: string) => {
      const db = await getDb();
      const result = await db.execute("DELETE FROM clinics WHERE id = ?", [id]);

      if (result.rowsAffected === 0) throw new Error(i18n.t("messages.clinic_deleted_failed"));
      return id;
    },
    meta: {
      invalidatesQueries: [getClinicsQueryKey()],
      successMessage: i18n.t("messages.clinic_deleted"),
    },
  });
}
