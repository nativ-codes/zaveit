import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Units.s16,
    gap: Units.s16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Units.s16,
  },
}); 