import { createClient } from '@/lib/supabase/server'

/**
 * Jednoduchá Trie struktura pro rychlé vyhledávání slov.
 * Načítá se při inicializaci serveru z databáze.
 */
class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isEnd = false
}

class Trie {
  private root: TrieNode = new TrieNode()

  insert(word: string): void {
    let node = this.root
    for (const char of word.toUpperCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }
      node = node.children.get(char)!
    }
    node.isEnd = true
  }

  search(word: string): boolean {
    let node = this.root
    for (const char of word.toUpperCase()) {
      if (!node.children.has(char)) return false
      node = node.children.get(char)!
    }
    return node.isEnd
  }

  get size(): number {
    let count = 0
    const traverse = (node: TrieNode) => {
      if (node.isEnd) count++
      for (const child of node.children.values()) traverse(child)
    }
    traverse(this.root)
    return count
  }
}

// Singleton Trie pro server-side lookups
let dictionaryTrie: Trie | null = null
let trieLoadedAt: number | null = null
const TRIE_TTL_MS = 60 * 60 * 1000 // 1 hodina

async function getDictionaryTrie(): Promise<Trie> {
  const now = Date.now()
  if (
    dictionaryTrie &&
    trieLoadedAt &&
    now - trieLoadedAt < TRIE_TTL_MS
  ) {
    return dictionaryTrie
  }

  const supabase = await createClient()
  const trie = new Trie()

  // Načítáme po dávkách, aby nedošlo k timeoutu
  let offset = 0
  const batchSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('dictionary_words')
      .select('word')
      .eq('is_valid', true)
      .range(offset, offset + batchSize - 1)

    if (error || !data || data.length === 0) break

    for (const row of data) {
      trie.insert(row.word)
    }

    if (data.length < batchSize) break
    offset += batchSize
  }

  dictionaryTrie = trie
  trieLoadedAt = now
  return trie
}

/**
 * Ověří jedno slovo v databázi (server-side).
 */
export async function validateWord(word: string): Promise<boolean> {
  const trie = await getDictionaryTrie()
  return trie.search(word)
}

/**
 * Dávková validace více slov najednou.
 * Vrací mapu slovo → platnost.
 */
export async function validateWords(
  words: string[]
): Promise<Map<string, boolean>> {
  const trie = await getDictionaryTrie()
  const result = new Map<string, boolean>()
  for (const word of words) {
    result.set(word, trie.search(word))
  }
  return result
}

/**
 * Přímý dotaz do databáze (pro API route).
 */
export async function validateWordDirect(word: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('dictionary_words')
    .select('id')
    .eq('word', word.toUpperCase())
    .eq('is_valid', true)
    .single()
  return !!data
}
