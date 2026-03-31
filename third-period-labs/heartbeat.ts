/**
 * Third Period Labs - Virginia Education Policy Heartbeat
 *
 * Monitors key sources for education policy updates in Virginia.
 * Run daily via cron or scheduler.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SOURCES = {
  vdoe: {
    name: 'Virginia Department of Education',
    url: 'https://www.doe.virginia.gov',
    rss: null, // No RSS, will need scraping
    keywords: ['announcement', 'guidance', 'policy', 'assessment', 'standards']
  },
  governor: {
    name: "Governor's Office",
    url: 'https://www.governor.virginia.gov/newsroom/',
    rss: null,
    keywords: ['education', 'schools', 'students', 'teachers', 'literacy']
  },
  vea: {
    name: 'Virginia Education Association',
    url: 'https://www.veanea.org',
    rss: null,
    keywords: ['budget', 'funding', 'teachers', 'legislation', 'advocacy']
  },
  virginiaMercury: {
    name: 'Virginia Mercury - Education',
    url: 'https://virginiamercury.com/category/education/',
    rss: 'https://virginiamercury.com/category/education/feed/',
    keywords: ['education', 'schools', 'K-12', 'budget']
  },
  generalAssembly: {
    name: 'Virginia General Assembly',
    url: 'https://lis.virginia.gov/',
    rss: null,
    keywords: ['education', 'schools', 'HB', 'SB']
  }
}

const ALERTS_FILE = join(__dirname, 'alerts.json')
const TRACKER_FILE = join(__dirname, 'va-education-tracker.md')

interface Alert {
  source: string
  title: string
  url: string
  date: string
  keywords: string[]
  reviewed: boolean
}

async function checkSource(sourceKey: string, source: typeof SOURCES[keyof typeof SOURCES]): Promise<Alert[]> {
  const alerts: Alert[] = []

  // For sources with RSS
  if (source.rss) {
    try {
      const response = await fetch(source.rss)
      const text = await response.text()
      // Basic RSS parsing - would use proper parser in production
      const items = text.match(/<item>[\s\S]*?<\/item>/g) || []

      for (const item of items.slice(0, 10)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                     item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

        const matchedKeywords = source.keywords.filter(kw =>
          title.toLowerCase().includes(kw.toLowerCase())
        )

        if (matchedKeywords.length > 0) {
          alerts.push({
            source: source.name,
            title,
            url: link,
            date: pubDate,
            keywords: matchedKeywords,
            reviewed: false
          })
        }
      }
    } catch (e) {
      console.error(`Error fetching ${source.name}:`, e)
    }
  }

  return alerts
}

async function runHeartbeat(): Promise<void> {
  console.log('Third Period Labs - Education Policy Heartbeat')
  console.log('='.repeat(50))
  console.log(`Running at: ${new Date().toISOString()}`)
  console.log('')

  // Load existing alerts
  let existingAlerts: Alert[] = []
  if (existsSync(ALERTS_FILE)) {
    existingAlerts = JSON.parse(readFileSync(ALERTS_FILE, 'utf-8'))
  }

  const existingUrls = new Set(existingAlerts.map(a => a.url))
  const newAlerts: Alert[] = []

  for (const [key, source] of Object.entries(SOURCES)) {
    console.log(`Checking: ${source.name}...`)
    const alerts = await checkSource(key, source)

    for (const alert of alerts) {
      if (!existingUrls.has(alert.url)) {
        newAlerts.push(alert)
        console.log(`  NEW: ${alert.title}`)
      }
    }
  }

  if (newAlerts.length > 0) {
    // Save updated alerts
    const allAlerts = [...newAlerts, ...existingAlerts].slice(0, 100) // Keep last 100
    writeFileSync(ALERTS_FILE, JSON.stringify(allAlerts, null, 2))

    console.log('')
    console.log(`Found ${newAlerts.length} new education policy updates!`)

    // Generate summary for notification
    const summary = newAlerts.map(a => `- [${a.source}] ${a.title}`).join('\n')
    console.log('\nSummary:')
    console.log(summary)

    // Could integrate with notify.sh here
    // execSync(`/Users/mallorca16/assistant/scripts/notify.sh "Third Period Labs: ${newAlerts.length} new policy updates"`)
  } else {
    console.log('\nNo new updates found.')
  }

  // Update tracker timestamp
  if (existsSync(TRACKER_FILE)) {
    let tracker = readFileSync(TRACKER_FILE, 'utf-8')
    tracker = tracker.replace(
      /\*Last Updated:.*\*/,
      `*Last Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*`
    )
    writeFileSync(TRACKER_FILE, tracker)
  }
}

// Run if called directly
runHeartbeat().catch(console.error)

export { runHeartbeat, SOURCES }
