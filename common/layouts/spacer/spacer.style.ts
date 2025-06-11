import { StyleSheet } from "react-native";

import { Units } from "@/common/constants";
import { toTitleCase } from "@/common/utils";

import { SpacerDirectionEnum } from "./spacer.type";

export default StyleSheet.create(
  Object.keys(SpacerDirectionEnum).reduce(
    (directionsAccumulator, currentDirection) => ({
      ...directionsAccumulator,
      ...Object.entries(Units).reduce(
        (spacingAccumulator, [spacingName, spacingValue]) => ({
          ...spacingAccumulator,
          [`${currentDirection}_${spacingName}_Spacing`]: {
            [currentDirection === "full"
              ? "padding"
              : `padding${toTitleCase(currentDirection)}`]: spacingValue,
          },
        }),
        {}
      ),
    }),
    {}
  )
);
