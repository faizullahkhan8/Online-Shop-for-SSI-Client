import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, $getSelection, $isRangeSelection, $createParagraphNode, $getNodeByKey } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode } from "@lexical/rich-text";
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

// The Toolbar Plugin
function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();

    const formatHeading = (headingSize) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(headingSize));
            }
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Bold"><Bold size={16} /></button>
            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Italic"><Italic size={16} /></button>
            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Underline"><Underline size={16} /></button>
            
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            <button type="button" onClick={() => formatHeading('h1')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Heading 1"><Heading1 size={16} /></button>
            <button type="button" onClick={() => formatHeading('h2')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Heading 2"><Heading2 size={16} /></button>
            
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            <button type="button" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Bullet List"><List size={16} /></button>
            <button type="button" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Numbered List"><ListOrdered size={16} /></button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Align Left"><AlignLeft size={16} /></button>
            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Align Center"><AlignCenter size={16} /></button>
            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Align Right"><AlignRight size={16} /></button>
            <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors" title="Justify"><AlignJustify size={16} /></button>
        </div>
    );
}

// Emits HTML and JSON back to parent
function OnChangePlugin({ onChange }) {
    const [editor] = useLexicalComposerContext();
    
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const html = $generateHtmlFromNodes(editor, null);
                const json = JSON.stringify(editorState.toJSON());
                onChange({ html, json });
            });
        });
    }, [editor, onChange]);
    return null;
}

// Used to load initial JSON state or HTML
function InitialStatePlugin({ initialJson, initialHtml }) {
    const [editor] = useLexicalComposerContext();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (isInitialized) return;
        
        if (initialJson) {
            try {
                const parsedState = editor.parseEditorState(initialJson);
                editor.setEditorState(parsedState);
            } catch (e) {
                console.error("Failed to parse Lexical state:", e);
            }
        } else if (initialHtml) {
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(initialHtml, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.insertNodes(nodes);
                } else {
                    const paragraph = $createParagraphNode();
                    paragraph.append(...nodes);
                    const root = $getNodeByKey("root");
                    if (root) {
                        root.clear();
                        root.append(paragraph);
                    }
                }
            });
        }
        setIsInitialized(true);
    }, [editor, initialJson, initialHtml, isInitialized]);

    return null;
}

const theme = {
    ltr: "ltr",
    rtl: "rtl",
    placeholder: "text-gray-400 absolute top-3 left-4 pointer-events-none",
    paragraph: "mb-2",
    quote: "border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-700 italic",
    heading: {
        h1: "text-2xl font-bold mt-4 mb-2",
        h2: "text-xl font-bold mt-3 mb-2",
        h3: "text-lg font-bold mt-3 mb-2",
    },
    list: {
        ul: "list-disc ml-5 mb-2",
        ol: "list-decimal ml-5 mb-2",
        listitem: "ml-1",
    },
    text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        underlineStrikethrough: "underline line-through",
        code: "bg-gray-100 rounded px-1 py-0.5 font-mono text-sm",
    },
};

export default function LexicalEditor({ initialHtml, initialJson, onChange, placeholder = "Enter details..." }) {
    const initialConfig = {
        namespace: "ProductEditor",
        theme,
        onError: (error) => console.error(error),
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            AutoLinkNode,
            LinkNode
        ],
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
            <LexicalComposer initialConfig={initialConfig}>
                <ToolbarPlugin />
                <div className="relative min-h-[150px] cursor-text bg-white">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="outline-none p-4 min-h-[150px] text-sm text-gray-800" />}
                        placeholder={<div className={theme.placeholder}>{placeholder}</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={onChange} />
                    <InitialStatePlugin initialHtml={initialHtml} initialJson={initialJson} />
                </div>
            </LexicalComposer>
        </div>
    );
}
