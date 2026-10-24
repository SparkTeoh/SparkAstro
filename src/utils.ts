// 日期格式化（中文）
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
