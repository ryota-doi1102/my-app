export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('ja-JP')

export const calcTotalPages = (total: number, perPage: number): number =>
  Math.ceil(total / perPage)
