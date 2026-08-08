export interface AnswerEditorProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function AnswerEditor({
  label = "Your answer",
  placeholder = "Type your response here...",
  value = "",
  onChange,
  disabled = false,
}: AnswerEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="min-h-36 w-full resize-y rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder}
      />
    </div>
  );
}
