// A guide / chart image shown whole, at its own proportions, at every width:
// full width on phones, capped and centered on tablet and desktop so a big
// chart never stretches across the page. A fixed-height crop used to cut off
// the edges of size charts and measuring diagrams.
export default function GuideImage({ src, alt }: Readonly<{ src: string; alt: string }>) {
  return (
    <div className="w-full border border-line bg-canvas flex justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="block w-full h-auto max-h-[70vh] object-contain md:max-w-3xl" />
    </div>
  );
}
