export type UpdatePostDetailsPropsType = {
  id?: string;
  title: string;
  author?: string;
  url: string;
  thumbnail?: string;
  additionalTags?: string[];
  selectedAdditionalTags?: string[];
  mainTags?: string[];
  selectedMainTags?: string[];
  onMainTagPress: (tag: string) => void;
  onAdditionalTagPress: (tag: string) => void;
  isLoading?: boolean;
}; 