/**
 * Build the lesson-content search index from the markdown pages.
 *
 * Reads content/page-1.md … page-9.md and emits src/data/searchLessons.json:
 * one record per page-top (anchor '') plus one record per `## ` section
 * (anchor `#s-<i>`, matching the sequential ids that renderMarkdown adds to
 * each <h2>). The SearchBar bundles this file, so lesson search stays in sync
 * with the content on every build (this script runs as an npm `prebuild` step).
 *
 * Pure Node + gray-matter (already a dependency) — safe to run on Vercel.
 * It never exits non-zero, so a parse hiccup can't break the deploy; the last
 * committed searchLessons.json simply stays in place.
 */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const ROOT = process.cwd()
const TOTAL_PAGES = 9
const OUT = path.join(ROOT, 'src', 'data', 'searchLessons.json')

// Strip markdown/HTML down to plain searchable text.
function clean(s) {
  return String(s)
    .replace(/<!--[\s\S]*?-->/g, ' ')          // html comments + content markers
    .replace(/<[^>]+>/g, ' ')                   // html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')      // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')    // links -> link text
    .replace(/^[\s>]*[-*]\s+\[[ xX]\]\s*/gm, '')// checkbox markers
    .replace(/^[\s>]*[-*+]\s+/gm, '')           // list bullets
    .replace(/[#*_`>|~]/g, ' ')                 // leftover md syntax
    .replace(/\\/g, ' ')                        // backslash artifacts
    .replace(/\s+/g, ' ')                       // collapse whitespace
    .trim()
}

// Keep headings human-readable (circled numbers, &, etc.) but drop md/html.
function cleanHeading(s) {
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function build() {
  const records = []
  for (let n = 1; n <= TOTAL_PAGES; n++) {
    const fp = path.join(ROOT, 'content', `page-${n}.md`)
    if (!fs.existsSync(fp)) continue
    const { content } = matter(fs.readFileSync(fp, 'utf8'))

    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? cleanHeading(titleMatch[1]) : `Page ${n}`

    // Everything before the first `## ` heading = page title + intro.
    const parts = content.split(/^##\s+/m)
    const intro = parts[0] || ''
    records.push({
      page: n,
      section: title,
      anchor: '',
      text: clean(`${title} ${intro}`).slice(0, 3000),
    })

    // Each `## ` section, numbered in document order to match the <h2> ids.
    for (let i = 1; i < parts.length; i++) {
      const seg = parts[i]
      const nl = seg.indexOf('\n')
      const headingRaw = nl === -1 ? seg : seg.slice(0, nl)
      const body = nl === -1 ? '' : seg.slice(nl + 1)
      const heading = cleanHeading(headingRaw)
      if (!heading) continue
      records.push({
        page: n,
        section: heading,
        anchor: `#s-${i - 1}`,
        text: clean(`${heading} ${body}`).slice(0, 3000),
      })
    }
  }
  return records
}

try {
  const records = build()
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(records))
  console.log(`[gen-search-lessons] wrote ${records.length} records -> ${path.relative(ROOT, OUT)}`)
} catch (e) {
  // Never fail the build over the search index; keep the committed copy.
  console.warn('[gen-search-lessons] skipped:', e && e.message)
}
process.exit(0)
