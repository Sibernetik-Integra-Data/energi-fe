import { createPlanningModel, loadPlannings, loadSensusOptions, loadSensusDetails, loadAktifitasOptions, createPlanning, updatePlanning, deletePlanning } from './model'

export function createPlanningController() {
  const model = createPlanningModel()

  function getNavigation() {
    return model.getNavigation()
  }

  function getHeader() {
    return model.getHeader()
  }

  function getIntro() {
    return model.getIntro()
  }

  async function fetchPlannings(filters = {}) {
    return loadPlannings(filters)
  }

  async function fetchSensusOptions() {
    return loadSensusOptions()
  }

  async function fetchSensusDetails(idSensus) {
    return loadSensusDetails(idSensus)
  }

  async function fetchAktifitasOptions() {
    return loadAktifitasOptions()
  }

  async function savePlanning(payload) {
    return createPlanning(payload)
  }

  async function editPlanning(id, payload) {
    return updatePlanning(id, payload)
  }

  async function removePlanning(id) {
    return deletePlanning(id)
  }

  return {
    getNavigation,
    getHeader,
    getIntro,
    fetchPlannings,
    fetchSensusOptions,
    fetchSensusDetails,
    fetchAktifitasOptions,
    savePlanning,
    editPlanning,
    removePlanning
  }
}
