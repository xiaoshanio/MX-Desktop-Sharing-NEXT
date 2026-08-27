import { Fragment, type ReactNode } from "react";

/**
 * 把一小段行内标记渲染成元素：`**粗**`、`*斜*`、`` `等宽` ``、以及换行 `\n`。
 *
 * 为什么需要它：首页和房间里有几十段带 `<code>` / `<strong>` 的文案。如果把它们
 * 留成 JSX，每加一种语言就要复制一份 JSX 结构 —— 结构和文案绑死，翻译的人得改代码，
 * 而且七份结构会各自漂移。改成「文案里带标记 + 一个解析器」之后，语言文件里就只有字符串。
 *
 * 刻意只支持这四种：不是要做 Markdown，是要覆盖界面文案里真实用到的那几种强调。
 */

const TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\n/g;

export interface RichTextProps {
  text: string;
  /** 给 `<code>` 的类名 —— 首页正文里的行内代码用 `mx-code`，其余用裸 `<code>`。 */
  codeClassName?: string;
}

export function RichText({ text, codeClassName }: RichTextProps): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  TOKEN.lastIndex = 0;
  for (let match = TOKEN.exec(text); match !== null; match = TOKEN.exec(text)) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    const [whole, code, bold, italic] = match;
    if (code !== undefined) {
      nodes.push(
        <code key={key++} className={codeClassName}>
          {code}
        </code>,
      );
    } else if (bold !== undefined) {
      nodes.push(<strong key={key++}>{bold}</strong>);
    } else if (italic !== undefined) {
      nodes.push(<em key={key++}>{italic}</em>);
    } else if (whole === "\n") {
      nodes.push(<br key={key++} />);
    }

    cursor = match.index + whole.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  // 没有任何标记时直接返回字符串，省掉一层 Fragment
  if (nodes.length === 1 && typeof nodes[0] === "string") return nodes[0];

  return <Fragment>{nodes}</Fragment>;
}
