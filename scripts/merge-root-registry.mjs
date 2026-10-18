#!/usr/bin/env node
/**
 * GitHub installs (`owner/repo/item`) require registry.json at the repo root.
 * Nested catalogs under registry/{vue,react}/ stay the editable sources;
 * this script merges them into the root file the CLIs fetch.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vue = JSON.parse(readFileSync(join(root, 'registry/vue/registry.json'), 'utf8'))
const react = JSON.parse(readFileSync(join(root, 'registry/react/registry.json'), 'utf8'))

const names = new Set()
for (const item of [...vue.items, ...react.items]) {
  if (names.has(item.name)) {
    throw new Error(`Duplicate registry item name: ${item.name}`)
  }
  names.add(item.name)
}

const merged = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'js-pointing-cursor',
  homepage: vue.homepage || react.homepage,
  items: [...vue.items, ...react.items],
}

const out = join(root, 'registry.json')
writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`)
console.log(`Wrote ${out} (${merged.items.length} items)`)
