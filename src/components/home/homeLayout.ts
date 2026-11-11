/**
 * The landing page's one column, shared by the location bar, every section and the footer so their edges (and the
 * section titles) line up exactly with the Featured Shop card, which is a full 960px.
 *
 * Side margins follow AGENTS.md: 16px to 480px, 24px to 599px, 32px to 767px, 48px to 1023px; from 1024px the column is
 * exactly 960px with no padding. Plain Tailwind on purpose: `.mobile-screen-margins` adds 32px from 1024px and, being
 * unlayered CSS, beats `lg:px-0` — that is what made the sections 64px narrower than Featured.
 */
export const HOME_GUTTER = 'px-4 min-[481px]:px-6 min-[600px]:px-8 md:px-12 lg:px-0';
export const HOME_COLUMN = `mx-auto w-full max-w-[960px] ${HOME_GUTTER}`;
