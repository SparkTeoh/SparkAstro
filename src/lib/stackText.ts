// 清单文案的排版约定：YAML 里照常写成一段文字，网页按下面的记号自动拆开。
//   「正文【小标题】：正文」        → 小标题单独一行，后面的正文另起一段
//   「引言——1. 甲；2. 乙；3. 丙。」 → 编号列表
//   「名称（说明）」                → 名称加粗，说明用次要文字
// 记号对不上时原样显示整段文字，不会报错。

export interface LabeledPart {
  label?: string;
  text: string;
}

/** 按「【小标题】：」拆段。没有记号时返回一段、不带 label。 */
export function splitLabeled(text: string): LabeledPart[] {
  const parts: LabeledPart[] = [];
  let last = 0;
  let label: string | undefined;
  for (const m of text.matchAll(/【([^【】]{2,40})】[：:]\s*/g)) {
    const chunk = text.slice(last, m.index).trim();
    if (chunk || label) parts.push({ label, text: chunk });
    label = m[1];
    last = m.index! + m[0].length;
  }
  const tail = text.slice(last).trim();
  if (tail || label) parts.push({ label, text: tail });
  return parts;
}

/** 按「1. …；2. …」拆成引言 + 列表。编号必须从 1 连续往上，不到两项就不拆。 */
export function splitNumbered(text: string): { lead: string; items: string[] } {
  const starts: number[] = [];
  let from = 0;
  for (let n = 1; ; n++) {
    const re = new RegExp(`(^|[；;。，,—\\s])${n}\\.\\s`, "g");
    re.lastIndex = from;
    const m = re.exec(text);
    if (!m) break;
    const at = m.index + m[1].length;
    starts.push(at);
    from = at + String(n).length + 1;
  }
  if (starts.length < 2) return { lead: text, items: [] };
  return {
    lead: text.slice(0, starts[0]).replace(/[—–：:，,\s]+$/, ""),
    items: starts.map((s, i) =>
      text
        .slice(s, starts[i + 1] ?? text.length)
        .replace(/^\d+\.\s*/, "")
        .replace(/[；;。\s]+$/, ""),
    ),
  };
}

/** 「名称（说明）」→ 名称 + 说明。括号不成对或不在结尾时不拆。 */
export function splitNameNote(text: string): { name?: string; note: string } {
  const m = text.match(/^([^（(]+)[（(]([\s\S]+)[）)]$/);
  if (!m) return { note: text };
  const note = m[2].trim();
  const opens = (note.match(/[（(]/g) ?? []).length;
  const closes = (note.match(/[）)]/g) ?? []).length;
  return opens === closes ? { name: m[1].trim(), note } : { note: text };
}
