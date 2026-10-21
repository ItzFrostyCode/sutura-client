/** One part of a split order, as the server's group summary lists it. Amounts are missing for people who may not see money. */
export interface BatchOrderRow {
  id: number;
  order_number: string;
  batch_no: number;
  status: string;
  paid_by_name?: string | null;
  people: number;
  service_name?: string | null;
  total_amount?: number;
  discount_amount?: number;
  paid?: number;
  balance?: number;
}

/** The group a split order belongs to, with the overall figures worked out from its parts. */
export interface BatchSummary {
  /** 'batch' = the same design split by who pays; 'set' = different services asked for at the same visit. */
  kind?: 'batch' | 'set';
  root_id: number;
  count: number;
  this_batch: number;
  orders: BatchOrderRow[];
  totals: { total: number; discount: number; grand_total: number; paid: number; balance: number } | null;
}
