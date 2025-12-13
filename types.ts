

export interface ClientDetails {
    name: string;
    company: string; // New field
    phone: string;
    email: string;
    address: string; // New field
    tagline: string;
    locations: string;
    reference: string;
    date: string;
    validTill: string;
    quoNumber: string;
    status: 'Confirmed' | 'On Hold';
  }
  
  export interface ClientMaster {
    id: string;
    name: string;
    company?: string;
    phone: string;
    email: string;
    address?: string; // New field
    notes?: string;
  }

  export interface SkillMaster {
    id: string;
    name: string;
    description?: string;
  }

  export interface TeamMember {
    skillId: string;
    count: number;
  }

  export interface EventTemplate {
    id: string;
    name: string;
    defaultDuration: string;
    defaultTeam: TeamMember[];
    defaultCost: number;
    description?: string;
  }

  export interface EventItem {
    id: string;
    name: string;
    isDateDecided: boolean; // New field
    date: string;
    timeRange: string;
    isVenueDecided: boolean; // New field
    venue: string;
    duration: string;
    team: TeamMember[];
    notes: string;
    approxCost: number;
  }
  
  export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

  export interface PaymentMilestone {
    id: string;
    name: string; // e.g. "Booking", "Wedding Day"
    type: 'percentage' | 'fixed';
    value: number; // e.g. 30 (%) or 5000 (₹)
    amount: number; // The calculated amount in currency
    dueDate: string;
    isPaid: boolean;
    paidAt?: string; // Date of payment
    method?: PaymentMethod;
    proofFile?: string; // Base64 string of screenshot
  }

  export interface Financials {
    packageName: string;
    baseAmount: number;
    discount: number;
    advanceAmount: number; // New field for advance payment
    paymentMilestones: PaymentMilestone[];
    notes: string;
  }
  
  export interface AddOn {
    id: string;
    service: string;
    description: string;
    price: number;
  }
  
  export interface TermsAndDeliverables {
    deliverables: string;
    deliveryTimeline: string;
    bankDetails: string;
    paymentTerms: string; // Changed to string for single textarea
    terms: string;
    clientSignName: string;
    studioSignName: string;
  }
  
  export interface QuotationData {
    client: ClientDetails;
    events: EventItem[];
    financials: Financials;
    addOns: AddOn[];
    meta: TermsAndDeliverables;
  }
  
  export interface CalculatedTotals {
    packageAfterDiscount: number;
    grandTotal: number;
    totalPaid: number;
    balanceDue: number;
    totalEventCost: number;
  }

  export interface HistoryLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
  }
  
  export interface QuotationRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    data: QuotationData;
    history: HistoryLog[];
  }