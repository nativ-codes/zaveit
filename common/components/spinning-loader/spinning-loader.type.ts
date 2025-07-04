import { Units } from "@/common/constants";

export enum SpinningLoaderSizeEnum {
  small = "small",
  medium = "medium",
}

export type SpinningLoaderPropsType = {
  size?: keyof typeof SpinningLoaderSizeEnum;
  color?: string;
}; 

export const SpinningLoaderSizeMap = {
  [SpinningLoaderSizeEnum.small]: Units.s20,
  [SpinningLoaderSizeEnum.medium]: Units.s32,
}