import { Item, ItemContent, ItemMedia } from "./ui/item";
import { Spinner } from "./ui/spinner";

type MessageLoadingProps = {
  message: string;
};

export function LoadingMessage(props: MessageLoadingProps) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Item>
        <ItemMedia>
          <Spinner />
        </ItemMedia>
        <ItemContent>{props.message}</ItemContent>
      </Item>
    </div>
  );
}
