#!/usr/bin/env node
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

export const defaultContentFile = fileURLToPath(new URL('../data/pilot.ndjson', import.meta.url))
export const apiVersion = '2025-02-19'
const idPattern = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/
const types = new Set(['homePage', 'testimonial', 'memberVideo', 'caseStudy', 'resource', 'logo'])

export function parseArgs(args, {allowWrite = true} = {}) {
  const options = {file: defaultContentFile, write: false, replace: false, help: false}
  let dryRun = false
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--file') {
      const file = args[++index]
      if (!file || file.startsWith('--')) throw new Error('--file requires an NDJSON path.')
      options.file = path.resolve(file)
    } else if (allowWrite && arg === '--write') options.write = true
    else if (allowWrite && arg === '--replace') options.replace = true
    else if (allowWrite && arg === '--dry-run') dryRun = true
    else throw new Error(`Unknown option: ${arg}`)
  }
  if (dryRun && options.write) throw new Error('Choose --dry-run or --write, not both.')
  if (options.replace && !options.write) throw new Error('--replace requires --write and replaces the imported documents, including editor changes.')
  return options
}

export async function readContent(file = defaultContentFile) {
  const source = await readFile(file, 'utf8')
  const documents = []
  for (const [index, line] of source.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    if (!line.trim()) continue
    try { documents.push(JSON.parse(line)) }
    catch { throw new Error(`Invalid JSON on line ${index + 1} of ${path.basename(file)}.`) }
  }
  if (!documents.length) throw new Error('The import file is empty.')
  const ids = new Set()
  const strongReferences = new Set()
  const counts = {}
  const errors = []
  function inspect(value, location, depth = 0) {
    if (depth > 20) { errors.push(`${location}: nesting exceeds 20 levels.`); return }
    if (Array.isArray(value)) {
      const keys = new Set()
      value.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          if (typeof item._key !== 'string' || !item._key) errors.push(`${location}[${index}]: object array items need _key.`)
          else if (keys.has(item._key)) errors.push(`${location}: duplicate _key ${item._key}.`)
          else keys.add(item._key)
        }
        if (Array.isArray(item)) errors.push(`${location}[${index}]: nested arrays are not supported.`)
        inspect(item, `${location}[${index}]`, depth + 1)
      })
    } else if (value && typeof value === 'object') {
      if (value._type === 'crossDatasetReference') errors.push(`${location}: cross-dataset references are outside this pilot import.`)
      if ('_ref' in value) {
        if (value._type !== 'reference' || typeof value._ref !== 'string' || !idPattern.test(value._ref)) errors.push(`${location}: invalid reference.`)
        else if (/^(drafts|versions)\./.test(value._ref)) errors.push(`${location}: published content cannot reference a draft or release version.`)
        else if (value._weak !== true) strongReferences.add(value._ref)
      }
      for (const [key, item] of Object.entries(value)) inspect(item, `${location}.${key}`, depth + 1)
    }
  }
  for (const [index, document] of documents.entries()) {
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      errors.push(`Document ${index + 1}: expected an object.`)
      continue
    }
    const label = document._id || `Document ${index + 1}`
    if (typeof document._id !== 'string' || !idPattern.test(document._id)) errors.push(`${label}: invalid _id.`)
    else if (/^(drafts|versions)\./.test(document._id)) errors.push(`${label}: this importer only accepts published document IDs.`)
    else if (ids.has(document._id)) errors.push(`${label}: duplicate _id.`)
    else ids.add(document._id)
    if (!types.has(document._type)) errors.push(`${label}: unsupported document type ${String(document._type)}.`)
    else counts[document._type] = (counts[document._type] || 0) + 1
    for (const key of ['_rev', '_createdAt', '_updatedAt']) {
      if (key in document) errors.push(`${label}: omit managed field ${key} from the seed.`)
    }
    inspect(document, label)
  }
  if (errors.length) throw new Error(`Content validation failed:\n${errors.slice(0, 30).join('\n')}${errors.length > 30 ? `\n... and ${errors.length - 30} more errors.` : ''}`)
  // Keep this pilot in one atomic transaction, with headroom below the 4 MB API limit.
  const requestBytes = Buffer.byteLength(JSON.stringify({mutations: documents.map(document => ({createIfNotExists: document}))}))
  if (requestBytes > 3_500_000) throw new Error('This file is too large for the pilot single-transaction importer (3.5 MB safety limit). No content was written.')
  return {documents, ids, strongReferences, externalReferences: [...strongReferences].filter(id => !ids.has(id)), counts, requestBytes}
}

export async function getClient({write = false} = {}) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
  const token = write ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!projectId || !/^[a-z0-9]+$/.test(projectId)) throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID to your Sanity project ID.')
  if (!/^[a-z0-9_-]{1,64}$/.test(dataset)) throw new Error('NEXT_PUBLIC_SANITY_DATASET must be a valid Sanity dataset name.')
  if (write && !token) throw new Error('Set SANITY_API_WRITE_TOKEN in your local process environment before using --write. Never commit it or add NEXT_PUBLIC_ to its name.')
  const {createClient} = await import('@sanity/client')
  return createClient({projectId, dataset, apiVersion, useCdn: false, perspective: 'published', token})
}

export function summarize(content) {
  console.log(`${content.documents.length} documents; ${content.requestBytes.toLocaleString('en-US')} mutation bytes.`)
  for (const [type, count] of Object.entries(content.counts).sort(([a], [b]) => a.localeCompare(b))) console.log(`  ${type}: ${count}`)
  console.log(`${content.strongReferences.size} unique strong reference targets; ${content.externalReferences.length} outside this file.`)
}

export async function verifyPublished(client, content) {
  const expectedIds = [...new Set([...content.ids, ...content.strongReferences])]
  const actual = await client.fetch('*[_id in $ids]{_id, _type}', {ids: expectedIds}, {perspective: 'published'})
  const byId = new Map(actual.map(document => [document._id, document]))
  const missing = expectedIds.filter(id => !byId.has(id))
  const wrongTypes = content.documents.filter(document => byId.has(document._id) && byId.get(document._id)._type !== document._type)
  if (missing.length || wrongTypes.length) {
    throw new Error(`Published-content verification failed.${missing.length ? ` Missing: ${missing.join(', ')}.` : ''}${wrongTypes.length ? ` Wrong type: ${wrongTypes.map(document => document._id).join(', ')}.` : ''}`)
  }
  return actual
}

export function reportError(error) {
  let message = error instanceof Error ? error.message : String(error)
  for (const secret of [process.env.SANITY_API_WRITE_TOKEN, process.env.SANITY_API_READ_TOKEN]) {
    if (secret) message = message.split(secret).join('[redacted]')
  }
  console.error(message)
  process.exitCode = 1
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: node scripts/import-content.mjs [--file data/pilot.ndjson] [--dry-run | --write [--replace]]\nDefault: validate locally, without network access or writes.\n--write creates missing published documents, preserving existing edits.\n--write --replace replaces imported documents with the seed; unrelated documents and drafts are untouched.')
    return
  }
  const content = await readContent(options.file)
  summarize(content)
  if (!options.write) {
    console.log('Dry run passed: JSON, IDs, types, array keys, and local reference structure are valid. No network requests or writes made.')
    if (content.externalReferences.length) console.log(`References requiring an online check before import: ${content.externalReferences.join(', ')}`)
    console.log('Images remain external URLs; this command does not upload media. Studio field validation is separate from these structural checks.')
    console.log('To import: npm run content:import -- --write')
    return
  }
  const client = await getClient({write: true})
  const ids = [...new Set([...content.ids, ...content.externalReferences])]
  const existing = await client.fetch('*[_id in $ids]{_id, _type}', {ids}, {perspective: 'raw'})
  const byId = new Map(existing.map(document => [document._id, document]))
  const missingReferences = content.externalReferences.filter(id => !byId.has(id))
  if (missingReferences.length) throw new Error(`No content written. Missing strong reference targets: ${missingReferences.join(', ')}`)
  const wrongTypes = content.documents.filter(document => byId.has(document._id) && byId.get(document._id)._type !== document._type)
  if (wrongTypes.length) throw new Error(`No content written. Existing document types do not match the seed: ${wrongTypes.map(document => document._id).join(', ')}`)
  const existingCount = content.documents.filter(document => byId.has(document._id)).length
  const {projectId, dataset} = client.config()
  console.log(`Import target: ${projectId}/${dataset}. Mode: ${options.replace ? 'replace imported documents' : 'create missing documents only'}.`)
  console.log(`Preflight found ${existingCount} existing and ${content.documents.length - existingCount} missing document IDs.`)
  let transaction = client.transaction()
  for (const document of content.documents) transaction = options.replace ? transaction.createOrReplace(document) : transaction.createIfNotExists(document)
  const result = await transaction.commit({visibility: 'sync', returnDocuments: false})
  console.log(`Transaction committed: ${result.transactionId}. Checking published content directly from the API...`)
  await verifyPublished(client, content)
  console.log(`Verified ${content.documents.length} published pilot documents and all strong reference targets. ${options.replace ? 'Imported published documents were replaced.' : 'Existing editor changes were preserved.'}`)
  console.log('Media files were not uploaded; existing origin image URLs remain in use.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(reportError)
