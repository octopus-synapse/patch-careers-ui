import { describe, expect, it } from "vitest";
import { createWizardStore } from "./wizard-store";

describe("createWizardStore", () => {
  it("starts with an empty draft", () => {
    const store = createWizardStore();
    expect(store.getState().formData).toEqual({});
    expect(store.getState().items).toEqual([]);
  });

  it("setFormData accepts a value and an updater (mirrors useState)", () => {
    const store = createWizardStore();
    store.getState().setFormData({ headline: "Dev" });
    expect(store.getState().formData).toEqual({ headline: "Dev" });
    store.getState().setFormData((prev) => ({ ...prev, city: "SP" }));
    expect(store.getState().formData).toEqual({ headline: "Dev", city: "SP" });
  });

  it("setItems accepts a value and an updater", () => {
    const store = createWizardStore();
    store.getState().setItems([{ id: "a" }] as never);
    expect(store.getState().items).toHaveLength(1);
    store.getState().setItems((prev) => [...prev, { id: "b" }] as never);
    expect(store.getState().items).toHaveLength(2);
  });

  it("hydrate replaces the whole draft and reset clears it", () => {
    const store = createWizardStore();
    store.getState().hydrate({ headline: "X" }, [{ id: "a" }] as never);
    expect(store.getState().formData).toEqual({ headline: "X" });
    expect(store.getState().items).toHaveLength(1);
    store.getState().reset();
    expect(store.getState().formData).toEqual({});
    expect(store.getState().items).toEqual([]);
  });

  it("instances are isolated (scoped per wizard mount)", () => {
    const a = createWizardStore();
    const b = createWizardStore();
    a.getState().setFormData({ headline: "only-a" });
    expect(b.getState().formData).toEqual({});
  });
});
