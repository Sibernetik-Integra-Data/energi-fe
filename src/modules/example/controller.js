import { createExampleModel } from './model'
import { apiFetch } from '../../api/fetch'

export function createExampleController() {
  const model = createExampleModel()

  async function load() {
    const data = await apiFetch('/api/example')
    model.setAll(data)
    return data
  }

  function getItems() {
    return model.getAll()
  }

  return { load, getItems }
}
