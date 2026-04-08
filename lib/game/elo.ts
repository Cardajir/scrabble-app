interface PlayerEloInput {
  userId: string
  currentElo: number
  finalScore: number
  rank: number
  gamesPlayed: number
}

interface EloResult {
  userId: string
  eloBefore: number
  eloAfter: number
  change: number
}

/**
 * K-faktor závisí na počtu odehraných her a aktuálním ELO.
 * Nižší K = stabilnější rating (pro zkušené hráče).
 */
function getKFactor(gamesPlayed: number, elo: number): number {
  if (gamesPlayed < 30) return 32
  if (elo > 2000) return 16
  return 24
}

/**
 * Očekávaná pravděpodobnost výhry hráče A nad hráčem B.
 */
function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
}

/**
 * Vypočítá ELO změny pro všechny hráče po skončení hry.
 * Používá párové srovnání (každý s každým).
 * rank=1 znamená vítěz, rank=2 druhý v pořadí atd.
 */
export function calculateEloChanges(players: PlayerEloInput[]): EloResult[] {
  const results: EloResult[] = players.map((p) => ({
    userId: p.userId,
    eloBefore: p.currentElo,
    eloAfter: p.currentElo,
    change: 0,
  }))

  // Párové srovnání
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const playerA = players[i]
      const playerB = players[j]

      // Skutečný výsledek (1 = A vyhrál, 0 = B vyhrál, 0.5 = remíza)
      let actualA: number
      if (playerA.rank < playerB.rank) {
        actualA = 1
      } else if (playerA.rank > playerB.rank) {
        actualA = 0
      } else {
        actualA = 0.5
      }
      const actualB = 1 - actualA

      const expectedA = expectedScore(playerA.currentElo, playerB.currentElo)
      const expectedB = 1 - expectedA

      const kA = getKFactor(playerA.gamesPlayed, playerA.currentElo)
      const kB = getKFactor(playerB.gamesPlayed, playerB.currentElo)

      const changeA = Math.round(kA * (actualA - expectedA))
      const changeB = Math.round(kB * (actualB - expectedB))

      results[i].change += changeA
      results[j].change += changeB
    }
  }

  // Aplikace změn (minimum ELO = 100)
  for (const result of results) {
    result.eloAfter = Math.max(100, result.eloBefore + result.change)
    result.change = result.eloAfter - result.eloBefore
  }

  return results
}
