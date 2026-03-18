// Model: holds data and persistence helpers
export function createExampleModel() {
  let items = []

  return {
    getAll() {
      return items
    },
    setAll(newItems) {
      items = newItems
    }
  }
}
