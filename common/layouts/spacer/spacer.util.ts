import styles from "./spacer.style";
import { SizeType, DirectionType, StylePropsType } from "./spacer.type";

export const getSpacerStyles = (directions?: DirectionType, sizes?: SizeType) => {
  if (Array.isArray(directions) && Array.isArray(sizes)) {
    return directions.map(
      (side, index) =>
        (styles as StylePropsType)[`${side}_${sizes[index]}_Spacing`]
    );
  }
  if (Array.isArray(directions) && typeof sizes === "string") {
    return directions.map(
      (side) => (styles as StylePropsType)[`${side}_${sizes}_Spacing`]
    );
  }
  if (typeof directions === "string" && typeof sizes === "string") {
    return (styles as StylePropsType)[`${directions}_${sizes}_Spacing`];
  }

  return null;
};
