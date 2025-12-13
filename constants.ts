import { QuotationData, ClientMaster, EventTemplate, SkillMaster, QuotationRecord } from './types';

export const INITIAL_SKILLS: SkillMaster[] = [
  { id: 's1', name: 'Candid Photographer' },
  { id: 's2', name: 'Traditional Photographer' },
  { id: 's3', name: 'Cinematographer' },
  { id: 's4', name: 'Drone Pilot' },
  { id: 's5', name: 'Traditional Videographer' },
  { id: 's6', name: 'Album Designer' },
  { id: 's7', name: 'Assistant' },
];

export const INITIAL_CLIENTS: ClientMaster[] = [
  { id: 'c1', name: 'Rahul Sharma & Priya Verma', company: '', phone: '+91-9876543210', email: 'rahul.priya@example.com', address: '123, Civil Lines, Varanasi', notes: 'Referral from Instagram' },
  { id: 'c2', name: 'Amit & Neha', company: 'Tech Solutions Pvt Ltd', phone: '+91-9988776655', email: 'amit.neha@gmail.com', address: '45, Lanka, Varanasi', notes: 'Varanasi Local' }
];

export const INITIAL_EVENT_TEMPLATES: EventTemplate[] = [
  { 
    id: 't1', 
    name: 'Haldi Ceremony', 
    defaultDuration: '4–5 Hours', 
    defaultTeam: [
        { skillId: 's1', count: 1 }, 
        { skillId: 's2', count: 1 }
    ], 
    defaultCost: 25000 
  },
  { 
    id: 't2', 
    name: 'Sangeet', 
    defaultDuration: '5–6 Hours', 
    defaultTeam: [
        { skillId: 's1', count: 1 }, 
        { skillId: 's3', count: 1 }, 
        { skillId: 's2', count: 1 }
    ], 
    defaultCost: 40000 
  },
  { 
    id: 't3', 
    name: 'Wedding', 
    defaultDuration: '10–12 Hours', 
    defaultTeam: [
        { skillId: 's1', count: 1 }, 
        { skillId: 's2', count: 1 }, 
        { skillId: 's3', count: 1 }, 
        { skillId: 's4', count: 1 }
    ], 
    defaultCost: 85000 
  },
  { 
    id: 't4', 
    name: 'Reception', 
    defaultDuration: '4–5 Hours', 
    defaultTeam: [
        { skillId: 's2', count: 1 }, 
        { skillId: 's3', count: 1 }
    ], 
    defaultCost: 30000 
  }
];

// Helper to generate dates relative to today
const today = new Date();
const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

const BASE_QUOTATION: QuotationData = {
  client: {
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    tagline: '',
    locations: '',
    reference: '',
    date: today.toISOString().split('T')[0],
    validTill: addDays(14),
    quoNumber: '',
    status: 'On Hold' // Default status
  },
  events: [],
  financials: {
    packageName: '',
    baseAmount: 0,
    discount: 0,
    advanceAmount: 0,
    paymentMilestones: [],
    notes: ''
  },
  addOns: [],
  meta: {
    deliverables: 'Standard Deliverables',
    deliveryTimeline: '30 Days',
    bankDetails: 'Bank info...',
    paymentTerms: "25% Advance Payment (Booking Amount)\n50% Before Event Day\n25% On Final Delivery",
    terms: 'Standard Terms',
    clientSignName: '',
    studioSignName: 'Mera Studio'
  }
};

export const INITIAL_QUOTATION: QuotationData = {
    ...BASE_QUOTATION,
    client: { ...BASE_QUOTATION.client, name: 'Sample Client', quoNumber: 'QUO-SAMPLE' }
};

export const SAMPLE_QUOTATIONS_LIST: QuotationRecord[] = [
    {
        id: 'Q-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
            client: {
                name: 'Rahul Sharma & Priya Verma',
                company: 'Sharma Industries',
                phone: '+91-9876543210',
                email: 'rahul.priya@example.com',
                address: '12-A, Residency Road, Varanasi',
                tagline: 'A Royal Celebration',
                locations: 'Taj Hotel, Varanasi',
                reference: 'Instagram',
                date: addDays(2),
                validTill: addDays(10),
                quoNumber: 'QUO-2025-001',
                status: 'Confirmed'
            },
            events: [
                { 
                    id: 'e1', 
                    name: 'Haldi & Mehendi', 
                    isDateDecided: true, 
                    date: addDays(1), 
                    timeRange: '11:00 AM - 4:00 PM', 
                    isVenueDecided: true, 
                    venue: 'Poolside, Taj Hotel', 
                    duration: '5 Hours', 
                    team: [
                        { skillId: 's1', count: 2 }, // Candid
                        { skillId: 's3', count: 1 }  // Cinematographer
                    ], 
                    notes: 'Fun and vibrant vibes', 
                    approxCost: 35000 
                },
                { 
                    id: 'e2', 
                    name: 'Wedding Ceremony', 
                    isDateDecided: true, 
                    date: addDays(2), 
                    timeRange: '6:00 PM onwards', 
                    isVenueDecided: true, 
                    venue: 'Grand Ballroom, Taj Hotel', 
                    duration: '8 Hours', 
                    team: [
                        { skillId: 's1', count: 2 }, 
                        { skillId: 's2', count: 1 }, 
                        { skillId: 's3', count: 2 }, 
                        { skillId: 's4', count: 1 },
                        { skillId: 's5', count: 1 }
                    ], 
                    notes: 'Focus on rituals and bride entry', 
                    approxCost: 120000 
                }
            ],
            addOns: [
                { id: 'add1', service: 'Drone Coverage', description: '4K Drone shots for entry and varmala', price: 15000 },
                { id: 'add2', service: 'Same Day Edit', description: '3-minute highlight video shown at reception', price: 25000 }
            ],
            financials: {
                packageName: 'Royal Wedding Package',
                baseAmount: 155000,
                discount: 10000,
                advanceAmount: 50000,
                paymentMilestones: [
                    { id: 'pm1', name: 'Booking Amount', type: 'fixed', value: 50000, amount: 50000, dueDate: addDays(-30), isPaid: true, paidAt: '2025-01-15', method: 'UPI' },
                    { id: 'pm2', name: 'Event Day Advance', type: 'fixed', value: 80000, amount: 80000, dueDate: addDays(1), isPaid: false },
                    { id: 'pm3', name: 'Final Deliverables', type: 'fixed', value: 55000, amount: 55000, dueDate: addDays(45), isPaid: false }
                ],
                notes: 'All prices inclusive of taxes.'
            },
            meta: {
                deliverables: "1. 300+ Edited Candid Photographs\n2. 3-5 Minute Cinematic Teaser\n3. 25-30 Minute Wedding Highlight Film\n4. Traditional Full Video (2-3 Hours)\n5. One Premium Leather Album (40 Sheets)",
                deliveryTimeline: "Photos: 15 Days after event\nTeaser: 20 Days after event\nFull Films & Album: 45-60 Days after event selection",
                bankDetails: "Mera Studio & Films\nAccount No: 1234567890\nIFSC: HDFC0001234\nBranch: Varanasi Main",
                paymentTerms: "25% Advance Payment (Booking Amount)\n50% Before Event Day\n25% On Final Delivery",
                terms: "1. 50% advance payment is mandatory to block dates.\n2. Travel and stay for the team to be provided by the client.\n3. Raw footage will be provided on a hard drive supplied by the client.\n4. Copyrights of the images/videos remain with Mera Studio.",
                clientSignName: "Rahul Sharma",
                studioSignName: "Mera Studio Admin"
            }
        },
        history: [
            { id: 'h1', timestamp: new Date().toISOString(), user: 'Admin', action: 'Quotation Created' },
            { id: 'h2', timestamp: new Date().toISOString(), user: 'Admin', action: 'Status changed to Confirmed' }
        ]
    },
    {
        id: 'Q-002',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
            ...BASE_QUOTATION,
            client: { ...BASE_QUOTATION.client, name: 'Amit & Neha', quoNumber: 'QUO-2025-002', status: 'On Hold' },
            events: [
                { id: 'e3', name: 'Sangeet', isDateDecided: true, date: addDays(5), timeRange: '5 PM', isVenueDecided: true, venue: 'City Club', duration: '5h', team: [], notes: '', approxCost: 40000 }
            ],
            financials: { ...BASE_QUOTATION.financials, baseAmount: 40000, advanceAmount: 0, paymentMilestones: [{ id: 'pm2', name: 'Adv', type: 'fixed', value: 10000, amount: 10000, dueDate: '', isPaid: false }] }
        },
        history: []
    },
    {
        id: 'Q-003',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
            ...BASE_QUOTATION,
            client: { ...BASE_QUOTATION.client, name: 'Vikas & Simran', quoNumber: 'QUO-2025-003', status: 'On Hold' },
            events: [
                { id: 'e4', name: 'Pre-Wedding', isDateDecided: true, date: addDays(10), timeRange: '6 AM', isVenueDecided: true, venue: 'Ghats', duration: '4h', team: [], notes: '', approxCost: 15000 }
            ],
            financials: { ...BASE_QUOTATION.financials, baseAmount: 15000, advanceAmount: 0, paymentMilestones: [] }
        },
        history: []
    },
    {
        id: 'Q-004',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
            ...BASE_QUOTATION,
            client: { ...BASE_QUOTATION.client, name: 'Corporate Event', quoNumber: 'QUO-2025-004', status: 'On Hold' },
            events: [
                { id: 'e5', name: 'Conference', isDateDecided: true, date: addDays(-2), timeRange: '9 AM', isVenueDecided: true, venue: 'Convention Center', duration: '8h', team: [], notes: '', approxCost: 20000 }
            ],
            financials: { ...BASE_QUOTATION.financials, baseAmount: 20000, advanceAmount: 0, paymentMilestones: [] }
        },
        history: []
    },
    {
        id: 'Q-005',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
            ...BASE_QUOTATION,
            client: { ...BASE_QUOTATION.client, name: 'Suresh & Family', quoNumber: 'QUO-2025-005', status: 'On Hold' },
            events: [
                { id: 'e6', name: 'Engagement', isDateDecided: true, date: addDays(15), timeRange: '6 PM', isVenueDecided: true, venue: 'Home', duration: '4h', team: [], notes: '', approxCost: 25000 }
            ],
            // Accepted but NO Payment made yet
            financials: { ...BASE_QUOTATION.financials, baseAmount: 25000, advanceAmount: 5000, paymentMilestones: [{ id: 'pm3', name: 'Adv', type: 'fixed', value: 5000, amount: 5000, dueDate: '', isPaid: false }] }
        },
        history: []
    }
];