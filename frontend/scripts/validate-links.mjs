#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'

const baseUrl = normalizeBaseUrl(process.argv[2] || process.env.LINK_CHECK_BASE_URL || 'http://localhost:3000')
const maxPages = Number(process.env.LINK_CHECK_MAX_PAGES || 500)
const reportPath = new URL('../link-validation-report.md', import.meta.url)

const ignoredSchemes = ['mailto:', 'tel:', 'sms:', 'javascript:', 'whatsapp:']
const ignoredPrefixes = [
  '/_next/',
  '/api/',
  '/admin',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
]
const ignoredExtensions = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|woff2?|ttf|pdf|zip)$/i
const seedPaths = [
  '/',
  '/products',
  '/services',
  '/industries',
  '/blog',
  '/about',
  '/contact',
  '/faqs',
  '/privacy',
  '/terms',
  '/sitemap.xml',
  '/services/bulk-logistics',
  '/services/custom-formulations',
  '/services/onsite-audits',
  '/services/technical-support',
  '/services/water-treatment',
  '/services/industrial-cleaning',
  '/services/laboratory-solutions',
  '/services/safety-products',
  '/services/chemical-supply',
  '/industries/manufacturing',
  '/industries/food-processing',
  '/industries/water-treatment',
  '/industries/agriculture',
  '/industries/hospitality',
  '/industries/healthcare',
  '/industries/construction',
  '/industries/pharmaceuticals',
  '/industries/paints-coatings',
]

const queue = [...seedPaths.map(path => toInternalUrl(path))]
const seen = new Set()
const results = []

while (queue.length > 0 && seen.size < maxPages) {
  const url = queue.shift()
  if (!url || seen.has(url)) continue
  seen.add(url)

  const result = await checkUrl(url)
  results.push(result)

  if (result.status >= 200 && result.status < 300 && result.contentType.includes('text/html') && result.body) {
    for (const href of extractHrefs(result.body)) {
      const nextUrl = normalizeHref(href, result.finalUrl || url)
      if (nextUrl && !seen.has(nextUrl) && !queue.includes(nextUrl)) {
        queue.push(nextUrl)
      }
    }
  }
}

const broken = results.filter(result => result.issue)
await writeReport({ baseUrl, results, broken, scannedAt: new Date().toISOString() })

console.log(`Scanned ${results.length} internal route(s) from ${baseUrl}`)
console.log(`Broken route(s): ${broken.length}`)
console.log(`Report: ${fileURLToPathLabel(reportPath)}`)

if (broken.length > 0) {
  process.exitCode = 1
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '')
}

function toInternalUrl(path) {
  return new URL(path, `${baseUrl}/`).toString()
}

function normalizeHref(rawHref, currentUrl) {
  if (!rawHref) return null

  const href = decodeHtml(rawHref.trim())
  if (!href || href.startsWith('#') || ignoredSchemes.some(scheme => href.toLowerCase().startsWith(scheme))) {
    return null
  }

  let url
  try {
    url = new URL(href, currentUrl)
  } catch {
    return null
  }

  if (url.origin !== new URL(baseUrl).origin) {
    return null
  }

  url.hash = ''
  if (ignoredPrefixes.some(prefix => url.pathname.startsWith(prefix)) || ignoredExtensions.test(url.pathname)) {
    return null
  }

  return url.toString()
}

async function checkUrl(url, redirects = 0) {
  try {
    const response = await fetch(url, { redirect: 'manual' })
    const status = response.status
    const contentType = response.headers.get('content-type') || ''

    if (status >= 300 && status < 400) {
      const location = response.headers.get('location')
      const nextUrl = location ? normalizeHref(location, url) : null

      if (!nextUrl) {
        return routeResult(url, status, contentType, '', 'Redirect without a valid internal destination', 'Point this link to a concrete page or action.')
      }

      if (redirects >= 10 || nextUrl === url) {
        return routeResult(url, status, contentType, '', 'Redirect loop', 'Fix the redirect target so it resolves to a final route.')
      }

      return checkUrl(nextUrl, redirects + 1)
    }

    const body = await response.text()
    const issue = classifyIssue(status, contentType, body)
    return routeResult(url, status, contentType, body, issue, recommendationFor(issue))
  } catch (error) {
    return routeResult(url, 0, '', '', error instanceof Error ? error.message : 'Request failed', 'Confirm the dev server is running and the route can be reached.')
  }
}

function classifyIssue(status, contentType, body) {
  if (status === 404) return '404 Not Found'
  if (status >= 500) return `${status} Server Error`
  if (status >= 400) return `${status} Client Error`

  if (contentType.includes('text/html')) {
    const text = body
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (/This page could not be found|404|Not Found/i.test(text.slice(0, 500))) {
      return 'Rendered Not Found page'
    }

    if (text.length < 40) {
      return 'Empty route'
    }
  }

  return ''
}

function recommendationFor(issue) {
  if (!issue) return ''
  if (issue.includes('404') || issue.includes('Not Found')) return 'Create the route, fix the href, or redirect to related content.'
  if (issue.includes('Server Error')) return 'Inspect the page render error and backend/API dependency for this route.'
  if (issue.includes('Empty route')) return 'Add meaningful content, related links, and a contact path.'
  return 'Review this link and replace it with a valid destination or action.'
}

function routeResult(url, status, contentType, body, issue, recommendedFix) {
  return {
    route: pathLabel(url),
    status,
    issue,
    recommendedFix,
    contentType,
    body,
    finalUrl: url,
  }
}

function extractHrefs(html) {
  const hrefs = []
  const hrefPattern = /\s(?:href|src)=["']([^"']+)["']/gi
  let match
  while ((match = hrefPattern.exec(html))) {
    hrefs.push(match[1])
  }
  return hrefs
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
}

function pathLabel(url) {
  const parsed = new URL(url)
  return `${parsed.pathname}${parsed.search}`
}

async function writeReport({ baseUrl, results, broken, scannedAt }) {
  const rows = (broken.length > 0 ? broken : results).map(result => (
    `| ${escapeCell(result.route)} | ${result.status || 'ERR'} | ${escapeCell(result.issue || 'OK')} | ${escapeCell(result.recommendedFix || 'No action required.')} |`
  ))

  const body = [
    '# Link Validation Report',
    '',
    `Base URL: ${baseUrl}`,
    `Scanned at: ${scannedAt}`,
    `Routes scanned: ${results.length}`,
    `Broken routes: ${broken.length}`,
    '',
    '| Route | Status | Issue | Recommended Fix |',
    '| --- | ---: | --- | --- |',
    ...rows,
    '',
  ].join('\n')

  await writeFile(reportPath, body)
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function fileURLToPathLabel(url) {
  return url.pathname
}
