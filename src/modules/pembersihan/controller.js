import { createPembersihanModel, loadPembersihanList, loadPembersihanDetail } from './model'

export function createPembersihanController() {
  const model = createPembersihanModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    fetchList: (filters = {}) => loadPembersihanList(filters),
    fetchDetail: (sensusId, detailId) => loadPembersihanDetail(sensusId, detailId)
  }
}
