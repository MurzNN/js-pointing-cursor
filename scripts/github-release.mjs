#!/usr/bin/env node
/**
 * Create a GitHub Release for the current tag using notes from CHANGELOG.md.
 * Idempotent if the release already exists.
 *
 *   node scripts/github-release.mjs
 *   node scripts/github-release.mjs --dry-run
 *
 * Env: GITHUB_REF_NAME or RELEASE_TAG (vX.Y.Z); GH_TOKEN / GITHUB_TOKEN on CI.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHANGELOG_PATH = join(root, 'CHANGELOG.md')
const dryRun = process.argv.includes('--dry-run')

const tag =
  process.env.GITHUB_REF_NAME ||
  process.env.RELEASE_TAG ||
  latestVersionTag()

if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  throw new Error(
    `Need a vX.Y.Z tag (got ${JSON.stringify(tag)}). Set GITHUB_REF_NAME or RELEASE_TAG.`,
  )
}

const version = tag.slice(1)
const fromFile = extractChangelogSection(version)
const notes =
  fromFile ||
  `Release ${tag}\n\n(No CHANGELOG.md section found for ${version}.)`

console.log(
  `GitHub Release ${tag} (notes from ${fromFile ? 'CHANGELOG.md' : 'fallback'})`,
)

if (dryRun) {
  console.log(`\n---\n${notes}\n---`)
  console.log(`Would: gh release create ${tag}`)
  process.exit(0)
}

ensureGitHubRelease(tag, notes)

function latestVersionTag() {
  try {
    return execFileSync(
      'git',
      ['describe', '--tags', '--abbrev=0', '--match', 'v*'],
      { cwd: root, encoding: 'utf8' },
    ).trim()
  } catch {
    return null
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractChangelogSection(version) {
  if (!existsSync(CHANGELOG_PATH)) return null
  const text = readFileSync(CHANGELOG_PATH, 'utf8')
  const header = text.match(
    new RegExp(`^## \\[${escapeRegExp(version)}\\][^\\n]*\\r?\\n`, 'm'),
  )
  if (!header || header.index == null) return null
  const bodyStart = header.index + header[0].length
  const after = text.slice(bodyStart)
  const nextRel = after.search(/\r?\n## \[/)
  const end = nextRel === -1 ? text.length : bodyStart + nextRel
  return text
    .slice(bodyStart, end)
    .replace(/^\r?\n+/, '')
    .replace(/\s+$/, '')
}

function commandExists(name) {
  try {
    execFileSync('sh', ['-c', `command -v ${name}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function ensureGitHubRelease(releaseTag, releaseNotes) {
  const strict = Boolean(process.env.GITHUB_ACTIONS)

  if (!commandExists('gh')) {
    if (strict) throw new Error('gh CLI not found (required on CI)')
    console.warn('gh CLI not found — skip GitHub Release locally.')
    return
  }

  try {
    execFileSync('gh', ['release', 'view', releaseTag], {
      cwd: root,
      stdio: 'ignore',
    })
    console.log(`GitHub Release ${releaseTag} already exists — leaving notes unchanged.`)
    return
  } catch {
    // Does not exist yet.
  }

  try {
    execFileSync(
      'gh',
      ['release', 'create', releaseTag, '--title', releaseTag, '--notes-file', '-'],
      {
        cwd: root,
        input: releaseNotes,
        stdio: ['pipe', 'inherit', 'inherit'],
      },
    )
    console.log(`Created GitHub Release ${releaseTag}`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    if (strict) {
      throw new Error(`Could not create GitHub Release ${releaseTag}: ${detail}`)
    }
    console.warn(`Could not create GitHub Release ${releaseTag}: ${detail}`)
  }
}
