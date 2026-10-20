import {
  buildWorkerPerformanceRows,
  filterWorkerPerformanceRows,
  loadPerformanceOverviewData,
  loadWorkerPerformance
} from './model'

export function createPerformanceOverviewController() {
  return {
    fetchOverview: loadPerformanceOverviewData,
    fetchWorkerPerformance: loadWorkerPerformance,
    buildWorkerRows: buildWorkerPerformanceRows,
    filterWorkerRows: filterWorkerPerformanceRows
  }
}
