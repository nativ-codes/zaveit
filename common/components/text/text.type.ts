import { TextProps, TextStyle } from 'react-native';

export enum TextVariantEnum {
  "title-screen" = "title-screen",
  "title-section" = "title-section",
  "title-sub-section" = "title-sub-section",
  "title-body" = "title-body",
  "title-group" = "title-group",
  "body-large" = "body-large",
  "body-large-bold" = "body-large-bold",
  "body-default" = "body-default",
  "body-default-bold" = "body-default-bold",
  "body-small" = "body-small",
  "body-small-bold" = "body-small-bold",
  "subtext-large" = "subtext-large",
  "subtext-medium" = "subtext-medium",
  "subtext-small" = "subtext-small",
  "label-large" = "label-large",
  "label-medium" = "label-medium",
  "label-small" = "label-small",
  "overline-large" = "overline-large",
  "overline-small" = "overline-small",
}

export interface TextPropsType extends TextProps, TextStyle {
  variant?: keyof typeof TextVariantEnum;
}
