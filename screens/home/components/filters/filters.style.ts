import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  searchContainer: {
    gap: Units.s16,
  },
  searchInput: {
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.primary,
    paddingVertical: Units.s20,
    paddingHorizontal: Units.s16,
    borderRadius: Units.s24,
    marginHorizontal: Units.s16,
  },
  tagsContent: {
    paddingHorizontal: Units.s16,
    gap: Units.s8,
  },
  tagButton: {
    padding: Units.s8,
    borderRadius: Units.s16,
    backgroundColor: Colors.surface.primary,
  },
  selectedTagButton: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  selectedTagText: {
    color: Colors.text.primary,
  },
}); 