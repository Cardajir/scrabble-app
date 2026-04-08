import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

export const registerSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  nickname: z
    .string()
    .min(3, 'Přezdívka musí mít alespoň 3 znaky')
    .max(20, 'Přezdívka může mít nejvýše 20 znaků')
    .regex(
      /^[a-zA-Z0-9_\-]+$/,
      'Přezdívka může obsahovat pouze písmena, čísla, podtržítko a pomlčku'
    ),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
})

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hesla se neshodují',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>
