import { ErrorMessage } from "@/components/error-message";
import { LoadingMessage } from "@/components/table-loading";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import
{
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks";
import { getClinicsQueryOptions } from "@/lib/tanstack-query/clinics";
import { getDoctorsQueryOptions } from "@/lib/tanstack-query/doctors";
import
{
  GetStatementsParams,
  getStatementsQueryOptions,
} from "@/lib/tanstack-query/statements";
import { Statement } from "@/lib/types/statements";
import { cn, formatCurrency, formatDate, shortenUuid } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/status-badge";
import
{
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatementsTableProps {
  patientId?: string;
}

export function StatementsTable({ patientId }: StatementsTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [remainingFilter, setRemainingFilter] = useState<
    "all" | "positive" | "negative"
  >("all");
  const [doctorIdFilter, setDoctorIdFilter] = useState<string | undefined>(undefined);
  const [clinicIdFilter, setClinicIdFilter] = useState<string | undefined>(undefined);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const doctorsQuery = useQuery(getDoctorsQueryOptions());
  const clinicsQuery = useQuery(getClinicsQueryOptions());

  const statementsQuery = useQuery(
    getStatementsQueryOptions(
      new GetStatementsParams({
        patientId,
        search: debouncedSearch,
        remainingFilter,
        doctorId: doctorIdFilter === "all" ? undefined : doctorIdFilter,
        clinicId: clinicIdFilter === "all" ? undefined : clinicIdFilter,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
    ),
  );

  const columns = useMemo(() => {
    const allColumns: ColumnDef<Statement>[] = [
      {
        accessorKey: "id",
        header: t("statements.id"),
        cell: ({ row }) => (
          <Link to={`/statements/${row.original.id}`}>
            <Badge className="hover:scale-105 duration-300 transition-all">
              {shortenUuid(row.original.id)}
            </Badge>
          </Link>
        ),
      },
      {
        accessorKey: "patient.name",
        header: t("statements.patient"),
        cell: ({ row }) => (
          <Link
            to={`/patients/${row.original.patient.id}`}
            className="hover:underline"
          >
            {row.original.patient.name}
          </Link>
        ),
      },
      {
        accessorKey: "doctor.name",
        header: t("doctors.singular"),
        cell: ({ row }) => row.original.doctor?.name || "-",
      },
      {
        accessorKey: "clinic.name",
        header: t("clinics.singular"),
        cell: ({ row }) => row.original.clinic?.name || "-",
      },
      {
        accessorKey: "status",
        header: t("statements.status.label"),
        cell: ({ row }) => {
          const { total, totalPaid } = row.original;
          let status: "Paid" | "Unpaid" | "Partial" = "Unpaid";
          if (totalPaid >= total) {
            status = "Paid";
          } else if (totalPaid > 0) {
            status = "Partial";
          }
          return <StatusBadge status={status} />;
        },
      },
      {
        accessorKey: "total",
        header: t("statements.total"),
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "totalPaid",
        header: t("statements.paid"),
        cell: ({ row }) => formatCurrency(row.original.totalPaid),
      },
      {
        accessorKey: "totalRemaining",
        header: t("statements.remaining"),
        cell: ({ row }) => {
          const val = row.original.totalRemaining;
          return (
            <span
              className={cn(
                "font-medium",
                val > 0 && "text-red-600 dark:text-red-400",
                val < 0 && "text-blue-600 dark:text-blue-400",
              )}
            >
              {formatCurrency(val)}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("statements.date"),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to={`/statements/${row.original.id}`}>
                  {t("common.view_details")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];

    if (patientId) {
      // @ts-ignore
      return allColumns.filter((col) => col.accessorKey !== "patient.name");
    }
    return allColumns;
  }, [patientId, t]);

  return (
    <div className="relative h-full w-full">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
          {!patientId && (
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("statements.search_placeholder")}
              className="max-w-sm"
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {/* Remaining Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">
                {t("statements.filter_remaining.label")}:
              </span>
              <Select
                value={remainingFilter}
                onValueChange={(val: any) => setRemainingFilter(val)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("statements.filter_remaining.all")}
                  </SelectItem>
                  <SelectItem value="positive">
                    {t("statements.filter_remaining.positive")}
                  </SelectItem>
                  <SelectItem value="negative">
                    {t("statements.filter_remaining.negative")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Filter */}
            <Select
              value={doctorIdFilter || "all"}
              onValueChange={(val) => setDoctorIdFilter(val)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("doctors.title")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("doctors.title")}</SelectItem>
                {doctorsQuery.data?.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clinic Filter */}
            <Select
              value={clinicIdFilter || "all"}
              onValueChange={(val) => setClinicIdFilter(val)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("clinics.title")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("clinics.title")}</SelectItem>
                {clinicsQuery.data?.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {statementsQuery.isPending && <LoadingMessage message={t("statements.loading")} />}

      {statementsQuery.isError && <ErrorMessage error={statementsQuery.error} />}

      {statementsQuery.data && (
        <DataTable
          columns={columns}
          pagination={pagination}
          setPagination={setPagination}
          data={statementsQuery.data.items}
          pageCount={Math.ceil(
            statementsQuery.data.pagingInfo.total / pagination.pageSize,
          )}
        />
      )}
    </div>
  );
}