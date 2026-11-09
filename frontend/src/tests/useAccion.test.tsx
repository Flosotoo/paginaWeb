import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAccion } from "../hooks/useAccion";

describe("envíos desde la interfaz", () => {
  afterEach(() => vi.useRealTimers());
  it("impide dos acciones simultáneas y habilita tras el plazo mínimo", async () => {
    vi.useFakeTimers();
    const ejecutar = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useAccion());
    let primero: Promise<string | undefined>;
    await act(async () => {
      primero = result.current.realizar(ejecutar);
      await Promise.resolve();
    });
    expect(result.current.procesando).toBe(true);
    await act(async () => {
      await result.current.realizar(ejecutar);
    });
    expect(ejecutar).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await primero;
    });
    expect(result.current.procesando).toBe(false);
  });
});
