import type { LegalSectionData } from './legalTypes';

export const PRIVACY_UPDATED = 'November 2, 2026';

export const PRIVACY_INTRO = 'This explains what personal information SUTURA collects, why, who can see it, and the choices you have. It follows the Data Privacy Act of 2012 (Republic Act No. 10173). The Terms of Service explain the rest.';

export const PRIVACY: readonly LegalSectionData[] = [
  { n: 1, title: 'What we collect', audience: 'all', blocks: [{ ul: [
    'Account details: your name, email, phone number, gender and password (stored only as a hash).',
    'For customers: your measurements, orders, appointments, payment proofs you send to a shop, reviews and saved shops.',
    'For shop owners: your birth date, a government ID, the DTI registration, TIN ID, barangay clearance, any business permits, a photo and the pinned location of your shop, and the receipt of your plan payment.',
    'Basic technical records, such as when you signed in, to keep accounts safe.',
  ] }] },
  { n: 2, title: 'Why we use it', audience: 'all', blocks: [{ ul: [
    'To create your account, sign you in and send the emails and notifications you need, such as confirming your email.',
    'To run bookings and orders between customers and shops, and to show order progress.',
    'To verify shops before they are listed, and to check plan payments.',
    'To keep SUTURA secure and to fix problems.',
  ] }] },
  { n: 3, title: 'Who can see it', audience: 'all', blocks: [{ ul: [
    'A shop sees the customers who book or order from it, with the measurements and records needed for that work. Shop staff see only what their role needs.',
    'The SUTURA team reviews the documents shop owners submit, and can see account and shop records to run the platform.',
    'Public pages show a shop’s name, branches, services, designs and reviews. A review shows the reviewer’s name.',
    'We do not sell personal information.',
  ] }] },
  { n: 4, title: 'Documents and files', audience: 'owners', blocks: [
    { p: 'Verification documents and IDs are stored privately and opened only by the SUTURA team during review. They are not shown to customers.' },
  ] },
  { n: 5, title: 'How long we keep it', audience: 'all', blocks: [
    { p: 'We keep information while your account is active and as long as needed for orders, payment records and legal obligations. When an account is closed, we delete or anonymise personal information that we no longer need.' },
  ] },
  { n: 6, title: 'Your rights', audience: 'all', blocks: [
    { p: 'Under the Data Privacy Act you may ask to see, correct or delete your personal information, object to how it is used, and complain to the National Privacy Commission. Write to [Contact email] and we will respond.' },
  ] },
  { n: 7, title: 'Keeping it safe', audience: 'all', blocks: [
    { p: 'Passwords are hashed, traffic is encrypted, and each shop can only reach its own records. No system is perfectly secure, so please keep your password private and tell us at once if you think your account was used by someone else.' },
  ] },
  { n: 8, title: 'Browser storage', audience: 'all', blocks: [
    { p: 'SUTURA keeps your sign-in and a few preferences in your browser so you stay signed in. It does not use advertising trackers.' },
  ] },
  { n: 9, title: 'Changes and contact', audience: 'all', blocks: [
    { p: 'We may update this policy and will say so on this page, and by email if the change is significant. Questions: [Company name], [Business address]. Email: [Contact email].' },
  ] },
];
