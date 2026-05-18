import { z } from 'zod'
import {
	allowedCharsMessage,
	digitsMessage,
	forbiddenCharsMessage,
	formatMessage,
	invalidTypeMessage,
	maxMessage,
	minMessage,
	requiredMessage,
} from '../constants/index.js'

export const createUserSchema = z.object({
	name: z
		.string({ required_error: requiredMessage('名前'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(1, requiredMessage('名前')),
	email: z
		.string({ required_error: requiredMessage('メールアドレス'), invalid_type_error: invalidTypeMessage('文字列') })
		.email(formatMessage('メールアドレス', 'メールアドレス')),
	password: z
		.string({ required_error: requiredMessage('パスワード'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(8, minMessage('パスワード', '8文字')),
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
	company: z
		.string({ required_error: requiredMessage('会社名'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(1, requiredMessage('会社名'))
		.max(255, maxMessage('会社名', '255文字')),
	startMonth: z
		.string({ required_error: requiredMessage('在籍開始月'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(1, requiredMessage('在籍開始月'))
		.regex(/^\d{4}-\d{2}$/, formatMessage('在籍開始月', 'YYYY-MM')),
	endMonth: z
		.string({ invalid_type_error: invalidTypeMessage('文字列') })
		.regex(/^(\d{4}-\d{2})?$/, formatMessage('在籍終了月', 'YYYY-MM'))
		.nullable()
		.optional(),
	role: z
		.string({ required_error: requiredMessage('役職'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(1, requiredMessage('役職'))
		.max(255, maxMessage('役職', '255文字')),
})

export type WorkHistoryItem = z.infer<typeof workHistoryItemSchema>

export const qualificationItemSchema = z.object({
	value: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).min(1, requiredMessage('資格名')),
})

export const userProfileCreateSchema = z.object({
	name: z
		.string({ invalid_type_error: invalidTypeMessage('文字列'), required_error: requiredMessage('氏名') })
		.min(1, requiredMessage('氏名'))
		.max(100, maxMessage('氏名', '100文字')),
	birthDate: z
		.string({ invalid_type_error: invalidTypeMessage('文字列'), required_error: requiredMessage('生年月日') })
		.min(1, requiredMessage('生年月日'))
		.regex(/^\d{4}-\d{2}-\d{2}$/, formatMessage('生年月日', 'YYYY-MM-DD'))
		.refine((val) => calcAge(val) >= 18, '18歳未満の方は登録できません')
		.refine((val) => calcAge(val) < 60, '60歳以上の方は登録できません'),
	gender: z.enum(['男性', '女性', 'その他'], {
		errorMap: (issue) => ({
			message: issue.code === 'invalid_enum_value' ? '性別の形式が正しくありません' : requiredMessage('性別'),
		}),
	}),
	profileImage: z
		.custom<{ type: string; size: number } | string | null | undefined>()
		.refine(
			(val) => !val || typeof val === 'string' || ['image/jpeg', 'image/png', 'image/webp'].includes((val as { type: string }).type),
			'対応していないファイル形式です',
		)
		.refine(
			(val) => !val || typeof val === 'string' || (val as { size: number }).size > 0,
			'ファイルが空です',
		)
		.refine(
			(val) => !val || typeof val === 'string' || (val as { size: number }).size <= 5 * 1024 * 1024,
			'ファイルサイズが上限を超えています',
		)
		.nullable()
		.optional(),
	phone: z
		.string({ invalid_type_error: invalidTypeMessage('文字列') })
		.regex(/^[^-]*$/, forbiddenCharsMessage('電話番号', 'ハイフン', '09012345678'))
		.regex(/^[0-9]*$/, allowedCharsMessage('電話番号', '半角数字'))
		.regex(/^(\d{10,11})?$/, digitsMessage('電話番号', '10〜11'))
		.optional(),
	email: z
		.string({ required_error: requiredMessage('メールアドレス'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(1, requiredMessage('メールアドレス'))
		.email(formatMessage('メールアドレス', 'メールアドレス')),
	password: z
		.string({ required_error: requiredMessage('パスワード'), invalid_type_error: invalidTypeMessage('文字列') })
		.min(1, requiredMessage('パスワード'))
		.min(8, minMessage('パスワード', '8文字'))
		.regex(/[A-Z]/, 'パスワードには大文字の英字を1文字以上含めてください')
		.regex(/[a-z]/, 'パスワードには小文字の英字を1文字以上含めてください')
		.regex(/[0-9]/, 'パスワードには数字を1文字以上含めてください'),
	postalCode: z
		.string({ invalid_type_error: invalidTypeMessage('文字列') })
		.regex(/^[^-]*$/, forbiddenCharsMessage('郵便番号', 'ハイフン', '1234567'))
		.regex(/^[0-9]*$/, allowedCharsMessage('郵便番号', '半角数字'))
		.regex(/^(\d{7})?$/, digitsMessage('郵便番号', 7))
		.optional(),
	prefecture: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).max(50, maxMessage('都道府県', '50文字')).optional(),
	city: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).max(100, maxMessage('市区町村', '100文字')).optional(),
	streetAddress: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).max(255, maxMessage('番地', '255文字')).optional(),
	building: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).max(255, maxMessage('建物名・部屋番号', '255文字')).optional(),
	workTypes: z.array(z.enum(WORK_TYPES)).optional(),
	qualifications: z.array(qualificationItemSchema).optional(),
	workHistories: z
		.array(workHistoryItemSchema, { required_error: '職歴を1件以上入力してください' })
		.min(1, '職歴を1件以上入力してください'),
	selfPR: z.string({ invalid_type_error: invalidTypeMessage('文字列') }).optional(),
	agreedToTerms: z
		.boolean({
			required_error: '利用規約・プライバシーポリシーへの同意が必要です',
			invalid_type_error: '利用規約・プライバシーポリシーへの同意が必要です',
		})
		.refine((val) => val === true, {
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

export const userProfileEditSchema = userProfileCreateSchema
	.omit({ password: true, agreedToTerms: true })
	.extend({
		phone: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.regex(/^[^-]*$/, forbiddenCharsMessage('電話番号', 'ハイフン', '09012345678'))
			.regex(/^[0-9]*$/, allowedCharsMessage('電話番号', '半角数字'))
			.regex(/^(\d{10,11})?$/, digitsMessage('電話番号', '10〜11'))
			.nullable()
			.optional(),
		postalCode: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.regex(/^[^-]*$/, forbiddenCharsMessage('郵便番号', 'ハイフン', '1234567'))
			.regex(/^[0-9]*$/, allowedCharsMessage('郵便番号', '半角数字'))
			.regex(/^(\d{7})?$/, digitsMessage('郵便番号', 7))
			.nullable()
			.optional(),
		prefecture: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.max(50, maxMessage('都道府県', '50文字'))
			.nullable()
			.optional(),
		city: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.max(100, maxMessage('市区町村', '100文字'))
			.nullable()
			.optional(),
		streetAddress: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.max(255, maxMessage('番地', '255文字'))
			.nullable()
			.optional(),
		building: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.max(255, maxMessage('建物名・部屋番号', '255文字'))
			.nullable()
			.optional(),
		selfPR: z
			.string({ invalid_type_error: invalidTypeMessage('文字列') })
			.nullable()
			.optional(),
		workTypes: z.array(z.enum(WORK_TYPES)).nullable().optional(),
		qualifications: z.array(qualificationItemSchema).nullable().optional(),
	})

export type UserProfileEditInput = z.infer<typeof userProfileEditSchema>
