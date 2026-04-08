export interface TileDefinition {
  letter: string
  value: number
  count: number
  isBlank?: boolean
}

// Česká sada písmen pro Scrabble
export const CZECH_TILES: TileDefinition[] = [
  { letter: 'A', value: 1, count: 5 },
  { letter: 'Á', value: 2, count: 2 },
  { letter: 'B', value: 3, count: 2 },
  { letter: 'C', value: 2, count: 3 },
  { letter: 'Č', value: 4, count: 2 },
  { letter: 'D', value: 1, count: 3 },
  { letter: 'Ď', value: 6, count: 1 },
  { letter: 'E', value: 1, count: 5 },
  { letter: 'É', value: 3, count: 2 },
  { letter: 'Ě', value: 3, count: 2 },
  { letter: 'F', value: 5, count: 1 },
  { letter: 'G', value: 4, count: 1 },
  { letter: 'H', value: 2, count: 3 },
  { letter: 'Ch', value: 4, count: 1 },
  { letter: 'I', value: 1, count: 4 },
  { letter: 'Í', value: 3, count: 2 },
  { letter: 'J', value: 2, count: 2 },
  { letter: 'K', value: 1, count: 3 },
  { letter: 'L', value: 1, count: 3 },
  { letter: 'M', value: 2, count: 3 },
  { letter: 'N', value: 1, count: 4 },
  { letter: 'Ň', value: 5, count: 1 },
  { letter: 'O', value: 1, count: 5 },
  { letter: 'Ó', value: 4, count: 1 },
  { letter: 'P', value: 1, count: 3 },
  { letter: 'R', value: 1, count: 3 },
  { letter: 'Ř', value: 4, count: 2 },
  { letter: 'S', value: 1, count: 4 },
  { letter: 'Š', value: 4, count: 2 },
  { letter: 'T', value: 1, count: 4 },
  { letter: 'Ť', value: 6, count: 1 },
  { letter: 'U', value: 2, count: 3 },
  { letter: 'Ú', value: 4, count: 1 },
  { letter: 'Ů', value: 3, count: 2 },
  { letter: 'V', value: 1, count: 4 },
  { letter: 'X', value: 10, count: 1 },
  { letter: 'Y', value: 2, count: 2 },
  { letter: 'Ý', value: 4, count: 1 },
  { letter: 'Z', value: 2, count: 2 },
  { letter: 'Ž', value: 4, count: 2 },
  { letter: '', value: 0, count: 2, isBlank: true }, // Joker
]

export interface Tile {
  id: string
  letter: string
  value: number
  isBlank: boolean
  blankLetter?: string
}

export function createTileBag(): Tile[] {
  const bag: Tile[] = []
  let idCounter = 0

  for (const def of CZECH_TILES) {
    for (let i = 0; i < def.count; i++) {
      bag.push({
        id: `tile-${idCounter++}`,
        letter: def.letter,
        value: def.value,
        isBlank: def.isBlank ?? false,
      })
    }
  }

  return shuffleBag(bag)
}

export function shuffleBag(bag: Tile[]): Tile[] {
  const shuffled = [...bag]
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function drawTiles(bag: Tile[], count: number): { drawn: Tile[]; remaining: Tile[] } {
  const remaining = [...bag]
  const drawn = remaining.splice(0, Math.min(count, remaining.length))
  return { drawn, remaining }
}

export function getTileValue(letter: string): number {
  const def = CZECH_TILES.find((t) => t.letter === letter)
  return def?.value ?? 0
}

export const RACK_SIZE = 7

export interface ExchangeValidationResult {
  valid: boolean
  error?: string
}

export function validateExchange(
  rack: Tile[],
  tileIds: string[],
  bagSize: number
): ExchangeValidationResult {
  if (bagSize < 7) {
    return { valid: false, error: 'V pytlíku není dostatek písmen pro výměnu (potřeba alespoň 7).' }
  }
  if (tileIds.length === 0) {
    return { valid: false, error: 'Musíte vybrat alespoň jedno písmeno k výměně.' }
  }
  const rackIds = new Set(rack.map((t) => t.id))
  for (const id of tileIds) {
    if (!rackIds.has(id)) {
      return { valid: false, error: 'Vybrané písmeno není na vašem stojánku.' }
    }
  }
  return { valid: true }
}
