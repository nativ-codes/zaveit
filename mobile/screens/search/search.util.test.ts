import { describe, expect, it } from "@jest/globals";
import { getPickerTags } from "./search.util";

describe("getPickerTags", () => {
  const tags = ["travel", "food", "music", "trains"];

  it("puts picked Tags first and keeps the rest in order", () => {
    expect(getPickerTags({ tags, selected: ["music"], query: "" })).toEqual(["music", "travel", "food", "trains"]);
  });

  it("filters picked and unpicked Tags by the query, ignoring case and a leading #", () => {
    expect(getPickerTags({ tags, selected: ["trains", "food"], query: " #TRA " })).toEqual(["trains", "travel"]);
  });
});
