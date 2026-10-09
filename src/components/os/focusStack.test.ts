import { describe, it, expect } from "vitest";
import { FocusStack } from "./focusStack";

describe("FocusStack", () => {
  it("gives each registered window a distinct z-index", () => {
    const fs = new FocusStack();
    const zs = [fs.register("a"), fs.register("b"), fs.register("c")];
    expect(new Set(zs).size).toBe(3);
  });

  it("raises the focused window above all others", () => {
    const fs = new FocusStack();
    fs.register("a");
    const b = fs.register("b");
    expect(fs.focus("a")).toBeGreaterThan(b);
    expect(fs.z("a")).toBeGreaterThan(fs.z("b"));
  });

  it("preserves relative stacking of untouched windows when focus moves", () => {
    // Regression: old binary scheme flipped non-active windows to z:auto
    const fs = new FocusStack();
    fs.register("a"); // oldest
    fs.register("b");
    fs.register("c");
    const zaBefore = fs.z("a");
    const zbBefore = fs.z("b");
    fs.focus("c");
    expect(fs.z("a")).toBe(zaBefore); // unchanged
    expect(fs.z("b")).toBe(zbBefore); // unchanged
    expect(fs.z("c")).toBeGreaterThan(fs.z("b"));
  });

  it("registering an existing window is idempotent (no z change)", () => {
    const fs = new FocusStack();
    const z1 = fs.register("a");
    const z2 = fs.register("a");
    expect(z2).toBe(z1);
  });

  it("unregister removes a window; its z value is not reused", () => {
    const fs = new FocusStack();
    fs.register("a");
    fs.unregister("a");
    expect(fs.z("a")).toBe(0);
    const z = fs.focus("a");
    expect(z).toBeGreaterThan(1);
  });
});
