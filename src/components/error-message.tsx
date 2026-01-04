import { AlertTriangleIcon } from "lucide-react";
import { ItemMedia, ItemContent, Item } from "./ui/item";
import { useTranslation } from "react-i18next";

export function ErrorMessage({ error }: { error: unknown }) {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <Item>
        <ItemMedia>
          <AlertTriangleIcon />
        </ItemMedia>
        <ItemContent>
          <div className="text-red-600">{t("common.error")}: {String(error)}</div>
        </ItemContent>
      </Item>
    </div>
  );
}
