
export type UpdatePostDetailsPropsType = {
  id?: string;
  title: string;
  author?: string;
  url: string;
  thumbnail?: string;
  availableTags?: string[];
  selectedTags?: string[];
  onTagPress: (tag: string) => void;
}; 