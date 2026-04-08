import { z } from 'zod'

export const createGameSchema = z.object({
  name: z.string().min(1, 'Název hry je povinný').max(50, 'Název hry je příliš dlouhý'),
  type: z.enum(['CUSTOM', 'RANKED']),
  isPrivate: z.boolean(),
  password: z.string().max(20).optional(),
  maxPlayers: z.number().int().min(2).max(4),
  turnTimeLimit: z.number().int().min(30).max(600).optional().nullable(),
})

export const joinGameSchema = z.object({
  password: z.string().optional(),
})

export const chatMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Zpráva nemůže být prázdná')
    .max(500, 'Zpráva je příliš dlouhá'),
})

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(3, 'Přezdívka musí mít alespoň 3 znaky')
    .max(20, 'Přezdívka může mít nejvýše 20 znaků')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Přezdívka může obsahovat pouze písmena, čísla, podtržítko a pomlčku')
    .optional(),
  bio: z.string().max(200, 'Bio může mít nejvýše 200 znaků').optional(),
  country: z.string().max(50).optional(),
})

export type CreateGameInput = z.infer<typeof createGameSchema>
export type JoinGameInput = z.infer<typeof joinGameSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
