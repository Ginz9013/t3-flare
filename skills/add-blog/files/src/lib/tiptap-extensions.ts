import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

import { lowlight } from "~/lib/lowlight";

/**
 * Tiptap extensions used by the editor (client side).
 * Note: for front-end server rendering use ~/lib/render-article instead (depends only on lowlight);
 * don't import from here, or the whole Tiptap / ProseMirror stack ends up in the Worker bundle.
 */
export const tiptapExtensions = [
	StarterKit.configure({ codeBlock: false }),
	CodeBlockLowlight.configure({ lowlight }),
	Image.configure({ inline: false, allowBase64: false }),
];
