import { createDashboardModel } from './model'

export function createDashboardController() {
  const model = createDashboardModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    loadSensus: () => model.loadSensus(),
    loadPlannings: () => model.loadPlannings(),
    loadShipments: () => model.loadShipments()
  }
}
