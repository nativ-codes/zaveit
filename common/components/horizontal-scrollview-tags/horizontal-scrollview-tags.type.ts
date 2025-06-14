export type HorizontalScrollviewTagsPropsType = {
  primaryTags: string[];
  secondaryTags: string[];
  selectedPrimaryTag: string | undefined;
  selectedSecondaryTags: string[];
  onPrimaryTagSelect: (tag: string | ((prev: string | undefined) => string | undefined)) => void;
  onSecondaryTagSelect: (tags: string[] | ((prev: string[]) => string[])) => void;
};
