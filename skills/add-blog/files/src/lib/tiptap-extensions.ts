import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

import { lowlight } from "~/lib/lowlight";

/**
 * 編輯器使用的 Tiptap extensions（client 端）。
 * 注意：前台 server 渲染請改用 ~/lib/render-article（只依賴 lowlight），
 * 不要從這裡匯入，否則會把整套 Tiptap / ProseMirror 帶進 Worker bundle。
 */
export const tiptapExtensions = [
	StarterKit.configure({ codeBlock: false }),
	CodeBlockLowlight.configure({ lowlight }),
	Image.configure({ inline: false, allowBase64: false }),
];
