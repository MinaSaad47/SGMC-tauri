import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Attachment } from "@/lib/types/attachments";
import { StatementDetails } from "@/lib/types/statements";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { convertFileSrc } from "@tauri-apps/api/core";
import { GripVertical, Printer } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";

interface PrintPreviewProps
{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  statement: StatementDetails;
}

export function PrintPreview({ isOpen, onOpenChange, statement }: PrintPreviewProps)
{
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const [printAttachments, setPrintAttachments] = useState<Attachment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() =>
  {
    if (isOpen && statement.attachments)
    {
      setPrintAttachments(statement.attachments);
      setSelectedIds(statement.attachments.map(a => a.id));
    }
  }, [isOpen, statement]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Statement-${statement.id}`,
    bodyClass: "print-body",
  });

  const onDragEnd = (result: DropResult) =>
  {
    if (!result.destination) return;
    const items = Array.from(printAttachments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPrintAttachments(items);
  };

  const toggleSelection = (id: string) =>
  {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const finalPrintableAttachments = printAttachments.filter(a => selectedIds.includes(a.id));

  const printableStatement = {
    ...statement,
    attachments: finalPrintableAttachments
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 border-none shadow-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <DialogHeader className="p-4 shrink-0 border-b bg-background flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="h-5 w-5 text-primary" />
            {t("common.print")} Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Attachment Selection Sidebar */}
          <div className="w-80 bg-background border-e p-6 overflow-y-auto space-y-6 shrink-0">
            <div className="space-y-1">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{t("attachments.title")}</h4>
              <p className="text-[11px] text-muted-foreground leading-tight">Drag to reorder. Check to include.</p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="attachments">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {printAttachments.map((att, index) => (
                      <Draggable key={att.id} draggableId={att.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all bg-card hover:border-zinc-300",
                              selectedIds.includes(att.id) && "bg-primary/5 border-primary shadow-sm",
                              snapshot.isDragging && "shadow-lg scale-105 z-50 ring-2 ring-primary"
                            )}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing p-1"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(att.id)}
                              onChange={() => toggleSelection(att.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                            />

                            <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => toggleSelection(att.id)}>
                              <p className="text-[11px] font-bold truncate leading-tight mb-0.5">{att.fileName}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{formatDate(new Date(att.createdAt))}</p>
                            </div>
                            <img src={convertFileSrc(att.filePath)} className="h-10 w-10 object-cover rounded-md border" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {printAttachments.length === 0 && (
              <p className="text-xs text-center py-4 text-muted-foreground italic">No attachments found.</p>
            )}
          </div>

          {/* Right: Actual Preview */}
          <div className="flex-1 bg-zinc-200 dark:bg-zinc-900 p-8 md:p-12 flex justify-center overflow-auto">
            <div className="shadow-2xl origin-top transition-transform duration-300 bg-white">
              <PrintableStatementContent
                ref={printRef}
                statement={printableStatement}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 shrink-0 bg-background px-8">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 rounded-xl font-bold h-11 border-zinc-200">
            {t("common.cancel")}
          </Button>
          <Button onClick={() => handlePrint()} className="px-12 rounded-xl font-bold h-11 shadow-xl shadow-primary/20">
            <Printer className="me-2 h-4 w-4" />
            {t("common.print")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Internal component for the actual A4 content
const PrintableStatementContent = forwardRef<
  HTMLDivElement,
  { statement: StatementDetails }
>(({ statement }, ref) =>
{
  const { t, i18n } = useTranslation();

  return (
    <div
      ref={ref}
      id="print-content"
      dir={i18n.dir()}
      className="bg-zinc-100 text-black font-sans print:bg-white"
    >
      <style>{`
        @media print {
          @page { size: auto; margin: 0; }
          html, body { 
             height: auto !important; 
             overflow: visible !important; 
             background: white !important; 
             margin: 0 !important;
          }
          
          #print-content { 
             width: 100%; 
             height: auto; 
             display: block; 
             background-color: white !important;
          }
          
          /* Main Statement Page */
          .print-page {
             width: 100% !important;
             height: auto !important;
             min-height: 50vh;
             margin: 0 !important;
             padding: 15mm !important;
             background: white !important;
             page-break-after: always;
             break-after: page;
          }
          
          /* Attachment Page */
          .print-attachment-page {
             width: 100% !important;
             height: 80vh !important;
             max-height: 80vh !important;
             margin: 0 !important;
             padding: 0 !important;
             background: white !important;
             
             page-break-before: always;
             break-before: page;
             page-break-inside: avoid;
             break-inside: avoid;
             
             display: flex;
             flex-direction: column;
             overflow: hidden;
             
             align-items: center;
             justify-content: center;
          }
          
          .print-attachment-page:last-child {
             page-break-after: auto;
             break-after: auto;
          }
          
          /* Force images to be block */
          img { display: block !important; }
        }
        
        @media screen {
          .print-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto 20px auto;
            background: white;
            box-sizing: border-box;
            position: relative;
          }
          .print-attachment-page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto 20px auto;
            background: white;
            box-sizing: border-box;
            position: relative;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      {/* PAGE 1: Statement Content */}
      <div className="print-page mx-auto bg-white">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-20 h-20" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <p>Generated by {t("common.app_name")}</p>
              <p>{t("common.date")}: {formatDate(new Date())}</p>
              <p className="text-[10px]">{t("statements.id")}: {statement.id}</p>
            </div>
          </div>
          <div className="text-end">
            <h2 className="text-lg font-semibold mb-1">
              {t("statements.details_title")}
            </h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-bold text-black text-base">
                {statement.patient.name}
              </p>
              <p>{statement.patient.phone}</p>
            </div>
          </div>
        </div>

        {/* Basic Info (Doctor/Clinic) */}
        {(statement.doctor || statement.clinic) && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg grid grid-cols-2 gap-4 text-xs print:bg-transparent print:border print:border-gray-200">
            {statement.doctor && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("doctors.singular")}</p>
                <p className="font-bold">{statement.doctor.name}</p>
                {statement.doctor.phone && <p className="text-[10px] text-gray-500">{statement.doctor.phone}</p>}
              </div>
            )}
            {statement.clinic && (
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("clinics.singular")}</p>
                <p className="font-bold">{statement.clinic.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Financial Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 border-b pb-1.5">
            {t("financial.summary")}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between p-1.5 bg-gray-50 rounded print:bg-transparent print:border print:border-gray-200">
              <span>{t("financial.total_required")}</span>
              <span className="font-bold">{formatCurrency(statement.total)}</span>
            </div>
            <div className="flex justify-between p-1.5 bg-gray-50 rounded print:bg-transparent print:border print:border-gray-200">
              <span>{t("financial.total_paid")}</span>
              <span className="font-bold text-green-700">
                {formatCurrency(statement.totalPaid)}
              </span>
            </div>
            <div className="flex justify-between p-1.5 bg-gray-50 rounded col-span-2 print:bg-transparent print:border print:border-gray-200">
              <span>{t("financial.total_remaining")}</span>
              <span
                className={`font-bold ${statement.totalRemaining > 0 ? "text-red-600" : ""}`}
              >
                {formatCurrency(statement.totalRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 border-b pb-1.5">
            {t("statements.sessions.title")}
          </h3>
          {statement.sessions.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-800">
                  <th className="py-2 text-start font-bold">
                    {t("statements.sessions.procedure")}
                  </th>
                  <th className="py-2 text-end font-bold">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody>
                {statement.sessions.map((session) => (
                  <tr key={session.id} className="border-b border-zinc-300">
                    <td className="py-2.5 text-start">{session.procedure}</td>
                    <td className="py-2.5 text-end">
                      {formatDate(session.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[11px] text-gray-500 italic">
              {t("statements.sessions.no_sessions")}
            </p>
          )}
        </div>

        {/* Payments */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 border-b pb-1.5">
            {t("common.payment_history")}
          </h3>
          {statement.payments.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-800">
                  <th className="py-2 text-start font-bold">{t("common.date")}</th>
                  <th className="py-2 text-end font-bold">{t("common.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {statement.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-zinc-300">
                    <td className="py-2.5 text-start">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="py-2.5 text-end font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[11px] text-gray-500 italic">
              {t("statements.payments.no_payments")}
            </p>
          )}
        </div>
      </div>

      {/* ATTACHMENT PAGES */}
      {statement.attachments && statement.attachments.map((att) => (
        <div key={att.id} className="print-attachment-page mx-auto bg-white flex flex-col justify-center items-center">
          {/* Attachment Image - Full Page, No Header, No Border */}
          <div
            className="flex items-center justify-center overflow-hidden w-full h-full p-0 border-0"
          >
            <img
              src={convertFileSrc(att.filePath)}
              alt={att.fileName}
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
                boxShadow: "none"
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

PrintableStatementContent.displayName = "PrintableStatementContent";
