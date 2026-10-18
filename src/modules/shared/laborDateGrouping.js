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

function imageList(value) {
  return Array.isArray(value) ? value : []
}

function dateScopedGroup(grouped, date) {
  if (!grouped || typeof grouped !== 'object' || Array.isArray(grouped)) return {}
  const dateKeys = [
    date,
    date.replaceAll('-', '/'),
    date.replaceAll('-', ''),
  ]
  const containers = [grouped, grouped.byDate, grouped.by_date, grouped.dates]
  for (const container of containers) {
    if (!container || typeof container !== 'object' || Array.isArray(container)) continue
    for (const key of dateKeys) {
      const value = container[key]
      if (value && typeof value === 'object' && !Array.isArray(value)) return value
    }
  }
  return grouped
}

export function getLaborPointDates(labors = []) {
  return [...new Set(
    labors
      .map((labor) => getLaborPointDate(labor))
      .filter(Boolean),
  )].sort((a, b) => b.localeCompare(a))
}

export function laborForDate(labor, date) {
  const laborDate = getLaborPointDate(labor) || date
  const rawGrouped = labor?.laborImages && typeof labor.laborImages === 'object'
    ? labor.laborImages
    : {}
  const grouped = dateScopedGroup(rawGrouped, laborDate)
  const baseline = imageList(grouped.baseline).length
    ? grouped.baseline
    : imageList(grouped.before).length
      ? grouped.before
      : imageList(labor?.beforePhotos)
  const current = imageList(grouped.current).length
    ? grouped.current
    : imageList(grouped.after).length
      ? grouped.after
      : imageList(labor?.afterPhotos)
  // labor_images already belongs to this labor row. The API example can
  // contain a different date_plan, so point_date is the only display grouping key.
  const beforeImages = baseline
  const afterImages = current

  return {
    ...labor,
    laborImageDate: laborDate,
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
