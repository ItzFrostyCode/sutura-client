export type Block = { readonly p: string } | { readonly ul: readonly string[] };
export type Audience = 'all' | 'customers' | 'owners';

export interface LegalSectionData {
  /** Fixed number: it stays the same when other sections are hidden, so "section 7" always means the same thing. */
  readonly n: number;
  readonly title: string;
  readonly audience: Audience;
  readonly blocks: readonly Block[];
}
