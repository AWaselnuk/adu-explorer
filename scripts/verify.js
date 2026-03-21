#!/usr/bin/env node
/**
 * Post-build verification script.
 * Run via: npm run verify
 *
 * Checks:
 *   1. dist/ folder exists
 *   2. dist/index.html exists and has content
 *   3. At least one JS bundle exists in dist/assets/
 *   4. No suspiciously empty JS bundles (< 10KB suggests broken build)
 *   5. index.html references the expected app root div
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..')
const DIST = join(ROOT, 'dist')

let passed = 0
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓  ${label}`)
    passed++
  } else {
    console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

console.log('\nVerifying build output...\n')

// 1. dist/ exists
check('dist/ directory exists', existsSync(DIST))

if (existsSync(DIST)) {
  const indexPath = join(DIST, 'index.html')
  const assetsPath = join(DIST, 'assets')

  // 2. index.html
  const indexExists = existsSync(indexPath)
  check('dist/index.html exists', indexExists)

  if (indexExists) {
    const html = readFileSync(indexPath, 'utf8')
    check(
      'index.html contains root div',
      html.includes('id="root"'),
      'missing <div id="root">'
    )
    check(
      'index.html references a JS bundle',
      html.includes('.js'),
      'no <script> tag with .js found'
    )
  }

  // 3. assets directory
  const assetsExist = existsSync(assetsPath)
  check('dist/assets/ directory exists', assetsExist)

  if (assetsExist) {
    const files = readdirSync(assetsPath)
    const jsBundles = files.filter((f) => f.endsWith('.js'))
    const cssBundles = files.filter((f) => f.endsWith('.css'))

    check('at least one JS bundle in dist/assets/', jsBundles.length > 0, `found: ${jsBundles.length}`)

    if (jsBundles.length > 0) {
      const mainBundle = jsBundles.reduce((largest, f) => {
        const size = statSync(join(assetsPath, f)).size
        return size > (largest.size || 0) ? { name: f, size } : largest
      }, {})
      const sizeKB = Math.round(mainBundle.size / 1024)
      check(
        `main bundle is a reasonable size (> 50KB, got ${sizeKB}KB)`,
        mainBundle.size > 50 * 1024,
        `bundle "${mainBundle.name}" is ${sizeKB}KB — may indicate a broken build`
      )
    }
  }
}

console.log(`\nResult: ${passed} passed, ${failed} failed\n`)

if (failed > 0) {
  console.error('Build verification FAILED. Fix the issues above before deploying.\n')
  process.exit(1)
} else {
  console.log('Build verification PASSED. Safe to deploy.\n')
}
