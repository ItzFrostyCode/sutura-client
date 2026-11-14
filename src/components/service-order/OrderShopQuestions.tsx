'use client';

import React from 'react';
import { INPUT } from './orderUi';
import { NOT_SURE, isFabricQuestion } from './orderQuestions';

export interface ShopQuestion {
  id?: string | number;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[] | null;
}

function Chip({ on, onClick, children }: Readonly<{ on: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`h-10 max-w-full truncate rounded-full border px-4 text-sm font-medium transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-line-strong'}`}>
      {children}
    </button>
  );
}

/**
 * The shop's questions in the online order. A pick-one question is a list to choose from; a typed question gets
 * choices to tap when the order can suggest some (a fabric question offers the fabrics the shop's options name), and
 * always "Not sure — please suggest one", so a customer is never stuck on a question they cannot answer.
 */
export default function OrderShopQuestions({ questions, answers, setAnswers, fabricChoices }: Readonly<{
  questions: ShopQuestion[]; answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>; fabricChoices: string[];
}>) {
  const set = (label: string, v: string) => setAnswers((prev) => ({ ...prev, [label]: v }));

  return (
    <div className="space-y-6">
      {questions.map((q, i) => {
        const key = q.id != null && q.id !== '' ? String(q.id) : `q${i}-${q.label}`;
        const id = `shop-q-${i}`;
        const value = answers[q.label] ?? '';
        const label = (
          <label htmlFor={id} className="mb-1.5 block text-base font-medium text-ink">
            {q.label}{q.required ? <span className="text-rose-700"> *</span> : <span className="font-normal text-ink-faint"> (optional)</span>}
          </label>
        );

        if (q.type === 'checkbox') {
          return (
            <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input id={id} type="checkbox" checked={value === 'Yes'} onChange={(e) => set(q.label, e.target.checked ? 'Yes' : 'No')} className="h-5 w-5 accent-[#2b2420]" />
              <span className="text-base text-ink">{q.label}</span>
            </label>
          );
        }
        if ((q.type === 'select' || q.type === 'radio') && (q.options?.length ?? 0) > 0) {
          return (
            <div key={key}>
              {label}
              <select id={id} value={value} onChange={(e) => set(q.label, e.target.value)} className={INPUT}>
                <option value="">Choose</option>
                {q.options!.map((o, oi) => <option key={`${oi}-${o}`} value={o}>{o}</option>)}
              </select>
            </div>
          );
        }

        const choices = isFabricQuestion(q.label) ? fabricChoices : [];
        return (
          <div key={key}>
            {label}
            <input id={id} type={q.type === 'number' ? 'number' : 'text'} inputMode={q.type === 'number' ? 'decimal' : undefined}
              value={value} onChange={(e) => set(q.label, e.target.value)} className={INPUT}
              placeholder={choices.length ? `e.g. ${choices.slice(0, 2).join(' or ')}` : 'Type your answer'} />
            <div className="mt-2 flex flex-wrap gap-2">
              {choices.map((c) => <Chip key={c} on={value === c} onClick={() => set(q.label, value === c ? '' : c)}>{c}</Chip>)}
              <Chip on={value === NOT_SURE} onClick={() => set(q.label, value === NOT_SURE ? '' : NOT_SURE)}>Not sure — let the shop suggest</Chip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
