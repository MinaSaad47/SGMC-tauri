import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { v7 as uuid } from "uuid";
import { getDb } from "../database";
import i18n from "../i18n";
import { AddDoctorSchema, Doctor, UpdateDoctorSchema } from "../types/doctors";

export function getDoctorsQueryKey() {
  return ["doctors"] as const;
}

export function getDoctorsQueryOptions() {
  return queryOptions({
    queryKey: getDoctorsQueryKey(),
    queryFn: async () => {
      const db = await getDb();
      return await db.select<Doctor[]>("SELECT * FROM doctors ORDER BY name ASC");
    },
  });
}

export function addDoctorMutationOptions() {
  return mutationOptions({
    mutationFn: async (addDoctor: AddDoctorSchema) => {
      const parseResult = AddDoctorSchema.safeParse(addDoctor);
      if (!parseResult.success) throw new Error(i18n.t("common.invalid_data"));

      const data = parseResult.data;
      const db = await getDb();
      const id = uuid();

      const result = await db.execute(
        "INSERT INTO doctors (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
        [id, data.name, data.phone]
      );

      if (result.rowsAffected === 0) throw new Error(i18n.t("common.operation_failed"));
      return id;
    },
    meta: {
      invalidatesQueries: [getDoctorsQueryKey()],
      successMessage: i18n.t("messages.doctor_added"),
    },
  });
}

export function updateDoctorMutationOptions() {
  return mutationOptions({
    mutationFn: async (data: { id: string; updateDoctor: UpdateDoctorSchema }) => {
      const parseResult = UpdateDoctorSchema.safeParse(data.updateDoctor);
      if (!parseResult.success) throw new Error(i18n.t("common.invalid_data"));

      const updateData = parseResult.data;
      const db = await getDb();

      const result = await db.execute(
        "UPDATE doctors SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?",
        [updateData.name, updateData.phone, data.id]
      );

      if (result.rowsAffected === 0) throw new Error(i18n.t("messages.doctor_updated_failed"));
      return data.id;
    },
    meta: {
      invalidatesQueries: [getDoctorsQueryKey()],
      successMessage: i18n.t("messages.doctor_updated"),
    },
  });
}

export function deleteDoctorMutationOptions() {
  return mutationOptions({
    mutationFn: async (id: string) => {
      const db = await getDb();
      // On Delete Set Null is configured in migration 2 for statements.
      const result = await db.execute("DELETE FROM doctors WHERE id = ?", [id]);

      if (result.rowsAffected === 0) throw new Error(i18n.t("messages.doctor_deleted_failed"));
      return id;
    },
    meta: {
      invalidatesQueries: [getDoctorsQueryKey()],
      successMessage: i18n.t("messages.doctor_deleted"),
    },
  });
}
