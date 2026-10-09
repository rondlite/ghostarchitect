/**
 * Focus-stack z-ordering for the OS shell windows.
 *
 * Replaces the old binary scheme (.window.active { z-index: 1000 }, all other
 * windows z-index: auto). The binary scheme caused a visual glitch: when focus
 * moved from window A to B, every non-active window fell back to DOM-order
 * stacking simultaneously, so unrelated windows flipped into each other.
 *
 * Invariant: every open window has a distinct z-index, and the most recently
 * focused window has the highest one. Focus history is preserved for
 * non-focused windows, so only two windows ever change relative order — the
 * newly focused one and the previously focused one.
 */

export class FocusStack {
  private counter = 0;
  private readonly stack = new Map<string, number>();

  /** Register a window (idempotent). Returns its current z-index. */
  register(id: string): number {
    if (!this.stack.has(id)) {
      this.counter += 1;
      this.stack.set(id, this.counter);
    }
    return this.stack.get(id)!;
  }

  /** Unregister a closed window. */
  unregister(id: string): void {
    this.stack.delete(id);
  }

  /** Raise a window to the top. Returns its new z-index. */
  focus(id: string): number {
    this.counter += 1;
    this.stack.set(id, this.counter);
    return this.counter;
  }

  /** Current z-index for a window (0 if unknown). */
  z(id: string): number {
    return this.stack.get(id) ?? 0;
  }

  /** Snapshot of all tracked windows -> z-index. */
  all(): Record<string, number> {
    return Object.fromEntries(this.stack);
  }
}
