'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, INPUT, Optional, SectionLabel, StepIntro, TEXTAREA, Tip, peso } from './orderUi';
import OrderDesignPicker from './OrderDesignPicker';
import OrderPhotoPicker from './OrderPhotoPicker';
import { autoAnswers, fabricSuggestions } from './orderQuestions';
import OrderShopQuestions, { type ShopQuestion } from './OrderShopQuestions';

/** Step 4 — the design to follow, your own references, the fabric, the shop's questions, and last, your notes. */
export default function OrderStyleStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const fabricOff = Number(o.service?.own_fabric_deduction ?? 0) || 0;
  const allQuestions = ((o.service?.custom_fields ?? []) as unknown as ShopQuestion[]).filter((q) => q.label?.trim());
  // Questions the order already answers (team name, names, size count, fabric) are filled in, not asked again.
  const auto = autoAnswers(f, allQuestions, o.answerContext);
  const answered = allQuestions.filter((q) => auto[q.label.trim()]);
  const questions = allQuestions.filter((q) => !auto[q.label.trim()]);
  const fabricChoices = fabricSuggestions(o.pricing.map((p) => p.label));
  const design = o.data.designs.find((d) => d.id === f.designId);

  return (
    <div className="space-y-8">
      <StepIntro title="Style" text="Show the shop what you want it to look like." />

      <OrderDesignPicker designs={o.data.designs} value={f.designId} onChange={f.setDesignId} />

      <div className="space-y-5">
        <div>
          <SectionLabel as="p" hint={design ? `Want something different from "${design.name}"? Upload a photo that shows it.` : 'Upload a photo of the style you want, like a sample shirt, your old uniform or your logo.'}>
            {design ? 'Your own reference' : 'Reference photos'}<Optional />
          </SectionLabel>
          <OrderPhotoPicker storeId={o.storeId} photos={f.photos} onChange={f.setPhotos} alt="Reference photo" />
        </div>
        <div>
          <SectionLabel htmlFor="order-link" hint="Paste a link to a photo or post of the style you like (Facebook, Pinterest, Shopee…).">Reference link<Optional /></SectionLabel>
          <input id="order-link" type="url" inputMode="url" maxLength={500} value={f.link} onChange={(e) => f.setLink(e.target.value)} placeholder="https://" className={INPUT} />
        </div>
      </div>

      <fieldset>
        <SectionLabel as="legend">Fabric</SectionLabel>
        <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Fabric">
          <ChoiceCard selected={f.material === 'shop'} onSelect={() => f.setMaterial('shop')} label="Use the shop's fabric" detail="Included in the price." />
          <ChoiceCard selected={f.material === 'own'} onSelect={() => f.setMaterial('own')} label="I'll bring my own fabric"
            detail={fabricOff > 0 ? `${peso(fabricOff)} off per piece.` : 'Drop it off at the shop.'} trailing={fabricOff > 0 ? `−${peso(fabricOff)}` : undefined} />
        </div>
        {f.material === 'own' && (
          <div className="mt-4 space-y-4">
            <div>
              <SectionLabel htmlFor="order-fabric" hint="Type, color and how many meters.">About your fabric<Optional /></SectionLabel>
              <input id="order-fabric" type="text" maxLength={500} value={f.materialNote} onChange={(e) => f.setMaterialNote(e.target.value)} placeholder="e.g. navy blue cotton, 3 meters" className={INPUT} />
            </div>
            <Tip>Bring the fabric to the shop within 2 days after the shop accepts your order. Work starts once it arrives.</Tip>
          </div>
        )}
      </fieldset>

      {(questions.length > 0 || answered.length > 0) && (
        <div>
          <SectionLabel as="p">Questions from the shop</SectionLabel>
          {questions.length > 0 && <OrderShopQuestions questions={questions} answers={f.answers} setAnswers={f.setAnswers} fabricChoices={fabricChoices} />}
          {answered.length > 0 && (
            <div className="mt-4 space-y-1 rounded-xl bg-sunken px-4 py-3">
              <p className="mobile-caption text-ink-muted">Already answered by your order</p>
              {answered.map((q) => (
                <p key={q.label} className="mobile-body-sm break-words text-ink"><span className="text-ink-muted">{q.label}:</span> {auto[q.label.trim()]}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <SectionLabel htmlFor="order-notes" hint="Anything the shop should know, like name spellings, logo placement or sleeve length.">Notes for the shop<Optional /></SectionLabel>
        <textarea id="order-notes" rows={4} maxLength={2000} value={f.notes} onChange={(e) => f.setNotes(e.target.value)} className={TEXTAREA} />
        <p className="mobile-caption mt-1 text-right tabular-nums text-ink-faint">{f.notes.length} / 2000</p>
      </div>
    </div>
  );
}
