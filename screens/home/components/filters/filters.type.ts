export type FiltersType = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onTagSelect: (tag: string) => void;
  selectedTags: string[];
}; 