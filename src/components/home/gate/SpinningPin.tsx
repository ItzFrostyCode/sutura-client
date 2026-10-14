import SuturaMark from '@/components/brand/SuturaMark';

// A real 3D map pin: a front and a back face with the SUTURA mark, and thin copies of the outline stacked between
// them so the pin shows its thickness as it turns. All drawn in code (no picture), coloured from the theme tokens.
const PIN = 'M32 78C24 66 6 50 6 30a26 26 0 1 1 52 0c0 20-18 36-26 48Z';
const DEPTH_PX = 10;
const EDGE_LAYERS = 9;

function Face({ back = false }: Readonly<{ back?: boolean }>) {
  return (
    <svg
      viewBox="0 0 64 80"
      className="sutura-pin-layer sutura-pin-face"
      style={{ transform: back ? `translateZ(${-DEPTH_PX / 2}px) rotateY(180deg)` : `translateZ(${DEPTH_PX / 2}px)` }}
      aria-hidden
    >
      {/* Colours as styles: CSS variables are not read in SVG attributes everywhere. */}
      <path d={PIN} style={{ fill: 'var(--brand-taupe)' }} />
      <path d={PIN} fill="none" style={{ stroke: 'var(--nav-bar)' }} strokeWidth="3" />
      <circle cx="32" cy="30" r="18" style={{ fill: 'var(--background)' }} />
      <SuturaMark x="16" y="14" width="32" height="32" detail="small" />
    </svg>
  );
}

/** The spinning SUTURA pin shown while the landing page finds the visitor. Holds still for reduced motion. */
export default function SpinningPin() {
  const step = DEPTH_PX / (EDGE_LAYERS + 1);
  return (
    <div className="sutura-pin-stage" aria-hidden>
      <div className="sutura-pin-bob">
        <div className="sutura-pin-spin">
          <Face />
          {Array.from({ length: EDGE_LAYERS }, (_, i) => (
            <svg
              key={i}
              viewBox="0 0 64 80"
              className="sutura-pin-layer"
              style={{ transform: `translateZ(${DEPTH_PX / 2 - step * (i + 1)}px)` }}
            >
              <path d={PIN} style={{ fill: 'var(--nav-bar)' }} />
            </svg>
          ))}
          <Face back />
        </div>
      </div>
      <div className="sutura-pin-shadow" />
    </div>
  );
}
