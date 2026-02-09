import
{
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import
{
  deleteAttachmentMutationOptions,
} from "@/lib/tanstack-query/attachments";
import { Attachment } from "@/lib/types/attachments";
import { DialogClose } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { convertFileSrc } from "@tauri-apps/api/core";
import { FileText, Maximize2, Trash, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface AttachmentsListProps
{
  statementId: string;
  attachments: Attachment[];
}

export function AttachmentsList({ statementId, attachments }: AttachmentsListProps)
{
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<Attachment | null>(
    null,
  );

  const deleteMutation = useMutation({
    ...deleteAttachmentMutationOptions(statementId),
    onSuccess: () =>
    {
      setDeletingAttachment(null);
    },
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {attachments.map((att) =>
      {
        const src = convertFileSrc(att.filePath);
        return (
          <div key={att.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border shadow-sm">
            <img
              src={src}
              alt={att.fileName}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
              onClick={() => setSelectedImage(att)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={() => setSelectedImage(att)}
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={(e) =>
                {
                  e.stopPropagation();
                  setDeletingAttachment(att);
                }}
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4 text-[10px] text-white font-medium truncate pointer-events-none">
              {att.fileName}
            </div>
          </div>
        );
      })}

      {attachments.length === 0 && (
        <div className="col-span-full py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
          <FileText className="h-8 w-8 opacity-20" />
          <p>{t("attachments.no_attachments")}</p>
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-[95vw] max-w-[95vw] h-[95vh] p-0 overflow-hidden bg-zinc-950/60 border-none flex items-center justify-center shadow-2xl">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={convertFileSrc(selectedImage.filePath)}
                alt={selectedImage.fileName}
                className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-200"
              />
            )}

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                size="icon"
                variant={"secondary"}
                className="absolute top-4 left-4 rounded-full z-50 h-10 w-10"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingAttachment}
        onOpenChange={(open) => !open && setDeletingAttachment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.cannot_be_undone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deletingAttachment && deleteMutation.mutate(deletingAttachment)
              }
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}