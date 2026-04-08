export const INITIAL_RANGE = 100
export const RANGE_EXPANSION_PER_INTERVAL = 50
export const EXPANSION_INTERVAL_MS = 30_000
export const MAX_RANGE = 400

/**
 * Vypočítá aktuální hledaný rozsah ELO na základě doby čekání ve frontě.
 */
export function calculateSearchRange(
  elo: number,
  joinedAt: Date
): { min: number; max: number } {
  const waitingMs = Date.now() - joinedAt.getTime()
  const intervals = Math.floor(waitingMs / EXPANSION_INTERVAL_MS)
  const expansion = Math.min(
    intervals * RANGE_EXPANSION_PER_INTERVAL,
    MAX_RANGE - INITIAL_RANGE
  )
  const range = INITIAL_RANGE + expansion

  return {
    min: Math.max(0, elo - range),
    max: elo + range,
  }
}

/**
 * Zkontroluje, zda dva hráči ve frontě se vzájemně překrývají v ELO rozsahu.
 */
export function canMatch(
  player1: { elo_rating: number; search_range_min: number; search_range_max: number },
  player2: { elo_rating: number; search_range_min: number; search_range_max: number }
): boolean {
  // Oba hráči musí být navzájem v rozsahu toho druhého
  const p1InP2Range =
    player1.elo_rating >= player2.search_range_min &&
    player1.elo_rating <= player2.search_range_max
  const p2InP1Range =
    player2.elo_rating >= player1.search_range_min &&
    player2.elo_rating <= player1.search_range_max

  return p1InP2Range && p2InP1Range
}
