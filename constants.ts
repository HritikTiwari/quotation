
import { QuotationData, ClientMaster, EventTemplate, SkillMaster } from './types';

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
  { id: 'c1', name: 'Rahul Sharma & Priya Verma', company: '', phone: '+91-9876543210', email: 'rahul.priya@example.com', notes: 'Referral from Instagram' },
  { id: 'c2', name: 'Amit & Neha', company: 'Tech Solutions Pvt Ltd', phone: '+91-9988776655', email: 'amit.neha@gmail.com', notes: 'Varanasi Local' }
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

export const INITIAL_QUOTATION: QuotationData = {
  client: {
    name: 'Rahul Sharma & Priya Verma',
    company: '',
    phone: '+91-9876543210',
    email: 'rahul.priya@example.com',
    tagline: 'Wedding Coverage – Lucknow & Varanasi',
    locations: 'Lucknow (Haldi, Sangeet, Wedding) & Varanasi (Reception)',
    reference: 'Instagram / Friend Reference',
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quoNumber: 'QUO-2025-0012',
    status: 'Draft'
  },
  events: [
    {
      id: '1',
      name: 'Haldi Ceremony',
      date: '2026-11-24',
      timeRange: '10:00 AM – 2:00 PM',
      venue: 'Lucknow (Home)',
      duration: '4–5 Hours',
      team: [
        { skillId: 's1', count: 1 },
        { skillId: 's2', count: 1 }
      ],
      notes: 'Day function – mostly family ritual coverage.',
      approxCost: 25000
    },
    {
      id: '2',
      name: 'Sangeet Ceremony',
      date: '2026-11-25',
      timeRange: '5:00 PM – 11:00 PM',
      venue: 'Lucknow Banquet',
      duration: '5–6 Hours',
      team: [
        { skillId: 's1', count: 1 },
        { skillId: 's3', count: 1 },
        { skillId: 's2', count: 1 }
      ],
      notes: '',
      approxCost: 40000
    }
  ],
  financials: {
    packageName: 'Complete Mix Package – Haldi + Sangeet + Wedding + Reception',
    baseAmount: 65000, // Correct sum of 25000 + 40000
    discount: 5000,
    gstRate: 18,
    // Calculations: 65000 - 5000 = 60000. GST 18% = 10800. Total = 70800.
    paymentMilestones: [
        { id: '1', name: 'Booking Advance', type: 'percentage', value: 30, amount: 21240, dueDate: '', isPaid: true, paidAt: '2025-01-05', method: 'UPI' },
        { id: '2', name: 'Wedding Day', type: 'percentage', value: 40, amount: 28320, dueDate: '2026-11-29', isPaid: false },
        { id: '3', name: 'Final Delivery', type: 'percentage', value: 30, amount: 21240, dueDate: '', isPaid: false }
    ],
    notes: 'Includes travel within city limits and standard editing.'
  },
  addOns: [
    {
      id: '1',
      service: 'LED Wall Live',
      description: 'Live projection setup with LED',
      price: 15000
    }
  ],
  meta: {
    deliverables: `All Edited Photos (Approx 2500–3500 across events)
Wedding Cinematic Film (5–10 minutes)
Sangeet Film (5–7 minutes)
Full Wedding Video (1.5–2.5 hours)
Sangeet Full Video (1–1.5 hours)
Reels (3 Custom Reels – 20–30 sec each)
Premium Wedding Album – 40 Sheets
Mini Album – 1 Piece
Premium Pen Drive + Box
Online Cloud Gallery`,
    deliveryTimeline: `Photos: 10–12 Days
Videos: 25–30 Days
Albums: 10–15 Days After Selection`,
    bankDetails: `A/C: XXXXXXXX1234
IFSC: BARB0XXXXXX
UPI: merastudio@ybl`,
    terms: `Booking is confirmed only after advance payment.
Extra hours are chargeable as per studio policy.
Travel & stay for outstation events must be arranged by the client.
Video/music selection is client’s responsibility.
Studio may use selected photos/videos for portfolio.
All disputes subject to Varanasi jurisdiction.`,
    clientSignName: 'Rahul Sharma',
    studioSignName: 'Mera Studio & Films – Authorized Signatory'
  }
};
