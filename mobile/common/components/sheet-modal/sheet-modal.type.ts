import { ReactNode } from "react";

export type SheetModalPropsType = {
  isVisible: boolean;
  onRequestClose: () => void;
  title: string;
  body: string;
  buttons?: ReactNode;
  children?: ReactNode;
};
