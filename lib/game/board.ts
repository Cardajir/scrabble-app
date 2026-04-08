export const BOARD_SIZE = 15

export type BonusType = 'DL' | 'TL' | 'DW' | 'TW' | 'STAR' | null

export interface Position {
  row: number
  col: number
}

export interface BoardCell {
  position: Position
  bonus: BonusType
  tile: PlacedTile | null
}

export interface PlacedTile {
  letter: string
  value: number
  isBlank: boolean
  // Pokud je blank, blankLetter = zvolené písmeno
  blankLetter?: string
}

export type BoardState = Record<string, PlacedTile>

// Bonusová pole desky (indexováno row-col)
const BONUS_MAP: Record<string, BonusType> = {
  // TW – trojnásobné slovo
  '0-0': 'TW', '0-7': 'TW', '0-14': 'TW',
  '7-0': 'TW', '7-14': 'TW',
  '14-0': 'TW', '14-7': 'TW', '14-14': 'TW',

  // DW – dvojnásobné slovo
  '1-1': 'DW', '2-2': 'DW', '3-3': 'DW', '4-4': 'DW',
  '1-13': 'DW', '2-12': 'DW', '3-11': 'DW', '4-10': 'DW',
  '10-4': 'DW', '11-3': 'DW', '12-2': 'DW', '13-1': 'DW',
  '10-10': 'DW', '11-11': 'DW', '12-12': 'DW', '13-13': 'DW',

  // Střed
  '7-7': 'STAR',

  // TL – trojnásobné písmeno
  '1-5': 'TL', '1-9': 'TL',
  '5-1': 'TL', '5-5': 'TL', '5-9': 'TL', '5-13': 'TL',
  '9-1': 'TL', '9-5': 'TL', '9-9': 'TL', '9-13': 'TL',
  '13-5': 'TL', '13-9': 'TL',

  // DL – dvojnásobné písmeno
  '0-3': 'DL', '0-11': 'DL',
  '2-6': 'DL', '2-8': 'DL',
  '3-0': 'DL', '3-7': 'DL', '3-14': 'DL',
  '6-2': 'DL', '6-6': 'DL', '6-8': 'DL', '6-12': 'DL',
  '7-3': 'DL', '7-11': 'DL',
  '8-2': 'DL', '8-6': 'DL', '8-8': 'DL', '8-12': 'DL',
  '11-0': 'DL', '11-7': 'DL', '11-14': 'DL',
  '12-6': 'DL', '12-8': 'DL',
  '14-3': 'DL', '14-11': 'DL',
}

export function getBonusAt(row: number, col: number): BonusType {
  return BONUS_MAP[`${row}-${col}`] ?? null
}

export function positionKey(row: number, col: number): string {
  return `${row}-${col}`
}

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = []
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = {
        position: { row, col },
        bonus: getBonusAt(row, col),
        tile: null,
      }
    }
  }
  return board
}

export function boardStateToGrid(state: BoardState): BoardCell[][] {
  const board = createEmptyBoard()
  for (const [key, tile] of Object.entries(state)) {
    const [row, col] = key.split('-').map(Number)
    if (isValidPosition(row, col)) {
      board[row][col].tile = tile
    }
  }
  return board
}
