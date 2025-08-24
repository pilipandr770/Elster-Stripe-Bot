import { Transaction, Submission, TaxFormData, FormStepConfig, User, UserProfile, Counterparty, SecretaryConfig, MarketingChannel, ContentTopic, ScheduledPost } from './types';

export const MOCK_USERS: User[] = [
    { id: 'user-1', email: 'max.mustermann@example.com', role: 'user', subscriptionStatus: 'active', lastLogin: '2024-07-28T10:00:00Z' },
    { id: 'user-2', email: 'erika.musterfrau@example.de', role: 'user', subscriptionStatus: 'active', lastLogin: '2024-07-27T14:30:00Z' },
    { id: 'user-3', email: 'klaus.schmidt@email.com', role: 'user', subscriptionStatus: 'cancelled', lastLogin: '2024-06-15T08:00:00Z' },
    { id: 'user-4', email: 'sabine.meier@web.de', role: 'user', subscriptionStatus: 'trial', lastLogin: '2024-07-29T11:20:00Z' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'txn_1', date: '2024-07-28', description: 'Verkauf von Produkt A', amount: 199.99, currency: 'EUR', status: 'succeeded', taxAmount: 38.00 },
  { id: 'txn_2', date: '2024-07-28', description: 'Verkauf von Dienstleistung B', amount: 49.50, currency: 'EUR', status: 'succeeded', taxAmount: 9.41 },
  { id: 'txn_3', date: '2024-07-27', description: 'Rückerstattung für Produkt A', amount: -199.99, currency: 'EUR', status: 'succeeded', isExpenseClaimed: false },
  { id: 'txn_4', date: '2024-07-26', description: 'Verkauf von Produkt C', amount: 89.00, currency: 'EUR', status: 'succeeded', taxAmount: 16.91 },
  { id: 'txn_5', date: '2024-07-25', description: 'Abonnement-Verlängerung', amount: 19.99, currency: 'EUR', status: 'succeeded', taxAmount: 3.80 },
  { id: 'txn_6', date: '2024-07-24', description: 'Büromaterial', amount: -75.50, currency: 'EUR', status: 'succeeded', isExpenseClaimed: true },
];

export const MOCK_SUBMISSIONS: Submission[] = [
    { id: 'sub_a1', timestamp: '2024-07-15T10:00:00Z', period: 'Q2 2024', status: 'accepted', transactionIds: ['txn_prev_1', 'txn_prev_2'] },
    { id: 'sub_b2', timestamp: '2024-04-15T09:00:00Z', period: 'Q1 2024', status: 'accepted', transactionIds: ['txn_prev_3', 'txn_prev_4'] },
];

export const MOCK_USER_PROFILE: UserProfile = {
  companyName: 'Musterfirma GmbH',
  vatId: 'DE123456789',
  address: 'Hauptstraße 1, 10115 Berlin',
  country: 'Deutschland',
};

export const MOCK_COUNTERPARTIES: Counterparty[] = [
  {
    id: 'cp_1',
    name: 'Tech Solutions AG',
    vatId: 'DE987654321',
    status: 'verified',
    lastCheck: '2024-07-30T10:00:00Z',
    judicialCases: [],
  },
  {
    id: 'cp_2',
    name: 'Global Imports Ltd.',
    vatId: 'GB123456789',
    status: 'warning',
    lastCheck: '2024-07-29T14:20:00Z',
    judicialCases: [
      { date: '2023-11-15', description: 'Zahlungsverzug - Fall abgeschlossen', status: 'Abgeschlossen' },
    ],
  },
   {
    id: 'cp_3',
    name: 'Sanktionierte Entität KG',
    vatId: 'RU112233445',
    status: 'sanctioned',
    lastCheck: '2024-07-28T09:00:00Z',
    judicialCases: [
      { date: '2022-05-20', description: 'Verstoß gegen internationale Handelsbestimmungen', status: 'Aktiv' },
    ],
  },
];

export const MOCK_SECRETARY_CONFIG: SecretaryConfig = {
  isActive: false,
  channels: [
    { 
      type: 'email', 
      value: 'support@musterfirma.de', 
      connected: true,
      config: {
        mcp_server: 'https://mcp-server.example.com' 
      }
    },
    { type: 'telegram', value: '', connected: false },
    { 
      type: 'whatsapp', 
      value: '', 
      connected: false,
      config: {
        whatsapp_business_id: ''
      }
    },
    { 
      type: 'signal', 
      value: '', 
      connected: false,
      config: {
        signal_cli_path: '/opt/signal-cli/bin/signal-cli'
      }
    },
    { 
      type: 'phone', 
      value: '', 
      connected: false,
      config: {
        livekit_api_key: '',
        livekit_api_secret: ''
      }
    },
  ],
  googleCalendar: {
    enabled: false,
    calendarId: '',
    authToken: '',
    allowEventCreation: true,
    allowEventModification: false
  },
  knowledgeBaseFiles: [
    { id: 'file1', name: 'produkt-katalog-2024.pdf', size: 2400000, uploaded: '2024-08-01T10:00:00Z', status: 'ready' },
    { id: 'file2', name: 'agb-und-widerrufsbelehrung.docx', size: 85000, uploaded: '2024-08-02T14:30:00Z', status: 'ready' },
  ],
  instructions: {
    systemInstruction: `Sie sind ein KI-Assistent der Firma Musterfirma GmbH. Ihre Aufgabe ist es, Kundenanfragen professionell und höflich zu beantworten.`,
    companyInfo: `Unser Firmenname ist Musterfirma GmbH.
Die Standard-Lieferzeit beträgt 3-5 Werktage innerhalb Deutschlands.
Rücksendungen sind innerhalb von 14 Tagen kostenlos möglich.`,
    responseGuidelines: `Unser Kommunikationsstil ist professionell, aber freundlich und hilfsbereit.
Bei Preisanfragen immer auf den Produktkatalog verweisen.
Neue Kunden erhalten auf ihre erste Bestellung 10% Rabatt mit dem Code WILLKOMMEN10.`,
    faqResponses: [
      { 
        question: "Wie lange dauert die Lieferung?", 
        answer: "Die Standardlieferzeit beträgt 3-5 Werktage innerhalb Deutschlands." 
      },
      { 
        question: "Kann ich Produkte zurücksenden?", 
        answer: "Ja, Rücksendungen sind innerhalb von 14 Tagen kostenlos möglich." 
      }
    ]
  },
  memorySettings: {
    enableConversationMemory: true,
    maxHistoryMessages: 10,
    enableVectorKnowledge: true
  }
};

export const MOCK_MARKETING_CHANNELS: MarketingChannel[] = [
  { id: 'ch_1', platform: 'Blog', url: 'https://musterfirma.de/blog' },
  { id: 'ch_2', platform: 'LinkedIn', url: 'https://linkedin.com/company/musterfirma' },
];

export const MOCK_CONTENT_TOPICS: ContentTopic[] = [
  { id: 't_1', topic: 'Vorteile von Produkt A für kleine Unternehmen' },
  { id: 't_2', topic: 'Fallstudie: Wie Kunde X mit unserer Dienstleistung 50% Zeit sparte' },
  { id: 't_3', topic: 'Ausblick auf neue Features in Q4 2024' },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

export const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: 'post_1',
    channelId: 'ch_1',
    topicId: 't_1',
    scheduledDate: tomorrow.toISOString(),
    status: 'scheduled',
  },
  {
    id: 'post_2',
    channelId: 'ch_2',
    topicId: 't_2',
    scheduledDate: nextWeek.toISOString(),
    status: 'scheduled',
  },
  {
    id: 'post_3',
    channelId: 'ch_1',
    topicId: 't_2',
    scheduledDate: '2024-07-25T10:00:00Z',
    status: 'published',
    generatedContent: {
      title: 'Erfolgsgeschichte: Zeitersparnis bei Kunde X',
      text: 'Unser Kunde X konnte durch den Einsatz unserer Dienstleistung B seine Prozesszeiten halbieren...',
      mediaPrompt: 'Ein professionelles Bild eines glücklichen Teams, das am Computer arbeitet, helle Büroumgebung.'
    }
  },
];

export const FORM_STEPS: FormStepConfig[] = [
    {
      title: 'Personal Information',
      fields: [
        { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Max Mustermann' },
        { id: 'streetAddress', label: 'Street Address', type: 'text', placeholder: 'Musterstraße 1' },
        { id: 'city', label: 'City', type: 'text', placeholder: 'Berlin' },
        { id: 'postalCode', label: 'Postal Code', type: 'text', placeholder: '10115' },
      ],
    },
    {
      title: 'Tax Details',
      fields: [
        { id: 'taxId', label: 'German Tax ID (IdNr)', type: 'text', placeholder: '01 234 567 890', info: 'Your 11-digit personal tax identification number.' },
        { id: 'bankName', label: 'Bank Name', type: 'text', placeholder: 'Musterbank AG' },
        { id: 'iban', label: 'IBAN', type: 'text', placeholder: 'DE89 3704 0044 0532 0130 00' },
      ],
    },
    {
      title: 'Declaration',
      fields: [
        { id: 'consent', label: 'I declare that the information provided is accurate and complete to the best of my knowledge.', type: 'checkbox', info: 'By checking this box, you confirm your declaration.' },
      ],
    },
];

export const INITIAL_TAX_FORM_DATA: TaxFormData = {
    fullName: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    taxId: '',
    bankName: '',
    iban: '',
    consent: false,
};