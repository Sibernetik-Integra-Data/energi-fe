import { createPlanningModel } from './model'

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

  function getPlannings() {
    return model.getPlannings()
  }

  function getSensusOptions() {
    return model.getSensusOptions()
  }

  function getBlockOptions() {
    return model.getBlockOptions()
  }

  function getAktifitasOptions() {
    return model.getAktifitasOptions()
  }

  return {
    getNavigation,
    getHeader,
    getIntro,
    getPlannings,
    getSensusOptions,
    getBlockOptions,
    getAktifitasOptions
  }
}
