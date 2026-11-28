import {
  createPengirimanPenerimaanModel,
  loadPengirimanPenerimaanList,
  loadPengirimanPenerimaanDetail,
  loadUnits,
  receiveTrip,
  cancelReceipt,
  getHarvestTypes,
  getStatusFilters
} from './model'

export function createPengirimanPenerimaanController() {
  const model = createPengirimanPenerimaanModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    getHarvestTypes: () => getHarvestTypes(),
    getStatusFilters: () => getStatusFilters(),
    fetchList: (filters = {}) => loadPengirimanPenerimaanList(filters),
    fetchDetail: (tripId) => loadPengirimanPenerimaanDetail(tripId),
    fetchUnits: () => loadUnits(),
    receive: (payload) => receiveTrip(payload),
    cancel: (receiptId, reason) => cancelReceipt(receiptId, reason)
  }
}
