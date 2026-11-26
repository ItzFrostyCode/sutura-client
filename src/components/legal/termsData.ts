import type { LegalSectionData } from './legalTypes';

export const TERMS_UPDATED = 'November 10, 2026';
export const TERMS_VERSION = '2026-11-10';

export const TERMS_INTRO = 'These terms are the agreement between you and [Company name] ("SUTURA", "we", "us") for using the SUTURA website and related services. By creating an account or using SUTURA, you agree to them. If you do not agree, please do not use SUTURA.';

/** The six things most people need to know, each with an icon key (the icons live in KeyPoints.tsx). */
export const KEY_POINTS = [
  { icon: 'software', title: 'We make the software', body: 'Each shop does its own tailoring and sets its own prices and policies.' },
  { icon: 'pay', title: 'You pay the shop', body: 'SUTURA does not take payment from customers. Shops record what they receive.' },
  { icon: 'adult', title: '18 and accurate', body: 'You must be at least 18 years old and give accurate information.' },
  { icon: 'verify', title: 'Shops are verified', body: 'Owners verify their identity and business first, and need an active plan or the free trial.' },
  { icon: 'ruler', title: 'Measurements stay with you', body: 'A shop enters your measurements, and they are kept on your account.' },
  { icon: 'close', title: 'Leaving is easy', body: 'To close an account, write to [Contact email].' },
] as const;

export const TERMS: readonly LegalSectionData[] = [
  { n: 1, title: 'What SUTURA is', audience: 'all', blocks: [
    { p: 'SUTURA is a web platform for tailoring shops and their customers in Davao City. Shop owners and their staff use the dashboard to manage branches, services, designs, staff, appointments, job orders and payment records. Customers use the SUTURA site to find verified shops, book fittings, place orders and follow an order from request to pickup.' },
    { p: 'SUTURA provides the software. The shop provides the tailoring. We are not a party to the work a shop does for its customers.' },
  ] },
  { n: 2, title: 'Your account', audience: 'all', blocks: [{ ul: [
    'You must give accurate information when you sign up and keep it up to date.',
    'You must be at least 18 years old to create an account.',
    'Shop owners must confirm their email by opening the link we send. The account is created when you do.',
    'A shop needs its own email. An email already used for a customer account cannot also be used to sign in as a shop.',
    'Keep your password private. You are responsible for what is done through your account. Tell us at [Contact email] if you think someone else has used it.',
    'One person per account. Do not share a login; owners can create separate logins for their branch managers and staff.',
  ] }] },
  { n: 3, title: 'Shop owners: verification', audience: 'owners', blocks: [
    { p: 'Before a shop is shown to customers, the owner and the business must be verified. You send your personal details, a government-issued ID, the DTI Business Name Registration, a TIN ID or BIR Form 2303, a Barangay Business Clearance, a photo of the shop front and its pinned location. Business permits you add are optional.' },
    { p: 'You confirm that the documents you submit are genuine, belong to you or your business, and are current. We may approve, reject or ask you to resubmit them, and we may suspend a shop or branch whose documents are false, expired or no longer valid.' },
    { p: 'You are responsible for the logins you create for your staff and for what they do in your shop’s workspace.' },
  ] },
  { n: 4, title: 'Shop owners: plans and payment', audience: 'owners', blocks: [{ ul: [
    'Using SUTURA as a shop requires an active plan or the free trial. Each plan sets how many branches and staff accounts you may have and which features are included. Current plans and prices are on the For shops page.',
    'A new shop gets a free trial of 14 days on the Basic plan. It starts when the SUTURA team approves your shop, not when you apply, and costs nothing.',
    'Plans are billed monthly or yearly, in advance, in Philippine pesos. SUTURA does not collect payment automatically: you pay by QR Ph (GCash or Maya) or bank transfer, upload your receipt, and the team checks it.',
    'When a plan or the trial ends and is not renewed, your shop is hidden from customers until you renew. Your records stay.',
    'You may upgrade your plan. A downgrade is not allowed while your branches or staff accounts are over the new plan’s limits; reduce them first.',
    'Payments are not refunded, and a term is not cancelled for a refund of its unused part.',
    'We may change plans and prices. A change applies to you from your next term, and we will tell you before then.',
  ] }] },
  { n: 5, title: 'Customers: orders and visits', audience: 'customers', blocks: [{ ul: [
    'A booking or order made through SUTURA is an agreement between you and the shop. The shop sets its own services, prices, quotes, opening hours, requirements and policies.',
    'For made-to-order work the shop may send you a quote, or ask for a deposit, before it starts. You can approve or decline a quote.',
    'A shop may reschedule or cancel a booking. You will be notified when it does. You may reschedule or cancel a booking or order that has not started, subject to the shop’s rules.',
    'Dates and times shown for production, fittings and pickup are the shop’s estimates.',
    'SUTURA does not take payment from customers. You pay the shop directly, using the methods the shop accepts, and send proof if the shop asks. The shop records and verifies it, and the receipt and balance then appear on your order.',
    'Questions or complaints about a garment, a price or a refund should be raised with that shop.',
  ] }] },
  { n: 6, title: 'Customers: measurements and records', audience: 'customers', blocks: [
    { p: 'Your measurements are entered by a shop’s staff and kept on your SUTURA account, so that you and the shops you order from can use them. The shop is responsible for the accuracy of what it records. Tell the shop if something looks wrong.' },
  ] },
  { n: 7, title: 'Listings and reviews', audience: 'all', blocks: [{ ul: [
    'A verified branch may be shown to customers on the map and in search, with its photos, services, prices, designs and ratings. The shop is responsible for keeping that information accurate and for having the right to use the photos it uploads.',
    'Reviews and ratings must be about a real order or visit and must not be abusive, misleading or unrelated to it. We may hide a review that breaks these rules.',
    'By posting a review or uploading content, you allow us to display it in SUTURA.',
  ] }] },
  { n: 8, title: 'What you must not do', audience: 'all', blocks: [{ ul: [
    'Use SUTURA for anything unlawful, or to offer or request unlawful services.',
    'Submit false information or documents, or pretend to be someone else.',
    'Try to access accounts, shops or data that are not yours.',
    'Interfere with, overload, probe or reverse-engineer the service.',
    'Copy or resell SUTURA, or use it to build a competing service.',
    'Upload content that is abusive, obscene, or infringes someone else’s rights.',
  ] }] },
  { n: 9, title: 'Data that shops put into SUTURA', audience: 'owners', blocks: [
    { p: 'A shop decides what customer, measurement and order records it keeps in SUTURA and is responsible for having the right to collect and use that information. We process it on the shop’s behalf to provide the service. How we handle personal information is explained in the Privacy Policy.' },
  ] },
  { n: 10, title: 'Suspension and closing an account', audience: 'all', blocks: [{ ul: [
    'We may suspend or close an account, shop or branch that breaks these terms, submits false documents, or puts other users or the service at risk.',
    'To close your account, write to [Contact email].',
    'Closing an account does not cancel amounts already due, and does not entitle you to a refund.',
  ] }] },
  { n: 11, title: 'Availability and changes to the service', audience: 'all', blocks: [
    { p: 'We work to keep SUTURA available and your data safe, but we do not promise that it will be uninterrupted or free of errors. SUTURA needs an internet connection and does not work offline. We may change, add or remove features, and will try to give notice of changes that significantly affect how you use SUTURA.' },
  ] },
  { n: 12, title: 'Our responsibility to you', audience: 'all', blocks: [
    { p: 'SUTURA is provided "as is". To the extent the law allows, we are not liable for the work, conduct or content of shops, customers or other users; for lost profits, lost revenue or lost data; or for indirect or consequential loss. To the extent the law allows, our total liability to you for any claim about the service is limited to the amount you paid us in the three months before the claim arose. Nothing in these terms limits liability that cannot be limited under Philippine law.' },
  ] },
  { n: 13, title: 'Governing law', audience: 'all', blocks: [
    { p: 'These terms are governed by the laws of the Republic of the Philippines. Disputes will be brought before the proper courts of Davao City, Philippines.' },
  ] },
  { n: 14, title: 'Changes to these terms', audience: 'all', blocks: [
    { p: 'We may update these terms. The date at the top shows when they last changed. If a change is significant, we will tell you on the site or by email. Continuing to use SUTURA after a change takes effect means you accept the updated terms.' },
  ] },
  { n: 15, title: 'Contact', audience: 'all', blocks: [
    { p: '[Company name], [Business address]. Email: [Contact email].' },
  ] },
];
