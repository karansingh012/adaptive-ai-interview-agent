export interface AnswerEditorProps {
  label?: string;
  placeholder?: string;
}

export function AnswerEditor({ label = "Your answer", placeholder = "Type your response here..." }: AnswerEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        className="min-h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={placeholder}
      />
    </div>
  );
}
