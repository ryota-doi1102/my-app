import { z } from 'zod'

export const createUserSchema = z.object({
	name: z.string().min(1, '名前は必須です'),
	email: z.string().email('有効なメールアドレスを入力してください'),
	password: z.string().min(8, '8文字以上で入力してください'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// --- Profile creation ---

export const WORK_TYPES = ['フルタイム', 'パートタイム', 'リモート', 'フリーランス'] as const
export type WorkType = (typeof WORK_TYPES)[number]

export function calcAge(birthDate: string): number {
	if (!birthDate) return 0
	const today = new Date()
	const birth = new Date(birthDate)
	let age = today.getFullYear() - birth.getFullYear()
	const m = today.getMonth() - birth.getMonth()
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
		age--
	}
	return age
}

export const workHistoryItemSchema = z.object({
	company: z.string().min(1, '会社名は必須項目です'),
	startMonth: z.string().min(1, '在籍開始月は必須項目です'),
	endMonth: z.string().nullable().optional(),
	role: z.string().min(1, '役職は必須項目です'),
})

export type WorkHistoryItem = z.infer<typeof workHistoryItemSchema>

export const qualificationItemSchema = z.object({
	value: z.string().min(1, '資格名は必須項目です'),
})

export const userProfileCreateSchema = z.object({
	name: z.string().min(1, '氏名は必須項目です'),
	birthDate: z
		.string()
		.min(1, '生年月日は必須項目です')
		.refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), '生年月日はYYYY-MM-DD形式で入力してください')
		.refine((val) => calcAge(val) >= 18, '18歳未満の方は登録できません')
		.refine((val) => calcAge(val) < 60, '60歳以上の方は登録できません'),
	gender: z.enum(['男性', '女性', 'その他'], {
		errorMap: (issue) => ({
			message: issue.code === 'invalid_enum_value' ? '性別の形式が正しくありません' : '性別は必須項目です',
		}),
	}),
	profileImage: z
		.custom<{ type: string; size: number } | string | null | undefined>()
		.refine(
			(val) => !val || typeof val === 'string' || ['image/jpeg', 'image/png', 'image/webp'].includes((val as { type: string }).type),
			'対応していないファイル形式です',
		)
		.refine(
			(val) => !val || typeof val === 'string' || (val as { size: number }).size <= 5 * 1024 * 1024,
			'ファイルサイズが上限を超えています',
		)
		.nullable()
		.optional(),
	phone: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^\d{10,11}$/.test(val),
			'電話番号の形式が正しくありません',
		),
	email: z
		.string()
		.min(1, 'メールアドレスは必須項目です')
		.email('メールアドレスはメールアドレス形式で入力してください'),
	password: z
		.string()
		.min(1, 'パスワードは必須項目です')
		.min(8, 'パスワードは8文字以上で入力してください'),
	postalCode: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^\d{7}$/.test(val),
			'郵便番号の形式が正しくありません',
		),
	prefecture: z.string().optional(),
	city: z.string().optional(),
	streetAddress: z.string().optional(),
	building: z.string().optional(),
	workTypes: z.array(z.enum(WORK_TYPES)).optional(),
	qualifications: z.array(qualificationItemSchema).optional(),
	workHistories: z.array(workHistoryItemSchema).min(1, '職歴を1件以上入力してください'),
	selfPR: z.string().optional(),
	agreedToTerms: z.boolean().refine((val) => val === true, {
		message: '利用規約・プライバシーポリシーへの同意が必要です',
	}),
})

export type UserProfileCreateInput = z.infer<typeof userProfileCreateSchema>

// --- Profile view / edit ---

export type UserProfile = {
	id: string
	name: string
	birthDate: string
	gender: '男性' | '女性' | 'その他'
	profileImageUrl?: string | null
	phone?: string
	email: string
	postalCode?: string
	prefecture?: string
	city?: string
	streetAddress?: string
	building?: string
	workTypes?: WorkType[]
	qualifications?: string[]
	workHistories: WorkHistoryItem[]
	selfPR?: string
	createdAt: string
	updatedAt?: string
}

export const userProfileEditSchema = userProfileCreateSchema.omit({
	password: true,
	agreedToTerms: true,
})

export type UserProfileEditInput = z.infer<typeof userProfileEditSchema>