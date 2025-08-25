export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
  metadata?: {
    modelType?: 'gemini' | 'openai';
    [key: string]: any;
  };
}

export type SubmissionFrequency = 'immediate' | 'quarterly' | 'annually';

export type Module = 'accounting' | 'partner_check' | 'secretary' | 'marketing';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  taxAmount?: number;
  isExpenseClaimed?: boolean;
}

export interface Submission {
  id: string;
  timestamp: string;
  period: string; // e.g., 'Q3 2024'
  status: 'submitted' | 'processing' | 'error' | 'accepted';
  transactionIds: string[];
}

export interface TaxFormData {
  fullName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  taxId: string;
  bankName: string;
  iban: string;
  consent: boolean;
}

export interface FormField {
    id: keyof TaxFormData;
    label: string;
    type: 'text' | 'date' | 'number' | 'checkbox';
    placeholder?: string;
    info?: string;
}

export interface FormStepConfig {
    title: string;
    fields: FormField[];
}

// Auth and Admin panel types
export interface User {
  id: string;
  email: string;
  role: 'user';
  subscriptionStatus: 'active' | 'cancelled' | 'trial';
  lastLogin: string;
}

export interface Admin {
  id: string;
  email: string;
  role: 'admin';
}

// Partner Check module types
export interface UserProfile {
  companyName: string;
  vatId: string;
  address: string;
  country: string;
}

export interface Counterparty {
  id: string;
  name: string;
  vatId: string;
  status: 'verified' | 'warning' | 'sanctioned' | 'unknown';
  lastCheck: string;
  judicialCases: { date: string; description: string; status: string }[];
}

// Secretary module types
export interface SecretaryChannel {
  type: 'email' | 'telegram' | 'whatsapp' | 'signal' | 'phone';
  value: string;
  connected: boolean;
  config?: {
    // Specific config properties for each channel type
    mcp_server?: string;
    signal_cli_path?: string;
    whatsapp_business_id?: string;
    livekit_api_key?: string;
    livekit_api_secret?: string;
  };
}

export interface KnowledgeBaseFile {
  id: string;
  name: string;
  size: number;
  uploaded: string;
  status: 'processing' | 'ready' | 'error';
}

export interface SecretaryInstructions {
  systemInstruction: string;
  companyInfo: string;
  responseGuidelines: string;
  faqResponses: Array<{ question: string; answer: string }>;
}

export interface GoogleCalendarConfig {
  enabled: boolean;
  calendarId: string;
  authToken: string;
  allowEventCreation: boolean;
  allowEventModification: boolean;
}

export interface SecretaryConfig {
  isActive: boolean;
  channels: SecretaryChannel[];
  knowledgeBaseFiles: KnowledgeBaseFile[];
  instructions: SecretaryInstructions;
  googleCalendar: GoogleCalendarConfig;
  memorySettings: {
    enableConversationMemory: boolean;
    maxHistoryMessages: number;
    enableVectorKnowledge: boolean;
  };
}

// Marketing module types
export interface MarketingChannel {
  id: string;
  platform: 'Blog' | 'LinkedIn' | 'Twitter / X' | 'Instagram';
  url: string;
  apiCredentials?: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    username?: string;
  };
}

export interface ContentTopic {
  id: string;
  topic: string;
}

export interface ScheduledPost {
  id: string;
  channelId: string;
  topicId: string;
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'error';
  frequency?: 'weekly' | 'monthly';
  generatedContent?: {
    title: string;
    text: string;
    mediaPrompt: string;
  };
}