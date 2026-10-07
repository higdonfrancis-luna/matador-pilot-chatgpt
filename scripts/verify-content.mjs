#!/usr/bin/env node
import {getClient, parseArgs, readContent, reportError, summarize, verifyPublished} from './import-content.mjs'

async function main() {
  const options = parseArgs(process.argv.slice(2), {allowWrite: false})
  if (options.help) {
    console.log('Usage: node scripts/verify-content.mjs [--file data/pilot.ndjson]\nRead-only verification of published pilot document IDs, types, and reference targets. Uses the uncached API; editor changes are allowed.')
    return
  }
  const content = await readContent(options.file)
  const client = await getClient()
  const {projectId, dataset} = client.config()
  console.log(`Verifying published content in ${projectId}/${dataset} (API CDN disabled)...`)
  await verifyPublished(client, content)
  summarize(content)
  console.log('PASS: every expected published document and strong reference target exists with the expected document type. Editor field changes were not compared with the seed.')
}

main().catch(reportError)
