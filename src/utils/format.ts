/** ja-JP の日付フォーマット（例: 2025年12月15日） */
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
