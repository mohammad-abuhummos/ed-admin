import { useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  label: string;
  icon: string;
  command: string;
  value?: string;
}

const toolbarButtons: ToolbarButton[] = [
  { label: "Bold", icon: "B", command: "bold" },
  { label: "Italic", icon: "I", command: "italic" },
  { label: "Underline", icon: "U", command: "underline" },
  { label: "Bullet List", icon: "UL", command: "insertUnorderedList" },
  { label: "Numbered List", icon: "OL", command: "insertOrderedList" },
  { label: "Quote", icon: "\"", command: "formatBlock", value: "blockquote" },
  { label: "Heading", icon: "H2", command: "formatBlock", value: "h2" },
  { label: "Link", icon: "Link", command: "createLink" },
  { label: "Clear", icon: "Clear", command: "removeFormat" },
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    const safeValue = value || "";
    if (editorRef.current.innerHTML !== safeValue) {
      editorRef.current.innerHTML = safeValue;
    }
  }, [value]);

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const handleCommand = (command: string, commandValue?: string) => {
    if (typeof document === "undefined") return;

    if (command === "createLink") {
      const url = window.prompt("Enter the URL for the link");
      if (!url) return;
      document.execCommand(command, false, url);
    } else if (command === "formatBlock") {
      document.execCommand(command, false, commandValue || "p");
    } else {
      document.execCommand(command, false, commandValue ?? "");
    }

    editorRef.current?.focus();
    handleInput();
  };

  const isEmpty =
    !value ||
    value === "<p><br></p>" ||
    value === "<p></p>" ||
    value.replace(/<[^>]+>/g, "").trim().length === 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap gap-2 bg-gray-50 border-b border-gray-200 px-4 py-2">
        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => handleCommand(button.command, button.value)}
            className="px-2 py-1 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            title={button.label}
          >
            {button.icon}
          </button>
        ))}
      </div>

      <div className="relative">
        {placeholder && isEmpty && !isFocused && (
          <span className="pointer-events-none absolute left-4 top-3 text-gray-400">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          className="min-h-[200px] px-4 py-3 focus:outline-none text-gray-800 leading-relaxed"
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          aria-label="Rich text editor"
        />
      </div>
    </div>
  );
}


