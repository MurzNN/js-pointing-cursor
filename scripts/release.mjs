#!/usr/bin/env node
/**
 * Release helper for npm packages.
 *
 *   pnpm release              # patch bump (0.1.2 → 0.1.3)
 *   pnpm release minor        # 0.1.2 → 0.2.0
 *   pnpm release major        # 0.1.2 → 1.0.0
 *   pnpm release 0.2.0        # exact version
 *   pnpm release --dry-run    # print actions, write nothing / no git
 *   pnpm release --no-push    # commit + tag locally only
 *   pnpm readme:packages      # regenerate package READMEs only
 *
 * Package READMEs are extracted from the root README.md using HTML comments:
 *
 *   Visible on GitHub (region markers):
 *     <!-- pkg:all --> … <!-- /pkg:all -->     → every package + monorepo
 *     <!-- pkg:omit --> … <!-- /pkg:omit -->   → monorepo only
 *
 *   Hidden on GitHub (whole block is one comment — body must not contain `-->`):
 *     <!-- pkg:vue
 *     …markdown…
 *     -->                                      → vue-pointing-cursor only
 *     <!-- pkg:react … -->                     → react-pointing-cursor only
 *     <!-- pkg:core … -->                      → js-pointing-cursor only
 *
 * Nested markers are allowed. Unmarked text is monorepo-only.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const PACKAGES = [
  {
    id: 'vue',
    name: 'vue-pointing-cursor',
    dir: 'packages/vue',
    title: 'vue-pointing-cursor',
    blurb:
      'Vue 3 oversized pointing cursor with curved motion, follow mode, and click burst.',
    homepage: 'https://murznn.github.io/js-pointing-cursor/vue/',
  },
  {
    id: 'react',
    name: 'react-pointing-cursor',
    dir: 'packages/react',
    title: 'react-pointing-cursor',
    blurb:
      'React oversized pointing cursor with curved motion, follow mode, and click burst.',
    homepage: 'https://murznn.github.io/js-pointing-cursor/react/',
  },
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const noPush = args.includes('--no-push')
const readmeOnly =
  args.includes('--readme-only') || process.env.README_ONLY === '1'
const bumpArg = args.find((a) => !a.startsWith('--')) ?? 'patch'

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/release.mjs [patch|minor|major|x.y.z] [--dry-run] [--no-push]
       node scripts/release.mjs --readme-only`)
  process.exit(0)
}

const rootReadmePath = join(root, 'README.md')
const rootReadme = readFileSync(rootReadmePath, 'utf8')

for (const pkg of PACKAGES) {
  const body = filterByMarkers(rootReadme, pkg.id)
  if (!body.trim()) {
    throw new Error(
      `No README content extracted for pkg:${pkg.id} — check <!-- pkg:* --> markers in README.md`,
    )
  }
  const readme = buildPackageReadme(pkg, body)
  const outPath = join(root, pkg.dir, 'README.md')
  if (dryRun) {
    console.log(`\n--- ${outPath} (${readme.length} chars) ---`)
    console.log(`${readme.slice(0, 500)}${readme.length > 500 ? '\n…\n' : ''}`)
  } else {
    writeFileSync(outPath, `${readme}\n`)
    console.log(`Wrote ${outPath}`)
  }
}

if (readmeOnly) {
  process.exit(0)
}

const versions = Object.fromEntries(
  PACKAGES.map((pkg) => {
    const pkgJson = JSON.parse(
      readFileSync(join(root, pkg.dir, 'package.json'), 'utf8'),
    )
    return [pkg.name, pkgJson.version]
  }),
)

const current = versions[PACKAGES[0].name]
for (const v of Object.values(versions)) {
  if (v !== current) {
    throw new Error(
      `Package versions diverge (${JSON.stringify(versions)}); align them before releasing.`,
    )
  }
}

const next = bumpVersion(current, bumpArg)
console.log(`Version ${current} → ${next}`)

for (const pkg of PACKAGES) {
  const pkgJsonPath = join(root, pkg.dir, 'package.json')
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
  pkgJson.version = next
  if (dryRun) {
    console.log(`Would bump ${pkg.dir}/package.json → ${next}`)
  } else {
    writeFileSync(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`)
  }
}

const tag = `v${next}`
const files = [
  'README.md',
  ...PACKAGES.flatMap((pkg) => [
    `${pkg.dir}/package.json`,
    `${pkg.dir}/README.md`,
  ]),
]

if (dryRun) {
  console.log(`Would: git add ${files.join(' ')}`)
  console.log(`Would: git commit -m "chore: release ${tag}"`)
  console.log(`Would: git tag ${tag}`)
  if (!noPush) console.log(`Would: git push origin HEAD ${tag}`)
  process.exit(0)
}

assertCleanEnoughForRelease()

git(['add', ...files])
git([
  'commit',
  '-m',
  `chore: release ${tag}\n\nBump vue/react packages and refresh npm package READMEs.`,
])
git(['tag', tag])

if (noPush) {
  console.log(
    `Created ${tag} locally (not pushed). Run: git push origin HEAD ${tag}`,
  )
} else {
  git(['push', 'origin', 'HEAD', tag])
  console.log(`Pushed ${tag} — publish workflow should start on GitHub Actions.`)
}

function buildPackageReadme(pkg, body) {
  const header = `# ${pkg.title}

${pkg.blurb}

Repository: [github.com/MurzNN/js-pointing-cursor](https://github.com/MurzNN/js-pointing-cursor) · Demo: [${pkg.homepage}](${pkg.homepage})
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
  // Region markers (visible) OR hidden package-only comment blocks.
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
      // Region marker: pkg:all | pkg:omit
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

    // Hidden package-only block
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

function bumpVersion(current, spec) {
  if (/^\d+\.\d+\.\d+$/.test(spec)) return spec
  const parts = current.split('.').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid current version: ${current}`)
  }
  let [major, minor, patch] = parts
  if (spec === 'major') {
    major += 1
    minor = 0
    patch = 0
  } else if (spec === 'minor') {
    minor += 1
    patch = 0
  } else if (spec === 'patch') {
    patch += 1
  } else {
    throw new Error(`Unknown bump "${spec}" (use patch|minor|major|x.y.z)`)
  }
  return `${major}.${minor}.${patch}`
}

function git(argv) {
  execFileSync('git', argv, { cwd: root, stdio: 'inherit' })
}

function assertCleanEnoughForRelease() {
  const status = execFileSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  })
  const unexpected = status
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .filter((line) => {
      const path = line.slice(3).trim().replace(/^.* -> /, '')
      return (
        !PACKAGES.some(
          (pkg) =>
            path === `${pkg.dir}/package.json` ||
            path === `${pkg.dir}/README.md`,
        ) && path !== 'README.md'
      )
    })
  if (unexpected.length) {
    throw new Error(
      `Working tree has unrelated changes; commit or stash first:\n${unexpected.join('\n')}`,
    )
  }
}
