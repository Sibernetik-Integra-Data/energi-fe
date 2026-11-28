// Pemeriksa terjemahan: kunci id/en per file sama, tidak ada kunci teratas ganda
// antar-file, dan setiap t('...') di kode ada di locales/id.
// Pakai: node scripts/check-i18n.mjs [folder-sumber ...]
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const ROOT = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const LOC = join(ROOT, 'i18n', 'locales')
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]))

let errors = 0
const fail = (msg) => { errors++; console.log(`  GAGAL  ${msg}`) }

const files = readdirSync(join(LOC, 'id')).filter((f) => f.endsWith('.json'))
const owner = new Map()
const idKeys = new Set()
for (const f of files) {
  const id = JSON.parse(readFileSync(join(LOC, 'id', f), 'utf8'))
  let en = {}
  try { en = JSON.parse(readFileSync(join(LOC, 'en', f), 'utf8')) } catch { fail(`en/${f} tidak ada`) }
  for (const top of Object.keys(id)) {
    if (owner.has(top)) fail(`kunci teratas "${top}" ganda: ${owner.get(top)} dan ${f}`)
    owner.set(top, f)
  }
  const a = flat(id), b = new Set(flat(en))
  a.forEach((k) => idKeys.add(k))
  const onlyId = a.filter((k) => !b.has(k)), onlyEn = [...b].filter((k) => !a.includes(k))
  if (onlyId.length) fail(`${f}: ${onlyId.length} kunci hanya di id, mis. ${onlyId.slice(0, 3).join(', ')}`)
  if (onlyEn.length) fail(`${f}: ${onlyEn.length} kunci hanya di en, mis. ${onlyEn.slice(0, 3).join(', ')}`)
  console.log(`  ok     ${f}: ${a.length} kunci`)
}

const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n)
  return statSync(p).isDirectory() ? walk(p) : /\.(vue|js)$/.test(n) ? [p] : []
})
// Folder boleh ditulis relatif ke src/ ("modules/x") atau ke energi-fe ("src/modules/x").
const dirs = process.argv.slice(2).length ? process.argv.slice(2).map((d) => join(ROOT, d.replace(/\\/g, '/').replace(/^\.?\/?src\//, ''))) : [ROOT]
for (const file of dirs.flatMap(walk)) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/\bt\(\s*['"`]([a-zA-Z][\w]*(?:\.[\w]+)+)['"`]/g)) {
    if (!idKeys.has(m[1])) fail(`${relative(ROOT, file)}: kunci "${m[1]}" tidak ada di locales/id`)
  }
}
console.log(errors ? `\n${errors} masalah.` : '\nSemua terjemahan konsisten.')
process.exit(errors ? 1 : 0)
