import { createPengirimanPenerimaanModel, loadPengirimanPenerimaanList, loadPengirimanPenerimaanDetail } from './model'

export function createPengirimanPenerimaanController() {
  const model = createPengirimanPenerimaanModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    fetchList: (filters = {}) => loadPengirimanPenerimaanList(filters),
    fetchDetail: (sensusId, detailId) => loadPengirimanPenerimaanDetail(sensusId, detailId)
  }
}
