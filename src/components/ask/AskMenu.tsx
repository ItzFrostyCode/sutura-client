import { BACK, type AskOption } from './askQuestions';

interface AskMenuProps {
  readonly options: AskOption[];
  /** Sub-menus get "0 · Back to the main menu". */
  readonly withBack: boolean;
  readonly disabled: boolean;
  readonly onChoose: (optionId: string) => void;
}

const button = 'flex min-h-11 w-full items-center gap-3 border border-line bg-surface px-3 py-2 text-left text-[15px] text-ink transition-colors hover:border-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';
const number = 'flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-sm font-semibold text-white';

/** The numbered choices — the only way to ask, so every question has an answer. */
export default function AskMenu({ options, withBack, disabled, onChoose }: AskMenuProps) {
  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted">Choose a number:</p>
      <ol className="grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <li key={o.id}>
            <button type="button" disabled={disabled} onClick={() => onChoose(o.id)} className={button}>
              <span className={number} aria-hidden="true">{i + 1}</span>
              {o.label}
            </button>
          </li>
        ))}
        {withBack && (
          <li>
            <button type="button" disabled={disabled} onClick={() => onChoose(BACK.id)} className={button}>
              <span className={`${number} bg-sunken text-ink`} aria-hidden="true">0</span>
              {BACK.label}
            </button>
          </li>
        )}
      </ol>
    </div>
  );
}
