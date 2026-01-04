import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type StatusBadgeProps = {
  status: "Paid" | "Unpaid" | "Partial";
  className?: string;
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { t } = useTranslation();

  const statusMap = {
    Paid: {
      class: "bg-green-500 hover:bg-green-600",
      label: t("statements.status.paid"),
    },
    Unpaid: {
      class: "bg-red-500 hover:bg-red-600",
      label: t("statements.status.unpaid"),
    },
    Partial: {
      class: "bg-yellow-500 hover:bg-yellow-600",
      label: t("statements.status.partial"),
    },
  };

  return (
    <Badge
      className={`text-white transition-colors duration-300 ${statusMap[status].class} ${className || ""}`}
    >
      {statusMap[status].label}
    </Badge>
  );
};
