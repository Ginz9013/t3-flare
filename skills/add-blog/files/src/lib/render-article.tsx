import { Fragment, type ReactNode } from "react";

import { lowlight } from "~/lib/lowlight";

/**
 * Render Tiptap ProseMirror JSON into React elements on the server.
 * Code blocks are syntax-highlighted on the server with lowlight, so the public
 * article page doesn't need to load any Tiptap / highlight.js client bundle.
 */

type PMMark = { type: string; attrs?: Record<string, unknown> };
type PMNode = {
	type: string;
	text?: string;
	marks?: PMMark[];
	attrs?: Record<string, unknown>;
	content?: PMNode[];
};

// ── hast (lowlight output) → React ──────────────────────────────
type HastNode =
	| { type: "text"; value: string }
	| {
			type: "element";
			tagName: string;
			properties?: { className?: string[] | string };
			children: HastNode[];
	  }
	| { type: "root"; children: HastNode[] };

function hastChildren(children: HastNode[]): ReactNode {
	return children.map((c, i) => (
		// biome-ignore lint/suspicious/noArrayIndexKey: syntax-highlight tree is static and never reordered
		<Fragment key={i}>{hastToReact(c, i)}</Fragment>
	));
}

function hastToReact(node: HastNode, key: number): ReactNode {
	if (node.type === "text") return node.value;
	if (node.type === "root") return hastChildren(node.children);
	const className = node.properties?.className;
	return (
		<span
			className={Array.isArray(className) ? className.join(" ") : className}
			key={key}
		>
			{hastChildren(node.children)}
		</span>
	);
}

function highlightCode(code: string, language?: string): ReactNode {
	if (language && lowlight.registered(language)) {
		const tree = lowlight.highlight(language, code) as HastNode;
		return hastToReact(tree, 0);
	}
	return code;
}

// ── mark wrapping ───────────────────────────────────────────────
function applyMarks(text: ReactNode, marks: PMMark[] | undefined, key: number) {
	if (!marks?.length) return text;
	return marks.reduce<ReactNode>((acc, mark) => {
		switch (mark.type) {
			case "bold":
				return <strong key={key}>{acc}</strong>;
			case "italic":
				return <em key={key}>{acc}</em>;
			case "strike":
				return <s key={key}>{acc}</s>;
			case "code":
				return (
					<code className="inline-code" key={key}>
						{acc}
					</code>
				);
			case "link": {
				const href = String(mark.attrs?.href ?? "#");
				return (
					<a
						href={href}
						key={key}
						rel="noopener noreferrer nofollow"
						target="_blank"
					>
						{acc}
					</a>
				);
			}
			default:
				return acc;
		}
	}, text);
}

// ── ProseMirror node → React ────────────────────────────────────
function renderNode(node: PMNode, key: number): ReactNode {
	const children = node.content?.map((c, i) => renderNode(c, i));

	switch (node.type) {
		case "doc":
			return <Fragment key={key}>{children}</Fragment>;
		case "paragraph":
			return <p key={key}>{children}</p>;
		case "heading": {
			const level = Number(node.attrs?.level ?? 2);
			const Tag = `h${Math.min(Math.max(level, 1), 6)}` as unknown as "h2";
			return <Tag key={key}>{children}</Tag>;
		}
		case "bulletList":
			return <ul key={key}>{children}</ul>;
		case "orderedList":
			return <ol key={key}>{children}</ol>;
		case "listItem":
			return <li key={key}>{children}</li>;
		case "blockquote":
			return <blockquote key={key}>{children}</blockquote>;
		case "horizontalRule":
			return <hr key={key} />;
		case "hardBreak":
			return <br key={key} />;
		case "codeBlock": {
			const language = node.attrs?.language as string | undefined;
			const code = node.content?.map((c) => c.text ?? "").join("") ?? "";
			return (
				<pre className="hljs" key={key}>
					<code className={language ? `language-${language}` : undefined}>
						{highlightCode(code, language)}
					</code>
				</pre>
			);
		}
		case "image":
			return (
				// biome-ignore lint/performance/noImgElement: body images vary in size and come from R2, so next/image doesn't apply
				<img
					alt={String(node.attrs?.alt ?? "")}
					key={key}
					loading="lazy"
					src={String(node.attrs?.src ?? "")}
				/>
			);
		case "text":
			return (
				<Fragment key={key}>
					{applyMarks(node.text ?? "", node.marks, key)}
				</Fragment>
			);
		default:
			return children ? <Fragment key={key}>{children}</Fragment> : null;
	}
}

export function RenderArticle({ content }: { content: unknown }) {
	if (!content || typeof content !== "object") return null;
	return <>{renderNode(content as PMNode, 0)}</>;
}
