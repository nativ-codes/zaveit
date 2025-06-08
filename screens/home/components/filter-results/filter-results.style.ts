import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Units.s16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Units.s16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
}); 