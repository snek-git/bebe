/**
 * Hide pool members beyond the active count.
 * Call after syncing pool entries from game state each frame.
 */
export function syncPool<T extends { setVisible(v: boolean): T }>(
  pool: T[],
  activeCount: number,
): void {
  for (let i = activeCount; i < pool.length; i++) {
    pool[i].setVisible(false);
  }
}
