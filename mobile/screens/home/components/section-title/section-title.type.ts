import Icon from "@expo/vector-icons/Feather";
import { ComponentProps } from "react";

export type SectionTitlePropsType = {
  title: string;
  icon: ComponentProps<typeof Icon>["name"];
};
