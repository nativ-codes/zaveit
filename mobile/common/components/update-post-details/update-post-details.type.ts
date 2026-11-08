export type UpdatePostDetailsPropsType = {
  additionalTags?: string[];
  selectedAdditionalTags?: string[];
  mainTags?: string[];
  selectedMainTags?: string[];
  onMainTagPress: (tag: string) => void;
  onAdditionalTagPress: (tag: string) => void;
  isLoading?: boolean;
};
