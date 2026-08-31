import { describe, expect, it } from "vitest";
import { getFindingColor, getStudyStatusColor } from "./index";

describe("utils", () => {
  it("returns a known finding color", () => {
    expect(getFindingColor("Pneumonia")).toBe("#FF4500");
  });

  it("falls back for unknown findings", () => {
    expect(getFindingColor("UnknownFinding")).toBe("#8884d8");
  });

  it("maps study status to colors", () => {
    expect(getStudyStatusColor("Abnormal")).toBe("#DC143C");
    expect(getStudyStatusColor("pending")).toBe("#1E90FF");
  });
});
