import { describe, expect, it } from "vitest";
import {
  caretProgress,
  fingerPath,
  gazeForProgress,
  IDLE_FLAGS,
  isEmailShapeValid,
  mascotPaletteFor,
  poseFor,
  REST_CURL,
  SEALED_LID_SQUINT,
  SERIOUS_LID_DROOP,
} from "./mascot-model";

describe("poseFor", () => {
  it("rests with folded fingers, a drooped serious lid and a smile", () => {
    const pose = poseFor(IDLE_FLAGS);
    expect(pose.curl).toBe(REST_CURL);
    expect(pose.lidTopL).toBe(SERIOUS_LID_DROOP);
    expect(pose.lidTopR).toBe(0);
    expect(pose.mouth).toBe("smile");
    expect(pose.browL.rot).toBe(0);
  });

  it("sealed is a content rest: soft squint, hands still on the card edge", () => {
    const pose = poseFor({ ...IDLE_FLAGS, sealed: true });
    expect(pose.lidLow).toBe(SEALED_LID_SQUINT);
    expect(pose.lidLow).toBeGreaterThan(-52);
    expect(pose.mouth).toBe("smile");
    expect(pose.curl).toBe(REST_CURL);
    expect(pose.armL).toEqual(poseFor(IDLE_FLAGS).armL);
  });

  it("reactive flags win over sealed", () => {
    const oops = poseFor({ ...IDLE_FLAGS, sealed: true, oops: true });
    expect(oops.mouth).toBe("flat");
    const happy = poseFor({ ...IDLE_FLAGS, sealed: true, happy: true });
    expect(happy.lidLow).toBe(-52);
    expect(happy.mouth).toBe("grin");
  });

  it("only the eager piece reacts to typing", () => {
    const pose = poseFor({ ...IDLE_FLAGS, talk: true });
    expect(pose.mouth).toBe("happy");
    expect(pose.browR.y).toBeLessThan(0);
    expect(pose.browL).toEqual(poseFor(IDLE_FLAGS).browL);
  });

  it("covers the eyes with open hands", () => {
    const pose = poseFor({ ...IDLE_FLAGS, covered: true });
    expect(pose.curl).toBe(0);
    expect(pose.lidTopL).toBe(66);
    expect(pose.lidTopR).toBe(66);
    expect(pose.armL).not.toEqual(poseFor(IDLE_FLAGS).armL);
  });

  it("peeks with half-closed lids", () => {
    const pose = poseFor({ ...IDLE_FLAGS, peek: true });
    expect(pose.lidTopL).toBe(34);
    expect(pose.lidTopR).toBe(34);
  });

  it("grimaces on oops: flat mouth, eager eye squints", () => {
    const pose = poseFor({ ...IDLE_FLAGS, oops: true });
    expect(pose.mouth).toBe("flat");
    expect(pose.lidTopR).toBe(20);
    expect(pose.browL.rot).toBeLessThan(0);
  });

  it("snap → whoa → happy escalate in that order", () => {
    const snap = poseFor({ ...IDLE_FLAGS, snap: true });
    expect(snap.mouth).toBe("o");
    expect(snap.browL.y).toBe(-12);

    const whoa = poseFor({ ...IDLE_FLAGS, snap: true, whoa: true });
    expect(whoa.armL.upper).toBeGreaterThan(90);
    expect(whoa.curl).toBe(0);

    const happy = poseFor({ ...IDLE_FLAGS, snap: true, happy: true });
    expect(happy.mouth).toBe("grin");
    expect(happy.lidLow).toBe(-52);
  });

  it("does not mutate the shared rest arm poses", () => {
    const a = poseFor(IDLE_FLAGS);
    const b = poseFor({ ...IDLE_FLAGS, covered: true });
    expect(a.armL).toEqual(poseFor(IDLE_FLAGS).armL);
    expect(b.armL).not.toBe(a.armL);
  });
});

describe("caretProgress / gazeForProgress", () => {
  it("is 0 at the start and clamps to 1 past the field", () => {
    expect(caretProgress(0, 300, 17)).toBe(0);
    expect(caretProgress(500, 300, 17)).toBe(1);
  });

  it("grows with the caret", () => {
    expect(caretProgress(5, 300, 17)).toBeLessThan(caretProgress(10, 300, 17));
  });

  it("is safe on a zero-width field", () => {
    expect(caretProgress(5, 0, 17)).toBe(0);
  });

  it("maps progress across −10…+10", () => {
    expect(gazeForProgress(0, 5)).toEqual({ x: -10, y: 5 });
    expect(gazeForProgress(0.5, 5)).toEqual({ x: 0, y: 5 });
    expect(gazeForProgress(2, 5).x).toBe(10);
  });
});

describe("isEmailShapeValid", () => {
  it("wants a domain with a dot", () => {
    expect(isEmailShapeValid("ana@patch")).toBe(false);
    expect(isEmailShapeValid("ana@patch.dev")).toBe(true);
  });
});

describe("mascotPaletteFor", () => {
  it("flips the serious piece ink↔paper and cross-colours the brows", () => {
    const light = mascotPaletteFor("light", "#16A34A");
    const dark = mascotPaletteFor("dark", "#4ADE80");
    expect(light.serious).toBe("#000000");
    expect(dark.serious).toBe("#FFFFFF");
    expect(light.browOnEager).toBe(light.serious);
    expect(dark.browOnEager).toBe(dark.serious);
    expect(light.browOnSerious).toBe(light.eager);
    expect(dark.seriousShadowOpacity).toBeGreaterThan(0);
    expect(light.seriousShadowOpacity).toBe(0);
    expect(dark.spark).toBe("#4ADE80");
  });
});

describe("fingerPath", () => {
  it("reaches the requested length", () => {
    expect(fingerPath(22)).toContain("-18.75");
  });
});
