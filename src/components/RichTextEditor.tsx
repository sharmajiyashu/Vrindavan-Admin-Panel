"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ListKit } from "@tiptap/extension-list";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Fragment, type Node } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

const enterExitsEmptyListKey = new PluginKey("enterExitsEmptyListItem");

/** Word-like: Enter in empty list item exits list and starts a paragraph (bullet + ordered). */
const EnterExitsEmptyListItem = Extension.create({
  name: "enterExitsEmptyListItem",
  priority: 1100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: enterExitsEmptyListKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== "Enter") return false;
            const { state } = view;
            const { $from } = state.selection;
            const paragraph = $from.parent;
            if (paragraph.content.size > 0) return false;
            let listItemDepth: number | null = null;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === "listItem") {
                listItemDepth = d;
                break;
              }
            }
            if (listItemDepth == null) return false;
            const listDepth = listItemDepth - 1;
            const listNode = $from.node(listDepth);
            if (listNode.type.name !== "bulletList" && listNode.type.name !== "orderedList") return false;
            const listStart = $from.before(listDepth);
            const listEnd = $from.after(listDepth);
            const itemStart = $from.before(listItemDepth);
            const itemEnd = $from.after(listItemDepth);
            const listType = listNode.type;
            const schema = state.schema;
            const nodes: Node[] = [];
            if (itemStart > listStart + 1) {
              const beforeSlice = state.doc.slice(listStart + 1, itemStart);
              nodes.push(listType.create(listNode.attrs, beforeSlice.content));
            }
            const paragraphNode = schema.nodes.paragraph?.create();
            if (!paragraphNode) return false;
            nodes.push(paragraphNode);
            if (itemEnd < listEnd - 1) {
              const afterSlice = state.doc.slice(itemEnd, listEnd - 1);
              const itemsBeforeCount = itemStart > listStart + 1 ? state.doc.slice(listStart + 1, itemStart).content.childCount : 0;
              const afterAttrs = listNode.type.name === "orderedList"
                ? { ...listNode.attrs, start: (listNode.attrs.start ?? 1) + itemsBeforeCount + 1 }
                : listNode.attrs;
              nodes.push(listType.create(afterAttrs, afterSlice.content));
            }
            const fragment = Fragment.from(nodes);
            const tr = state.tr.replaceWith(listStart, listEnd, fragment);
            const firstNodeSize = nodes[0]?.nodeSize ?? 0;
            const paraPos = listStart + firstNodeSize;
            tr.setSelection(TextSelection.create(tr.doc, paraPos + 1));
            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});

/** Normalize plain text to HTML so existing notes and empty content work. */
function toEditorHtml(s: string): string {
  if (!s || s.trim() === "") return "<p></p>";
  if (s.trim().startsWith("<")) return s;
  return (
    "<p>" +
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>") +
    "</p>"
  );
}

/** Build default SOAP note HTML. Pass a translator e.g. (key) => t(key). */
export function getDefaultSoapNoteContent(
  t: (key: string) => string
): string {
  const sub = t("patientManage.soapSubjective");
  const obj = t("patientManage.soapObjective");
  const ass = t("patientManage.soapAssessment");
  const plan = t("patientManage.soapPlan");
  return [
    `<p><strong>${escapeHtml(sub)}:</strong></p><p><br></p>`,
    `<p><strong>${escapeHtml(obj)}:</strong></p><p><br></p>`,
    `<p><strong>${escapeHtml(ass)}:</strong></p><p><br></p>`,
    `<p><strong>${escapeHtml(plan)}:</strong></p><p><br></p>`,
  ].join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  /** When this key changes, the editor remounts with the new value (e.g. when opening create vs edit). */
  editorKey?: string;
}

/* Word-like alignment via .patient-note-content in globals.css; minimal utilities here so CSS wins */
const EDITOR_CLASS =
  "patient-note-content prose prose-sm max-w-none min-h-[inherit] px-3 py-2.5 text-sm focus:outline-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic";

function ToolbarButton({
  active,
  onClick,
  onMouseDown,
  title,
  disabled,
  children,
  "aria-label": ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  title: string;
  disabled: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      title={title}
      disabled={disabled}
      aria-label={ariaLabel ?? title}
      aria-pressed={active}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown?.(e);
      }}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded p-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  disabled = false,
  minHeight = "8rem",
  editorKey = "default",
}: RichTextEditorProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          code: false,
          codeBlock: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
        }),
        EnterExitsEmptyListItem,
        ListKit.configure({
          taskItem: false,
          taskList: false,
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
          emptyNodeClass: "is-node-empty",
        }),
      ],
      content: toEditorHtml(value),
      editable: !disabled,
      editorProps: {
        attributes: {
          class: EDITOR_CLASS,
          "data-placeholder": placeholder,
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    },
    [editorKey]
  );

  React.useEffect(() => {
    if (editor == null) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const [activeFormats, setActiveFormats] = React.useState({
    bold: false,
    italic: false,
    strike: false,
    h2: false,
    h3: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
  });

  React.useEffect(() => {
    if (editor == null) return;
    const sync = () => {
      setActiveFormats({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        strike: editor.isActive("strike"),
        h2: editor.isActive("heading", { level: 2 }),
        h3: editor.isActive("heading", { level: 3 }),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        blockquote: editor.isActive("blockquote"),
      });
    };
    sync();
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);
    editor.on("update", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("transaction", sync);
      editor.off("update", sync);
    };
  }, [editor]);

  if (editor == null) {
    return (
      <div
        className="w-full rounded-lg border border-input bg-background"
        style={{ minHeight }}
      >
        <p className="text-muted-foreground px-3 py-2.5 text-sm">
          {placeholder}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rich-text-editor flex w-full flex-col overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      style={{ minHeight, maxHeight: "min(70vh, 600px)" }}
    >
      <div
        className="shrink-0 flex flex-wrap items-center gap-0.5 border-b border-border bg-muted px-2 py-1.5"
        role="toolbar"
        aria-label="Formatting"
      >
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            active={activeFormats.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
            disabled={disabled}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            active={activeFormats.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
            disabled={disabled}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            active={activeFormats.strike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
            disabled={disabled}
          >
            <s>S</s>
          </ToolbarButton>
          </div>
        <ToolbarDivider />
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            active={activeFormats.h2}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            title="Heading 2"
            disabled={disabled}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            active={activeFormats.h3}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            title="Heading 3"
            disabled={disabled}
          >
            H3
          </ToolbarButton>
        </div>
        <ToolbarDivider />
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            active={activeFormats.bulletList}
            onClick={() => {
              const view = (editor as unknown as { view?: { dom?: HTMLElement } }).view;
              if (view?.dom?.focus) view.dom.focus();
              editor.chain().focus().toggleBulletList().run();
            }}
            title="Bullet list"
            disabled={disabled}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            active={activeFormats.orderedList}
            onClick={() => {
              const view = (editor as unknown as { view?: { dom?: HTMLElement } }).view;
              if (view?.dom?.focus) view.dom.focus();
              editor.chain().focus().toggleOrderedList().run();
            }}
            title="Numbered list"
            disabled={disabled}
          >
            1. List
          </ToolbarButton>
        </div>
        <ToolbarDivider />
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            active={activeFormats.blockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
            disabled={disabled}
          >
            “
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal line"
            disabled={disabled}
          >
            —
          </ToolbarButton>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto [&_.is-editor-empty::before]:pointer-events-none [&_.is-editor-empty::before]:float-left [&_.is-editor-empty::before]:h-0 [&_.is-editor-empty::before]:content-[attr(data-placeholder)] [&_.is-editor-empty::before]:text-muted-foreground">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
