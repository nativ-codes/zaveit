import { Colors } from "@/common/constants/colors";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  image: {
    width: "100%",
    height: 200,
  },
  author: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
}); 