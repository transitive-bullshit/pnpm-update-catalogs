#!/usr/bin/env node
import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'

import { packageManager } from '@pnpm/cli-meta'
import { createResolver } from '@pnpm/client'
import { getConfig } from '@pnpm/config'
import { pickRegistryForPackage } from '@pnpm/pick-registry-for-package'
import { cli } from 'cleye'
import { gracefulExit } from 'exit-hook'
import { oraPromise } from 'ora'
import pMap from 'p-map'
import plur from 'plur'
import YAML from 'yaml'

async function main() {
  const args = cli(
    {
      name: 'pnpm-update-catalogs',
      parameters: ['[pkg...]'],
      flags: {
        latest: {
          type: Boolean,
          description: 'Update all catalogs to the latest version',
          alias: 'L',
          default: false
        },
        verbose: {
          type: Boolean,
          description: 'Verbose output',
          alias: 'V',
          default: false
        },
        catalogs: {
          type: [String],
          description:
            'Update specific catalogs (by default, all catalogs will be updated)',
          alias: 'c'
        }
      }
    },
    () => {},
    process.argv
  )

  const packagesToProcess =
    args._.length > 2 ? new Set(args._.slice(2)) : undefined

  const catalogsToProcess = args.flags.catalogs?.length
    ? new Set(args.flags.catalogs)
    : undefined

  const { config } = await getConfig({
    cliOptions: {},
    packageManager,
    workspaceDir: process.cwd()
  })

  const { resolve } = createResolver({
    ...config,
    authConfig: config.rawConfig,
    retry: {
      retries: 0
    }
  })

  const { catalogs, workspaceDir } = config
  if (!catalogs || !Object.keys(catalogs).length) {
    console.error('No workspace catalogs found')
    gracefulExit(1)
    return
  }

  if (!workspaceDir) {
    console.error('No workspace directory found')
    gracefulExit(1)
    return
  }

  const packagesProcessed = new Set<string>()

  const allCatalogEntries = Object.entries(catalogs)
    .flatMap(([catalogName, catalog]) => {
      if (catalogsToProcess && !catalogsToProcess.has(catalogName)) {
        return []
      }

      if (!catalog) {
        return []
      }

      return Object.entries(catalog)
        .map(([packageName, pref]) => {
          assert(pref)

          if (packagesToProcess && !packagesToProcess.has(packageName)) {
            return undefined
          }

          packagesProcessed.add(packageName)

          return {
            catalogName,
            packageName,
            pref
          }
        })
        .filter(Boolean)
    })
    .filter((catalogEntry) => catalogEntry.pref !== 'latest')

  if (packagesToProcess && packagesProcessed.size !== packagesToProcess.size) {
    const missingPackages = Array.from(packagesToProcess).filter(
      (pkg) => !packagesProcessed.has(pkg)
    )
    console.error('Error: missing catalog packages:', missingPackages)
    gracefulExit(1)
    return
  }

  const catalogEntryResolutions = await oraPromise(
    pMap(
      allCatalogEntries,
      async ({ catalogName, packageName, pref }) => {
        if (args.flags.verbose) {
          console.log(`Resolving ${catalogName} ${packageName}@${pref}`)
        }

        const resolution = await resolve(
          { alias: packageName, pref },
          {
            lockfileDir: config.lockfileDir ?? config.dir,
            preferredVersions: {},
            projectDir: config.dir,
            registry: pickRegistryForPackage(
              config.registries,
              packageName,
              args.flags.latest ? 'latest' : pref
            )
          }
        )

        return {
          catalogName,
          packageName,
          pref,
          resolution
        }
      },
      {
        concurrency: 16
      }
    ),
    `Resolving ${allCatalogEntries.length} catalog ${plur('package', allCatalogEntries.length)}...`
  )

  if (args.flags.verbose) {
    console.log(JSON.stringify(catalogEntryResolutions, null, 2))
  }

  // Read the original workspace file
  const workspaceFilePath = path.join(workspaceDir, 'pnpm-workspace.yaml')
  const currentWorkspaceFileContents = await fs.readFile(
    workspaceFilePath,
    'utf8'
  )
  const workspaceFile = YAML.parseDocument(currentWorkspaceFileContents)
  let hasUpdates = false

  // Update the workspace file's YAML
  for (const catalogEntryResolution of catalogEntryResolutions) {
    const { catalogName, packageName, pref, resolution } =
      catalogEntryResolution

    const resolvedVersion = args.flags.latest
      ? resolution.latest
      : resolution?.manifest?.version
    if (!resolvedVersion) {
      // No version found
      continue
    }

    if (pref === resolvedVersion || pref === `^${resolvedVersion}`) {
      // Already up-to-date
      continue
    }

    const prefHasCaret = pref.startsWith('^')
    const updatedVersion = prefHasCaret
      ? `^${resolvedVersion}`
      : resolvedVersion

    const currentCatalog: any =
      workspaceFile.get(`catalogs.${catalogName}`) ??
      (catalogName === 'default' ? workspaceFile.get('catalog') : undefined)
    assert(
      currentCatalog,
      `Catalog "${catalogName}" not found in current workspace file`
    )

    const key = currentCatalog.get(packageName)
      ? packageName
      : currentCatalog.get(`"${packageName}"`)
        ? `"${packageName}"`
        : currentCatalog.get(`'${packageName}'`)
          ? `${packageName}`
          : undefined
    assert(
      key,
      `Package "${packageName}" not found in catalog "${catalogName}" in workspace file`
    )

    // Update the version in the catalog
    currentCatalog.set(key, updatedVersion)
    hasUpdates = true

    console.log(
      `Updating catalog "${catalogName}" package "${packageName}" from "${pref}" to "${updatedVersion}"`
    )
  }

  if (!hasUpdates) {
    console.log('No updates found')
    return
  }

  await fs.writeFile(workspaceFilePath, workspaceFile.toString())
  console.log(`Updated workspace file: ${workspaceFilePath}`)
}

try {
  await main()
  gracefulExit(0)
} catch (err) {
  console.error(err)
  gracefulExit(1)
}
