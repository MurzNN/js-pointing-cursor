import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const out = join(root, 'playground-dist')
const vueSrc = join(out, 'vue')

mkdirSync(out, { recursive: true })

writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>js-pointing-cursor</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; }
      a { color: #0b57d0; }
      li { margin: 0.75rem 0; }
    </style>
  </head>
  <body>
    <h1>js-pointing-cursor</h1>
    <p>Framework-agnostic oversized cursor with Vue and React adapters.</p>
    <ul>
      <li><a href="./vue/">Vue demo</a> — <code>vue-pointing-cursor</code></li>
      <li><a href="./react/">React demo</a> — <code>react-pointing-cursor</code></li>
    </ul>
  </body>
</html>
`,
)

if (existsSync(join(vueSrc, 'r'))) {
  mkdirSync(join(out, 'r'), { recursive: true })
  cpSync(join(vueSrc, 'r'), join(out, 'r'), { recursive: true })
}

process.stdout.write('Assembled Pages site at playground-dist/\n')
