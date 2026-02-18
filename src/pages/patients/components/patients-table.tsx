import { ErrorMessage } from "@/components/error-message";
import { LoadingMessage } from "@/components/table-loading";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks";
import {
  GetPatientsParams,
  getPatientsQueryOptions,
} from "@/lib/tanstack-query/patients";
import { Patient } from "@/lib/types/patients";
import { shortenUuid } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PatientsTable() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const patients = useQuery(
    getPatientsQueryOptions(
      new GetPatientsParams({
        search: debouncedSearch,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
    ),
  );

  const columns = useMemo(
    () =>
      [
        {
          accessorKey: "id",
          header: t("patients.id"),
          cell: ({ row }) => (
            <Link to={`/patients/${row.original.id}`}>
              <Badge className="hover:scale-105 duration-300 transition-all">
                {shortenUuid(row.original.id)}
              </Badge>
            </Link>
          ),
        },
        {
          accessorKey: "name",
          header: t("patients.name"),
        },
        {
          accessorKey: "phone",
          header: t("patients.phone"),
        },
        {
          accessorKey: "createdAt",
          header: t("patients.created_at"),
        },
        {
          accessorKey: "updatedAt",
          header: t("patients.updated_at"),
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/patients/${row.original.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("common.view_details")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ] satisfies ColumnDef<Patient>[],
    [t],
  );

  return (
    <div className="relative h-full w-full">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("patients.search_placeholder")}
        className="mb-4 max-w-sm"
      />

      {patients.isPending && <LoadingMessage message={t("patients.loading")} />}

      {patients.isError && <ErrorMessage error={patients.error} />}

      {patients.data && (
        <DataTable
          columns={columns}
          pagination={pagination}
          setPagination={setPagination}
          data={patients.data.items}
        />
      )}
    </div>
  );
}
