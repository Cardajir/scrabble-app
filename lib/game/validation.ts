import {
  BOARD_SIZE,
  BoardState,
  PlacedTile,
  Position,
  getBonusAt,
  positionKey,
  isValidPosition,
} from './board'
import { Tile } from './tiles'

export interface PlacedTileMove {
  row: number
  col: number
  tile: Tile
  // Pokud je blank, zvolené písmeno
  blankLetter?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  words: string[]
  score: number
  newBoardState: BoardState
}

/**
 * Ověří, že hráč má všechna dlaždice na stojánku, která chce umístit.
 */
export function validateRackHasTiles(rack: Tile[], tilesToPlace: PlacedTileMove[]): boolean {
  const rackCopy = [...rack]
  for (const move of tilesToPlace) {
    const idx = rackCopy.findIndex((t) => t.id === move.tile.id)
    if (idx === -1) return false
    rackCopy.splice(idx, 1)
  }
  return true
}

/**
 * Hlavní validace tahu PLACE.
 * Vrací validní výsledek s vypočteným skóre, nebo chybu.
 */
export function validatePlaceMove(
  boardState: BoardState,
  tilesToPlace: PlacedTileMove[],
  turnNumber: number
): ValidationResult {
  if (tilesToPlace.length === 0) {
    return { valid: false, error: 'Musíte umístit alespoň jedno písmeno.', words: [], score: 0, newBoardState: boardState }
  }

  // Zkontrolovat, že všechna pole jsou volná
  for (const move of tilesToPlace) {
    if (!isValidPosition(move.row, move.col)) {
      return { valid: false, error: 'Pole je mimo desku.', words: [], score: 0, newBoardState: boardState }
    }
    if (boardState[positionKey(move.row, move.col)]) {
      return { valid: false, error: 'Pole je již obsazeno.', words: [], score: 0, newBoardState: boardState }
    }
  }

  // Zkontrolovat, že jsou na jedné linii (řádek nebo sloupec)
  const rows = new Set(tilesToPlace.map((m) => m.row))
  const cols = new Set(tilesToPlace.map((m) => m.col))
  const isHorizontal = rows.size === 1
  const isVertical = cols.size === 1

  if (!isHorizontal && !isVertical) {
    return { valid: false, error: 'Písmena musí být na jedné linii.', words: [], score: 0, newBoardState: boardState }
  }

  // Zkontrolovat duplicitní pozice
  const positions = tilesToPlace.map((m) => positionKey(m.row, m.col))
  if (new Set(positions).size !== positions.length) {
    return { valid: false, error: 'Duplicitní pozice.', words: [], score: 0, newBoardState: boardState }
  }

  // První tah musí přes střed (7,7)
  const boardIsEmpty = Object.keys(boardState).length === 0
  if (boardIsEmpty || turnNumber === 0) {
    const coversCenter = tilesToPlace.some((m) => m.row === 7 && m.col === 7)
    if (!coversCenter) {
      return { valid: false, error: 'První tah musí procházet středovým polem.', words: [], score: 0, newBoardState: boardState }
    }
  }

  // Nová dlaždice nesmí být izolována od existujících (pokud deska není prázdná)
  if (!boardIsEmpty) {
    const isConnected = tilesToPlace.some((m) => {
      const neighbors = [
        positionKey(m.row - 1, m.col),
        positionKey(m.row + 1, m.col),
        positionKey(m.row, m.col - 1),
        positionKey(m.row, m.col + 1),
      ]
      return neighbors.some((key) => boardState[key] !== undefined)
    })

    // Nebo jsou nová písmena sousedí s existujícími přes mezery v novém slově
    if (!isConnected) {
      // Zkontroluj, zda nové umístění nevytváří spojení s existujícími přes řetěz
      const tempBoard = { ...boardState }
      for (const m of tilesToPlace) {
        const letter = m.tile.isBlank ? (m.blankLetter ?? '') : m.tile.letter
        tempBoard[positionKey(m.row, m.col)] = {
          letter,
          value: m.tile.value,
          isBlank: m.tile.isBlank,
          blankLetter: m.blankLetter,
        }
      }
      const hasConnection = tilesToPlace.some((m) => {
        return checkConnectionInLine(tempBoard, m.row, m.col, isHorizontal)
      })
      if (!hasConnection) {
        return { valid: false, error: 'Slovo musí navazovat na existující písmena.', words: [], score: 0, newBoardState: boardState }
      }
    }
  }

  // Sestavit nový stav desky
  const newBoardState: BoardState = { ...boardState }
  for (const m of tilesToPlace) {
    const letter = m.tile.isBlank ? (m.blankLetter ?? '') : m.tile.letter
    newBoardState[positionKey(m.row, m.col)] = {
      letter,
      value: m.tile.value,
      isBlank: m.tile.isBlank,
      blankLetter: m.blankLetter,
    }
  }

  // Najít všechna vzniklá slova a vypočítat skóre
  const { words, score } = calculateWordsAndScore(
    boardState,
    newBoardState,
    tilesToPlace,
    isHorizontal
  )

  if (words.length === 0) {
    return { valid: false, error: 'Nevzniklo žádné platné slovo.', words: [], score: 0, newBoardState: boardState }
  }

  // Bonus za použití všech 7 dlaždic (bingo)
  const finalScore = tilesToPlace.length === 7 ? score + 50 : score

  return { valid: true, words, score: finalScore, newBoardState }
}

function checkConnectionInLine(
  board: BoardState,
  row: number,
  col: number,
  isHorizontal: boolean
): boolean {
  // Zkontroluje, zda je na konci slova v perpendiculární ose existující dlaždice
  const perp1 = isHorizontal
    ? positionKey(row - 1, col)
    : positionKey(row, col - 1)
  const perp2 = isHorizontal
    ? positionKey(row + 1, col)
    : positionKey(row, col + 1)
  return !!board[perp1] || !!board[perp2]
}

interface WordScore {
  words: string[]
  score: number
}

function calculateWordsAndScore(
  oldBoard: BoardState,
  newBoard: BoardState,
  newTiles: PlacedTileMove[],
  isHorizontal: boolean
): WordScore {
  const words: string[] = []
  let totalScore = 0

  const newPositions = new Set(newTiles.map((m) => positionKey(m.row, m.col)))

  // Hlavní slovo (ve směru umístění)
  const firstTile = newTiles[0]
  const mainWordResult = extractWord(
    newBoard,
    firstTile.row,
    firstTile.col,
    isHorizontal,
    newPositions,
    oldBoard
  )
  if (mainWordResult.word.length >= 2) {
    words.push(mainWordResult.word)
    totalScore += mainWordResult.score
  }

  // Vedlejší slova (kolmá)
  for (const m of newTiles) {
    const perpResult = extractWord(
      newBoard,
      m.row,
      m.col,
      !isHorizontal,
      newPositions,
      oldBoard
    )
    if (perpResult.word.length >= 2) {
      words.push(perpResult.word)
      totalScore += perpResult.score
    }
  }

  return { words, score: totalScore }
}

function extractWord(
  board: BoardState,
  row: number,
  col: number,
  horizontal: boolean,
  newPositions: Set<string>,
  oldBoard: BoardState
): { word: string; score: number } {
  // Najít začátek slova
  let startRow = row
  let startCol = col

  if (horizontal) {
    while (startCol > 0 && board[positionKey(startRow, startCol - 1)]) {
      startCol--
    }
  } else {
    while (startRow > 0 && board[positionKey(startRow - 1, startCol)]) {
      startRow--
    }
  }

  // Sestavit slovo
  let word = ''
  let wordScore = 0
  let wordMultiplier = 1
  let r = startRow
  let c = startCol

  while (r < BOARD_SIZE && c < BOARD_SIZE) {
    const key = positionKey(r, c)
    const tile = board[key]
    if (!tile) break

    const letter = tile.isBlank ? (tile.blankLetter ?? '') : tile.letter
    word += letter

    let letterScore = tile.value
    const isNewTile = newPositions.has(key)

    if (isNewTile && !oldBoard[key]) {
      // Bonus se aplikuje pouze na nová písmena
      const bonus = getBonusAt(r, c)
      if (bonus === 'DL') letterScore *= 2
      else if (bonus === 'TL') letterScore *= 3
      else if (bonus === 'DW' || bonus === 'STAR') wordMultiplier *= 2
      else if (bonus === 'TW') wordMultiplier *= 3
    }

    wordScore += letterScore

    if (horizontal) c++
    else r++
  }

  return { word, score: wordScore * wordMultiplier }
}

/**
 * Odstraní použitá písmena ze stojánku a vrátí nový stojánek.
 */
export function removeUsedTilesFromRack(
  rack: Tile[],
  usedTileIds: string[]
): Tile[] {
  const usedSet = new Set(usedTileIds)
  return rack.filter((t) => !usedSet.has(t.id))
}

/**
 * Ověří, zda je výměna platná (hráč musí mít dlaždice na stojánku a v pytli musí být dost).
 */
export function validateExchange(
  rack: Tile[],
  tileIds: string[],
  bagSize: number
): { valid: boolean; error?: string } {
  if (tileIds.length === 0) {
    return { valid: false, error: 'Musíte vybrat alespoň jedno písmeno.' }
  }
  if (bagSize < 7) {
    return { valid: false, error: 'V pytlíku není dost písmen pro výměnu.' }
  }

  const rackIds = new Set(rack.map((t) => t.id))
  for (const id of tileIds) {
    if (!rackIds.has(id)) {
      return { valid: false, error: 'Vybrané písmeno není na stojánku.' }
    }
  }

  return { valid: true }
}
