import { createPemupukanModel, loadPemupukanList, loadPemupukanDetail } from './model'

export function createPemupukanController() {
  const model = createPemupukanModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    fetchList: (filters = {}) => loadPemupukanList(filters),
    fetchDetail: (sensusId, detailId) => loadPemupukanDetail(sensusId, detailId)
  }
}

