import Link from "next/link";
import remarkGfm from "remark-gfm";

import { slugifyHeading } from "@/lib/docs";

/** Shared MDX renderers for docs and blog posts. */

/** GitHub-flavoured Markdown: tables, strikethrough, autolinks. */
export const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };

function text(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(text).join("");
  if (children && typeof children === "object" && "props" in children) {
    return text((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

export const mdxComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => <h2 id={slugifyHeading(text(children))}>{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 id={slugifyHeading(text(children))}>{children}</h3>,
  pre: ({ children }: { children?: React.ReactNode }) => {
    const child = children as { props?: { className?: string; children?: string } } | undefined;
    const lang = /language-(\w+)/.exec(child?.props?.className ?? "")?.[1] ?? "text";
    const code = String(child?.props?.children ?? "").replace(/\n$/, "");
    return (
      <div className="f-term f-docs__code">
        <div className="f-term__bar">
          <span>{lang === "bash" ? "terminal" : lang}</span>
        </div>
        <pre className="f-term__body" style={{ margin: 0, minHeight: 0 }} tabIndex={0}>
          <code>{code}</code>
        </pre>
      </div>
    );
  },
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="f-tablewrap">
      <table className="f-table">{children}</table>
    </div>
  ),
  a: ({ href = "", children }: { href?: string; children?: React.ReactNode }) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener">
        {children}
      </a>
    ),
  Note: ({ children }: { children?: React.ReactNode }) => (
    <aside className="f-callout">
      <p className="f-callout__t">Note</p>
      <div>{children}</div>
    </aside>
  ),
  Warning: ({ children }: { children?: React.ReactNode }) => (
    <aside className="f-callout f-callout--warn">
      <p className="f-callout__t">Important</p>
      <div>{children}</div>
    </aside>
  ),
};
