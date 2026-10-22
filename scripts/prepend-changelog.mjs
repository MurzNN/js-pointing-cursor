#!/usr/bin/env node
/**
 * Prepend a version section to CHANGELOG.md from commits since the previous v* tag.
 * Invoked by release-it: after:bump → node scripts/prepend-changelog.mjs ${version}
 *
 * Optional env:
 *   CHANGELOG_INTRO  — default intro paragraph(s) when creating CHANGELOG.md
 *   REPO_URL         — for compare links (else derived from git remote)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHANGELOG_PATH = join(root, 'CHANGELOG.md')
const version = process.argv[2]
const dryRun = process.argv.includes('--dry-run')

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error('Usage: node scripts/prepend-changelog.mjs <x.y.z> [--dry-run]')
  process.exit(1)
}

const tag = `v${version}`
const prevTag = previousVersionTag(tag)
const repoUrl = (process.env.REPO_URL || detectRepoUrl()).replace(/\/$/, '')
const date = todayISODate()
const commitBullets = listCommitBullets(prevTag, 'HEAD')
const notes = composeReleaseNotes({ commitBullets, prevTag, tag, repoUrl })

const current = existsSync(CHANGELOG_PATH)
  ? readFileSync(CHANGELOG_PATH, 'utf8')
  : defaultChangelog()

let rest = removeSection(current, 'Unreleased')
rest = removeSection(rest, escapeRegExp(version))

const introEnd = rest.search(/\n## \[/)
const intro =
  introEnd === -1
    ? `${rest.trimEnd()}\n`
    : `${rest.slice(0, introEnd).trimEnd()}\n`
const older = introEnd === -1 ? '' : rest.slice(introEnd).replace(/^\n+/, '')

const fileText = `${intro}
## [${version}] - ${date}

${notes}

${older}`
  .replace(/\n{3,}/g, '\n\n')
  .replace(/\n+$/, '\n')

if (dryRun) {
  console.log(`Would update ${CHANGELOG_PATH}\n\n---\n${fileText.slice(0, 800)}\n---`)
} else {
  writeFileSync(CHANGELOG_PATH, fileText)
  console.log(`Updated ${CHANGELOG_PATH} with [${version}] - ${date}`)
}

function defaultChangelog() {
  return (
    process.env.CHANGELOG_INTRO ||
    `# Changelog

Notable changes to the published adapter packages (and shared core).
Each release prepends a section from commits since the previous tag;
GitHub Releases use the same notes.

`
  )
}

function detectRepoUrl() {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: root,
      encoding: 'utf8',
    }).trim()
    if (url.startsWith('git@github.com:')) {
      return `https://github.com/${url.slice('git@github.com:'.length).replace(/\.git$/, '')}`
    }
    return url.replace(/\.git$/, '')
  } catch {
    return ''
  }
}

function gitCapture(argv) {
  return execFileSync('git', argv, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function previousVersionTag(tag) {
  const tags = gitCapture(['tag', '-l', 'v*', '--sort=-v:refname'])
    .split('\n')
    .filter(Boolean)
  const idx = tags.indexOf(tag)
  if (idx === -1) return tags[0] ?? null
  return tags[idx + 1] ?? null
}

function todayISODate() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function listCommitBullets(fromTag, toRef) {
  const range = fromTag ? `${fromTag}..${toRef}` : toRef
  let log = ''
  try {
    log = gitCapture([
      'log',
      range,
      '--pretty=format:%s (%h)',
      '--no-merges',
    ])
  } catch {
    log = ''
  }

  return log
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((line) => !/^chore: release v?\d+\.\d+\.\d+/i.test(line))
    .map((line) => `- ${line}`)
}

function composeReleaseNotes({ commitBullets, prevTag, tag, repoUrl }) {
  const parts = []
  if (commitBullets.length) {
    parts.push(`### Changes\n\n${commitBullets.join('\n')}`)
  } else {
    parts.push('No notable commits since the previous release.')
  }
  if (prevTag && tag && repoUrl) {
    parts.push(`**Full changelog**: ${repoUrl}/compare/${prevTag}...${tag}`)
  }
  return parts.join('\n\n')
}

function findSection(text, headingPattern) {
  const header = text.match(
    new RegExp(`^## \\[${headingPattern}\\][^\\n]*\\r?\\n`, 'm'),
  )
  if (!header || header.index == null) return null
  const start = header.index
  const bodyStart = start + header[0].length
  const after = text.slice(bodyStart)
  const nextRel = after.search(/\r?\n## \[/)
  const end = nextRel === -1 ? text.length : bodyStart + nextRel
  return { start, end }
}

function removeSection(text, headingPattern) {
  const sec = findSection(text, headingPattern)
  if (!sec) return text
  return `${text.slice(0, sec.start).replace(/\s+$/, '')}\n${text
    .slice(sec.end)
    .replace(/^\s+/, '')}`
}
