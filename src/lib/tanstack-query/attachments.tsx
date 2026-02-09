import { getAppConfig } from "@/lib/config/app";
import { mutationOptions } from "@tanstack/react-query";
import { exists, mkdir, remove, writeFile } from "@tauri-apps/plugin-fs";
import { v7 as uuid } from "uuid";
import { getDb } from "../database";
import i18n from "../i18n";
import { Attachment } from "../types/attachments";
import { getStatementDetailsQueryKey } from "./statements";

export function addAttachmentMutationOptions()
{
  return mutationOptions({
    mutationFn: async (data: {
      statementId: string;
      fileData: string; // Base64
      fileName: string;
      fileType: string;
    }) =>
    {
      const db = await getDb();
      const id = uuid();
      const createdAt = Date.now();

      // 1. Get absolute data directory from Rust
      const config = await getAppConfig();
      const dataDir = config.data_dir;
      const attachmentsDir = `${dataDir}/attachments`;

      // 2. Ensure directory exists
      const dirExists = await exists(attachmentsDir);
      if (!dirExists)
      {
        await mkdir(attachmentsDir, { recursive: true });
      }

      // 3. Decode Base64
      const binaryString = atob(data.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++)
      {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 4. Save File using absolute path
      const extension = data.fileName.split(".").pop() || "jpg";
      const safeFileName = `${id}.${extension}`;
      const filePath = `${attachmentsDir}/${safeFileName}`;

      await writeFile(filePath, bytes);

      // 5. Save to DB
      const result = await db.execute(
        "INSERT INTO attachments (id, statement_id, file_name, file_path, file_type, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, data.statementId, data.fileName, filePath, data.fileType, bytes.length, createdAt]
      );

      if (result.rowsAffected === 0) throw new Error(i18n.t("common.operation_failed"));

      return {
        id,
        statementId: data.statementId,
        fileName: data.fileName,
        filePath,
        fileType: data.fileType,
        createdAt,
      } as Attachment;
    },
    meta: {
      invalidatesQueries: [["statements"]],
      successMessage: i18n.t("messages.attachment_added", "Attachment added successfully"),
    },
  });
}

export function deleteAttachmentMutationOptions(statementId: string)
{
  return mutationOptions({
    mutationFn: async (attachment: Attachment) =>
    {
      const db = await getDb();

      // 1. Delete from DB
      await db.execute("DELETE FROM attachments WHERE id = ?", [attachment.id]);

      // 2. Delete from Disk (absolute path stored in DB)
      try
      {
        await remove(attachment.filePath);
      } catch (e)
      {
        console.warn("Failed to delete file:", e);
      }

      return attachment.id;
    },
    meta: {
      invalidatesQueries: [getStatementDetailsQueryKey(statementId)],
      successMessage: i18n.t("messages.attachment_deleted", "Attachment deleted successfully"),
    },
  });
}
