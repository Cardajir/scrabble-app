#!/usr/bin/env tsx
/**
 * Import slovníku českých slov do Supabase.
 *
 * Použití:
 *   npx tsx scripts/import-dictionary.ts ./data/czech-words.txt
 *
 * Soubor musí obsahovat jedno slovo na řádek (UTF-8 kódování).
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Chybí proměnné prostředí NEXT_PUBLIC_SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Vytvořte soubor .env.local nebo exportujte proměnné.')
  process.exit(1)
}

const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Zadejte cestu k souboru se slovníkem.')
  console.error('   Použití: npx tsx scripts/import-dictionary.ts ./data/czech-words.txt')
  process.exit(1)
}

const absolutePath = path.resolve(process.cwd(), filePath)

if (!fs.existsSync(absolutePath)) {
  console.error(`❌ Soubor neexistuje: ${absolutePath}`)
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY)

const BATCH_SIZE = 500

async function main() {
  console.log(`📖 Načítám slovník z: ${absolutePath}`)

  const words: string[] = []

  const fileStream = fs.createReadStream(absolutePath, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  for await (const line of rl) {
    const word = line.trim().toUpperCase()
    if (word.length >= 2 && word.length <= 20) {
      words.push(word)
    }
  }

  console.log(`📝 Nalezeno ${words.length} slov. Importuji...`)

  let imported = 0
  let errors = 0

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE).map((word) => ({
      word,
      is_valid: true,
    }))

    const { error } = await supabase
      .from('dictionary_words')
      .upsert(batch, { onConflict: 'word', ignoreDuplicates: true })

    if (error) {
      console.error(`❌ Chyba při importu dávky ${i}-${i + BATCH_SIZE}:`, error.message)
      errors++
    } else {
      imported += batch.length
      const progress = Math.round((imported / words.length) * 100)
      process.stdout.write(`\r📦 Průběh: ${progress}% (${imported}/${words.length})`)
    }
  }

  console.log(`\n\n✅ Import dokončen!`)
  console.log(`   Importováno: ${imported} slov`)
  if (errors > 0) {
    console.log(`   Chyby: ${errors} dávek`)
  }
}

main().catch((err) => {
  console.error('❌ Neočekávaná chyba:', err)
  process.exit(1)
})
