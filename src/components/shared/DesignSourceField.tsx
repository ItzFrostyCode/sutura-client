import RadioRows from './RadioRows';
import { CUSTOMER_DESIGN_SOURCES, DESIGN_SOURCES, type DesignSource } from '@/lib/designSource';

interface Props {
  readonly source: DesignSource | null | undefined;
  readonly link: string | null | undefined;
  readonly onChange: (next: { design_source: DesignSource | null; design_link: string | null }) => void;
  readonly disabled?: boolean;
  /** Worded for the shop (default) or for the customer who is booking. */
  readonly audience?: 'shop' | 'customer';
  /** Choices left out (the shop's own design is chosen as a design, not here). */
  readonly exclude?: DesignSource[];
  /** Leave out the question line above the choices. */
  readonly legend?: string | null;
}

/** Where the design comes from. A customer’s own design also takes a link to their file. */
export default function DesignSourceField({ source, link, onChange, disabled, audience = 'shop', exclude = [], legend = 'Where does the design come from?' }: Props) {
  const needsFile = source === 'customer_ready' || source === 'customer_redo';
  return (
    <fieldset>
      {legend && <legend className="mb-1.5 block text-sm font-medium text-espresso">{legend}</legend>}
      <RadioRows
        label="Where the design comes from" value={source} disabled={disabled}
        options={(audience === 'customer' ? CUSTOMER_DESIGN_SOURCES : DESIGN_SOURCES).filter((d) => !exclude.includes(d.id)).map((d) => ({ value: d.id, title: d.label, hint: d.hint }))}
        onChange={(id) => onChange({ design_source: id, design_link: id === 'customer_ready' || id === 'customer_redo' ? link ?? null : null })}
      />
      {needsFile && (
        <input
          type="url" inputMode="url" disabled={disabled} value={link ?? ''} maxLength={1000}
          onChange={(e) => onChange({ design_source: source ?? null, design_link: e.target.value || null })}
          placeholder="Link to their file (Google Drive, Facebook, etc.)"
          className="mt-2 h-12 w-full rounded-md border border-espresso/25 bg-white px-3 text-base text-espresso focus:outline-none focus:ring-2 focus:ring-espresso/25 sm:text-sm"
        />
      )}
    </fieldset>
  );
}
