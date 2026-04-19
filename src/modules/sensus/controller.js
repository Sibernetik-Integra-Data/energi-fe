import { createSensusModel } from './model'

export function createSensusController() {
  const model = createSensusModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getList: () => model.getList(),
    getStats: () => model.getStats(),
    loadRows: () => model.loadRows()
  }
}
