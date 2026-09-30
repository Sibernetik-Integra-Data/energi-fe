function normalizeDate(value) {
  if (!value) return ''
  const direct = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return direct ? `${direct[1]}-${direct[2]}-${direct[3]}` : ''
}

function imageUri(image) {
  return typeof image === 'string' ? image : image?.image_uri || image?.uri || ''
}

export function getLaborPointDate(labor) {
  return normalizeDate(labor?.pointDate || labor?.point_date || labor?.workDate || labor?.work_date)
}

function imageMatchesDate(image, date) {
  const imageDate = normalizeDate(image?.date_plan)
  if (!date) return false
  // An image without date_plan is already scoped to its labor row. Keep it
  // visible instead of dropping it when the labor is grouped by point_date.
  return !imageDate || imageDate === date
}

function imageList(value) {
  return Array.isArray(value) ? value : []
}

export function getLaborPointDates(labors = []) {
  return [...new Set(
    labors
      .map((labor) => getLaborPointDate(labor))
      .filter(Boolean),
  )].sort((a, b) => b.localeCompare(a))
}

export function laborForDate(labor, date) {
  const grouped = labor?.laborImages && typeof labor.laborImages === 'object'
    ? labor.laborImages
    : {}
  const baseline = imageList(grouped.baseline).length
    ? grouped.baseline
    : imageList(grouped.before)
  const current = imageList(grouped.current).length
    ? grouped.current
    : imageList(grouped.after)
  const beforeImages = baseline.filter((image) => imageMatchesDate(image, date))
  const afterImages = current.filter((image) => imageMatchesDate(image, date))

  return {
    ...labor,
    laborImageDate: date,
    laborImages: { ...grouped, baseline: beforeImages, current: afterImages },
    beforePhotos: beforeImages.map(imageUri).filter(Boolean),
    afterPhotos: afterImages.map(imageUri).filter(Boolean)
  }
}

export function buildLaborDateRange(start, end) {
  const first = normalizeDate(start)
  const last = normalizeDate(end || start)
  const dates = []

  if (first && last) {
    const cursor = new Date(`${first}T00:00:00`)
    const finish = new Date(`${last}T00:00:00`)
    if (!Number.isNaN(cursor.getTime()) && !Number.isNaN(finish.getTime()) && cursor <= finish) {
      while (cursor <= finish) {
        const year = cursor.getFullYear()
        const month = String(cursor.getMonth() + 1).padStart(2, '0')
        const day = String(cursor.getDate()).padStart(2, '0')
        dates.push(`${year}-${month}-${day}`)
        cursor.setDate(cursor.getDate() + 1)
      }
    }
  }

  return [...new Set(dates)].sort()
}

export function formatLaborDateLabel(value) {
  const date = normalizeDate(value)
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[1]} - ${match[2]} - ${match[3]}` : (value || 'Tanggal belum ditentukan')
}
