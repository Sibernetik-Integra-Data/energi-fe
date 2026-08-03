import { createSensusModel } from './model'

export function createSensusController() {
  const model = createSensusModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getList: () => model.getList(),
    getStats: () => model.getStats(),
    loadRows: () => model.loadRows(),
    loadSensusDetail: (numericId) => model.loadSensusDetail(numericId),
    loadSensusRecord: (numericId) => model.loadSensusRecord(numericId),
    loadSensusTaskDetail: (sensusId, detailId) => model.loadSensusTaskDetail(sensusId, detailId),
    loadSensusPlanning: (idSensus) => model.loadSensusPlanning(idSensus),
    saveSensusPlanning: (payload) => model.saveSensusPlanning(payload)
  }
}
