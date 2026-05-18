export const invalidTypeMessage = (type: string) => `入力された値が${type}形式ではありません`
export const requiredMessage = (field: string) => `${field}は必須項目です`
export const maxMessage = (field: string, max: number | string) => `${field}は${max}以下で入力してください`
export const minMessage = (field: string, min: number | string) => `${field}は${min}以上で入力してください`
export const formatMessage = (field: string, format: string) => `${field}は${format}形式で入力してください`
export const allowedCharsMessage = (field: string, chars: string) => `${field}は${chars}で入力してください`
export const forbiddenCharsMessage = (field: string, chars: string, example?: string) =>
	example ? `${field}に${chars}は使用できません（例: ${example}）` : `${field}に${chars}は使用できません`
export const digitsMessage = (field: string, digits: number | string) => `${field}は${digits}桁で入力してください`
