import { PRESET_QUESTIONS } from '../lib/prompt';

interface Props {
  disabled?: boolean;
  onPick: (question: string) => void;
}

export default function PresetQuestions({ disabled, onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_QUESTIONS.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p.question)}
          className="rounded-full border border-zhu-300/70 dark:border-zhu-700/60 bg-zhu-50/60 dark:bg-zhu-900/30 px-2.5 py-1 text-xs text-zhu-700 dark:text-zhu-200 hover:bg-zhu-100 dark:hover:bg-zhu-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
