import { createDashboardModel } from './model'

export function createDashboardController() {
  const model = createDashboardModel()

  function getNavigation() {
    return model.getNavigation()
  }

  function getHeader() {
    return model.getHeader()
  }

  function getIntro() {
    return model.getIntro()
  }

  function getPendingVerification() {
    return model.getPendingVerification()
  }

  function getRecentVerified() {
    return model.getRecentVerified()
  }

  function getMetrics() {
    return model.getMetrics()
  }

  return {
    getNavigation,
    getHeader,
    getIntro,
    getPendingVerification,
    getRecentVerified,
    getMetrics,
  }
}