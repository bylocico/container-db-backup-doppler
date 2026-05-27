import { readFile, writeFile } from 'node:fs/promises'

const DOCKER_HUB_TAGS_URL =
	'https://registry.hub.docker.com/v2/repositories/tiredofit/db-backup/tags?page_size=100'
const VERSION_FILE = new URL('../VERSION', import.meta.url)
const DOCKERFILE = new URL('../Dockerfile', import.meta.url)
const README = new URL('../README.md', import.meta.url)

const args = new Set(process.argv.slice(2))
const versionArgIndex = process.argv.indexOf('--version')
const requestedVersion =
	versionArgIndex === -1 ? null : process.argv[versionArgIndex + 1]

function parseSemver(version) {
	const match = version.match(
		/^(\d+)\.(\d+)\.(\d+)$/,
	)
	if (!match) return null

	return {
		version,
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	}
}

function compareSemver(left, right) {
	for (const key of ['major', 'minor', 'patch']) {
		const delta = left[key] - right[key]
		if (delta !== 0) return delta
	}
	return 0
}

async function fetchDockerHubTags() {
	const tags = []
	let next = DOCKER_HUB_TAGS_URL

	while (next) {
		const response = await fetch(next)
		if (!response.ok) {
			throw new Error(
				`Docker Hub tag query failed with ${response.status} ${response.statusText}`,
			)
		}

		const payload = await response.json()
		for (const result of payload.results ?? []) {
			if (typeof result.name === 'string') tags.push(result.name)
		}
		next = payload.next
	}

	return tags
}

function stableVersions(tags) {
	return tags
		.map(parseSemver)
		.filter((v) => v !== null)
		.sort(compareSemver)
}

function replaceVersion(text, currentVersion, nextVersion) {
	return text.split(currentVersion).join(nextVersion)
}

const current = (await readFile(VERSION_FILE, 'utf8')).trim()
const currentSemver = parseSemver(current)
if (!currentSemver) {
	throw new Error(`VERSION file is not valid semver: ${current}`)
}

const tags = await fetchDockerHubTags()
const versions = stableVersions(tags)
const latest = versions.at(-1)
if (!latest) throw new Error('No stable versions found on Docker Hub')

if (args.has('--list-newer')) {
	const newerVersions = versions
		.filter((v) => compareSemver(v, currentSemver) > 0)
		.map((v) => v.version)
	console.log(JSON.stringify(newerVersions))
	process.exit(0)
}

const target = requestedVersion ? parseSemver(requestedVersion) : latest
if (!target) throw new Error(`Invalid requested version: ${requestedVersion}`)
if (!versions.some((v) => v.version === target.version)) {
	throw new Error(`tiredofit/db-backup:${target.version} was not found on Docker Hub`)
}

if (target.version === current) {
	console.log(`Already targeting db-backup@${current}`)
	process.exit(0)
}

await writeFile(VERSION_FILE, `${target.version}\n`)

const dockerfile = await readFile(DOCKERFILE, 'utf8')
await writeFile(DOCKERFILE, replaceVersion(dockerfile, current, target.version))

const readme = await readFile(README, 'utf8')
await writeFile(README, replaceVersion(readme, current, target.version))

console.log(`Updated db-backup target ${current} -> ${target.version}`)
