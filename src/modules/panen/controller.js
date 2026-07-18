import { createPanenModel, loadPanenList, loadPanenDetail } from './model'

export function createPanenController() {
  const model = createPanenModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    fetchList: (filters = {}) => loadPanenList(filters),
    fetchDetail: (sensusId, detailId) => loadPanenDetail(sensusId, detailId)
  }
}
