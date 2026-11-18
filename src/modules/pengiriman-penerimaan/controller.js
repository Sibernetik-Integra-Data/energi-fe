import {
  createPengirimanPenerimaanModel,
  loadPengirimanPenerimaanList,
  loadPengirimanPenerimaanDetail,
  loadUnits,
  receiveTrip,
  cancelReceipt,
  HARVEST_TYPES,
  STATUS_FILTERS
} from './model'

export function createPengirimanPenerimaanController() {
  const model = createPengirimanPenerimaanModel()

  return {
    getNavigation: () => model.getNavigation(),
    getHeader: () => model.getHeader(),
    getIntro: () => model.getIntro(),
    getHarvestTypes: () => HARVEST_TYPES,
    getStatusFilters: () => STATUS_FILTERS,
    fetchList: (filters = {}) => loadPengirimanPenerimaanList(filters),
    fetchDetail: (tripId) => loadPengirimanPenerimaanDetail(tripId),
    fetchUnits: () => loadUnits(),
    receive: (payload) => receiveTrip(payload),
    cancel: (receiptId, reason) => cancelReceipt(receiptId, reason)
  }
}
