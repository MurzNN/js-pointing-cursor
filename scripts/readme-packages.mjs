#!/usr/bin/env node
/**
 * Generate packages/{vue,react}/README.md from root README.md markers.
 *
 * Config: readme-packages.config.mjs (or .json) in the repo root.
 *
 *   Visible on GitHub (region markers):
 *     <!-- pkg:all --> … <!-- /pkg:all -->     → every package + monorepo
 *     <!-- pkg:omit --> … <!-- /pkg:omit -->   → monorepo only
 *
 *   Hidden on GitHub (whole block is one comment — body must not contain `-->`):
 *     <!-- pkg:vue
 *     …markdown…
 *     -->                                      → vue adapter only
 *     <!-- pkg:react … -->                     → react adapter only
 *     <!-- pkg:core … -->                      → core package only
 *
 * Nested markers are allowed. Unmarked text is monorepo-only.
 *
 * Usage:
 *   node scripts/readme-packages.mjs
 *   node scripts/readme-packages.mjs --dry-run
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = findRepoRoot(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/readme-packages.mjs [--dry-run]
Config: readme-packages.config.mjs (or .json) at the repo root.`)
  process.exit(0)
}

const config = await loadConfig(root)
const rootReadmePath = join(root, config.readme ?? 'README.md')
const rootReadme = readFileSync(rootReadmePath, 'utf8')
  const repoUrl = config.repoUrl.replace(/\/$/, '')
  const repoLabel = repoUrl.replace(/^https?:\/\//, '')

  for (const pkg of config.packages) {
    const body = filterByMarkers(rootReadme, pkg.id)
    if (!body.trim()) {
      throw new Error(
        `No README content extracted for pkg:${pkg.id} — check <!-- pkg:* --> markers in ${config.readme ?? 'README.md'}`,
      )
    }
    const readme = buildPackageReadme(pkg, body, { repoUrl, repoLabel })
  const outPath = join(root, pkg.dir, 'README.md')
  if (dryRun) {
    console.log(`\n--- ${outPath} (${readme.length} chars) ---`)
    console.log(`${readme.slice(0, 500)}${readme.length > 500 ? '\n…\n' : ''}`)
  } else {
    writeFileSync(outPath, `${readme}\n`)
    console.log(`Wrote ${outPath}`)
  }
}

function findRepoRoot(startDir) {
  let dir = startDir
  for (;;) {
    if (
      existsSync(join(dir, 'readme-packages.config.mjs')) ||
      existsSync(join(dir, 'readme-packages.config.json')) ||
      existsSync(join(dir, 'pnpm-workspace.yaml'))
    ) {
      return dir
    }
    const parent = dirname(dir)
    if (parent === dir) {
      // scripts/ lives one level under root when vendored as scripts/readme-packages.mjs
      return startDir.endsWith('scripts') ? dirname(startDir) : startDir
    }
    dir = parent
  }
}

async function loadConfig(repoRoot) {
  const mjs = join(repoRoot, 'readme-packages.config.mjs')
  const json = join(repoRoot, 'readme-packages.config.json')
  if (existsSync(mjs)) {
    const mod = await import(pathToFileURL(mjs).href)
    return normalizeConfig(mod.default ?? mod)
  }
  if (existsSync(json)) {
    return normalizeConfig(JSON.parse(readFileSync(json, 'utf8')))
  }
  throw new Error(
    `Missing readme-packages.config.mjs (or .json) in ${repoRoot}`,
  )
}

function normalizeConfig(cfg) {
  if (!cfg?.repoUrl || !Array.isArray(cfg.packages) || !cfg.packages.length) {
    throw new Error(
      'readme-packages config needs { repoUrl, packages: [{ id, dir, title, blurb, homepage }] }',
    )
  }
  return cfg
}

function buildPackageReadme(pkg, body, { repoUrl, repoLabel }) {
  const header = `# ${pkg.title}

${pkg.blurb}

Repository: [${repoLabel}](${repoUrl}) · Demo: [${pkg.homepage}](${pkg.homepage})
`
  const footer = `
## License

MIT
`
  return `${header}\n${body.trim()}\n${footer}`
}

/**
 * Extract package README body from root README markers.
 *
 * - `pkg:all` regions → shared visible content
 * - `pkg:omit` regions → monorepo only (skipped)
 * - `<!-- pkg:vue|react|core … -->` hidden blocks → matching package only
 * - Unmarked text → monorepo only
 */
function filterByMarkers(source, pkgId) {
  const tokenRe =
    /<!--\s*(\/?)pkg:(all|omit)\s*-->|<!--\s*pkg:(vue|react|core)\b([\s\S]*?)-->/g

  let out = ''
  let last = 0
  /** @type {Array<'all' | 'omit'>} */
  const stack = []

  const includeShared = () =>
    stack.length > 0 && !stack.includes('omit') && stack.every((t) => t === 'all')

  for (const m of source.matchAll(tokenRe)) {
    const idx = m.index ?? 0

    if (includeShared()) {
      out += source.slice(last, idx)
    }
    last = idx + m[0].length

    if (m[2] != null) {
      const isClose = m[1] === '/'
      const type = /** @type {'all' | 'omit'} */ (m[2])
      if (!isClose) {
        stack.push(type)
      } else {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i] === type) {
            stack.splice(i, 1)
            break
          }
        }
      }
      continue
    }

    const blockPkg = m[3]
    const body = m[4] ?? ''
    if (blockPkg === pkgId && !stack.includes('omit')) {
      out += body
    }
  }

  if (stack.length) {
    throw new Error(`Unclosed pkg marker(s): ${stack.join(', ')}`)
  }

  if (includeShared()) {
    out += source.slice(last)
  }

  return out.replace(/\n{3,}/g, '\n\n').trim()
}
