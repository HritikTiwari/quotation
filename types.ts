

export interface ClientDetails {
    id?: string; // New field for linking to master
    name: string;
    company: string; 
    phone: string;
    email: string;
    address: string; 
    tagline: string;
    locations: string;
    reference: string;
    date: string;
    validTill: string;
    quoNumber: string;
    status: 'Draft' | 'Sent' | 'Confirmed' | 'On Hold';
  }
  
  export interface ClientMaster {
    id: string;
    name: string;
    company?: string;
    phone: string;
    email: string;
    address?: string; 
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
    isDateDecided: boolean; 
    date: string;
    timeRange: string;
    isVenueDecided: boolean; 
    venue: string;
    duration: string;
    team: TeamMember[];
    notes: string;
    approxCost: number;
  }
  
  export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

  export interface PaymentMilestone {
    id: string;
    name: string; 
    type: 'percentage' | 'fixed';
    value: number; 
    amount: number; 
    dueDate: string;
    isPaid: boolean;
    paidAt?: string; 
    method?: PaymentMethod;
    proofFile?: string; 
  }

  export interface Financials {
    packageName: string;
    baseAmount: number;
    discount: number;
    advanceAmount: number; 
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
    paymentTerms: string; 
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