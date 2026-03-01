export function sampleItems(items, limit) {
  if (!Array.isArray(items) || limit <= 0) {
    return [];
  }

  if (items.length <= limit) {
    return [...items];
  }

  const selectedIndexes = new Set();

  while (selectedIndexes.size < limit) {
    selectedIndexes.add(Math.floor(Math.random() * items.length));
  }

  return Array.from(selectedIndexes, (index) => items[index]);
}
