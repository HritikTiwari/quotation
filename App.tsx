import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Zap, FileText, Plus, Trash2, Edit2, 
  ChevronRight, ChevronLeft, Save, Menu, X, Clock, Upload, CheckCircle, Search, AlertCircle, Download, Calendar as CalendarIcon, List, Eye, PenTool
} from 'lucide-react';
import { 
  INITIAL_QUOTATION, INITIAL_CLIENTS, INITIAL_SKILLS, INITIAL_EVENT_TEMPLATES, SAMPLE_QUOTATIONS_LIST 
} from './constants';
import { 
  QuotationData, CalculatedTotals, ClientMaster, SkillMaster, EventTemplate, 
  QuotationRecord, HistoryLog, TeamMember, PaymentMilestone, EventItem, AddOn
} from './types';
import PreviewSection from './components/PreviewSection';

// --- HELPER: Base64 Converter ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<'dashboard' | 'editor' | 'clients' | 'skills' | 'templates'>('dashboard');
  const [dashboardView, setDashboardView] = useState<'list' | 'calendar'>('calendar');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Master Data
  const [clients, setClients] = useState<ClientMaster[]>(INITIAL_CLIENTS);
  const [skills, setSkills] = useState<SkillMaster[]>(INITIAL_SKILLS);
  const [templates, setTemplates] = useState<EventTemplate[]>(INITIAL_EVENT_TEMPLATES);
  
  // Quotations
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  const [data, setData] = useState<QuotationData>(INITIAL_QUOTATION); // Editor buffer
  const [activeStep, setActiveStep] = useState(1);
  const [historyModalQuotationId, setHistoryModalQuotationId] = useState<string | null>(null);

  // Mobile Editor State
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // Skill Creation UI State
  const [activeSkillInputId, setActiveSkillInputId] = useState<string | null>(null);
  const [tempSkillInput, setTempSkillInput] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load initial sample quotation if list is empty
    if (quotations.length === 0) {
      setQuotations(SAMPLE_QUOTATIONS_LIST);
    }
  }, []);

  // --- CALCULATIONS ---
  const calculateTotals = (q: QuotationData): CalculatedTotals => {
    // 1. Calculate Total Event Cost (This DRIVES the Base Amount)
    const totalEventCost = q.events.reduce((sum, e) => sum + (Number(e.approxCost) || 0), 0);

    // 2. Add-ons Total
    const totalAddOns = q.addOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    // 3. Base Amount Logic
    // Base amount is typically sum of events. Add-ons are usually separate line items but included in Grand Total.
    const packageAfterDiscount = q.financials.baseAmount - q.financials.discount;
    
    // Taxable Amount (Package + Add-ons) - Now represents Grand Total as GST is removed
    const grandTotal = packageAfterDiscount + totalAddOns;
    
    // Payment Tracking (Advance)
    const totalPaid = q.financials.advanceAmount || 0;
    const balanceDue = grandTotal - totalPaid;

    return {
        packageAfterDiscount,
        grandTotal,
        totalPaid,
        balanceDue,
        totalEventCost
    };
  };

  const totals = calculateTotals(data);

  // Sync Base Amount with Event Costs
  useEffect(() => {
    const totalEventCost = data.events.reduce((sum, e) => sum + (Number(e.approxCost) || 0), 0);
    if (totalEventCost !== data.financials.baseAmount) {
        setData(prev => ({
            ...prev,
            financials: { ...prev.financials, baseAmount: totalEventCost }
        }));
    }
  }, [data.events]);


  // --- ACTIONS ---

  const handleCreateQuotation = (e: React.MouseEvent) => {
    e.preventDefault();
    const newId = `Q${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecord: QuotationRecord = {
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        ...INITIAL_QUOTATION,
        client: { ...INITIAL_QUOTATION.client, quoNumber: `QUO-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}` },
        addOns: [] // Start empty for new
      },
      history: [{
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Admin User',
        action: 'Created new quotation'
      }]
    };
    setQuotations(prev => [newRecord, ...prev]);
    setActiveQuotationId(newId);
    setData(newRecord.data);
    setActiveStep(1);
    setMobileTab('form');
    setView('editor');
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleEditQuotation = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const record = quotations.find(q => q.id === id);
    if (record) {
      setActiveQuotationId(id);
      setData(JSON.parse(JSON.stringify(record.data))); // Deep copy
      setActiveStep(1);
      setMobileTab('form');
      setView('editor');
    }
  };

  const handleDeleteQuotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this quotation?')) {
        setQuotations(prev => prev.filter(q => q.id !== id));
        if (activeQuotationId === id) {
            setView('dashboard');
            setActiveQuotationId(null);
        }
    }
  };

  const saveQuotation = () => {
    if (!activeQuotationId) return;

    setQuotations(prev => prev.map(q => {
      if (q.id === activeQuotationId) {
        // Diffing Logic
        const changes: string[] = [];
        const old = q.data;
        const current = data;

        // Simple Diff checks
        if (old.client.name !== current.client.name) changes.push(`Client Name: "${old.client.name}" → "${current.client.name}"`);
        if (old.financials.baseAmount !== current.financials.baseAmount) changes.push(`Base Amount: ${old.financials.baseAmount} → ${current.financials.baseAmount}`);
        if (old.addOns.length !== current.addOns.length) changes.push(`Add-ons updated`);
        if (old.financials.advanceAmount !== current.financials.advanceAmount) changes.push(`Advance: ${old.financials.advanceAmount} → ${current.financials.advanceAmount}`);

        let newHistory = q.history;
        if (changes.length > 0) {
            const logEntry: HistoryLog = {
                id: `h-${Date.now()}`,
                timestamp: new Date().toISOString(),
                user: 'Admin User',
                action: changes.join('\n')
            };
            newHistory = [logEntry, ...q.history];
        }

        return {
          ...q,
          updatedAt: new Date().toISOString(),
          data: current,
          history: newHistory
        };
      }
      return q;
    }));
  };

  // --- EDITOR HANDLERS ---
  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      client: { ...prev.client, [name]: value }
    }));
  };

  const handleSelectClient = (id: string) => {
    if (id === 'NEW_CLIENT') {
         setData(prev => ({
            ...prev,
            client: {
                ...prev.client,
                name: '',
                company: '',
                phone: '',
                email: '',
                address: '',
                locations: ''
            }
         }));
         return;
    }
    const client = clients.find(c => c.id === id);
    if (client) {
        setData(prev => ({
            ...prev,
            client: {
                ...prev.client,
                name: client.name,
                company: client.company || '',
                phone: client.phone,
                email: client.email,
                address: client.address || ''
            }
        }));
    }
  };

  // Event & Team Handlers
  const handleCreateAndAddSkill = (skillName: string, contextId: string, isTemplate: boolean = false) => {
    if (!skillName.trim()) return;
    
    // Check for duplicate
    const existing = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    let skillId = existing?.id;

    if (!existing) {
        const newSkill: SkillMaster = { id: `skill-${Date.now()}`, name: skillName };
        setSkills(prev => [...prev, newSkill]);
        skillId = newSkill.id;
    }

    if (skillId) {
        if (isTemplate) {
            // Template logic is specific to component
        } else {
            setData(prev => ({
                ...prev,
                events: prev.events.map(ev => {
                    if (ev.id === contextId) {
                        const existingMember = ev.team.find(t => t.skillId === skillId);
                        if (existingMember) return ev; // Already exists
                        return { ...ev, team: [...ev.team, { skillId: skillId!, count: 1 }] };
                    }
                    return ev;
                })
            }));
        }
    }
    setActiveSkillInputId(null);
    setTempSkillInput('');
    return skillId;
  };

  const handleCreateAndAddSkillToTemplate = (name: string) => {
    return handleCreateAndAddSkill(name, 'template-editor', true);
  };

  // --- SUB-COMPONENTS ---

  const Sidebar = () => (
    <>
        {/* Mobile Overlay */}
        {sidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden print:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}
        
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1a1c23] text-gray-300 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-wide">Mera Studio</h2>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                    <X size={20} />
                </button>
            </div>
            <nav className="p-4 space-y-2">
                <button onClick={() => { setView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
                    <LayoutDashboard size={18} /> <span>Dashboard</span>
                </button>
                <button onClick={() => { setView('clients'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'clients' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
                    <Users size={18} /> <span>Clients</span>
                </button>
                <button onClick={() => { setView('templates'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'templates' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
                    <FileText size={18} /> <span>Event Templates</span>
                </button>
                <button onClick={() => { setView('skills'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'skills' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
                    <Zap size={18} /> <span>Skills</span>
                </button>
            </nav>
        </div>
    </>
  );

  const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    // Prepare events mapping
    const eventsMap: {[key: string]: Array<{id: string, name: string, status: string, isPaid: boolean, quoId: string, clientName: string}>} = {};
    
    quotations.forEach(q => {
        const status = q.data.client.status;
        const paidAmount = q.data.financials.paymentMilestones.filter(m => m.isPaid).reduce((s, m) => s + m.amount, 0);
        const isPaid = paidAmount > 0;

        // Calendar Filter: Only Show Confirmed or On Hold
        if (status !== 'Confirmed' && status !== 'On Hold') {
            return;
        }

        q.data.events.forEach(ev => {
            if (ev.isDateDecided && ev.date) {
                if (!eventsMap[ev.date]) eventsMap[ev.date] = [];
                eventsMap[ev.date].push({
                    id: ev.id,
                    name: ev.name,
                    status: status,
                    isPaid: isPaid,
                    quoId: q.id,
                    clientName: q.data.client.name
                });
            }
        });
    });

    const renderCalendarDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-20 md:h-32 bg-gray-50 border-r border-b border-gray-100"></div>);
        }
        
        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            const dayEvents = eventsMap[dateKey] || [];

            days.push(
                <div key={i} className="min-h-[80px] md:h-32 bg-white border-r border-b border-gray-100 p-1 md:p-2 relative hover:bg-gray-50 transition-colors group">
                    <span className={`text-xs md:text-sm font-bold ${dayEvents.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{i}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] no-scrollbar">
                        {dayEvents.map((ev, idx) => {
                            // Color Logic
                            let bgClass = "bg-gray-200 text-gray-800 border-gray-300"; // Default
                            if (ev.status === 'Confirmed') {
                                bgClass = "bg-green-100 text-green-800 border-green-200";
                            } else if (ev.status === 'On Hold') {
                                bgClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
                            }

                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => handleEditQuotation(ev.quoId)}
                                    className={`text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 md:py-1 rounded border cursor-pointer truncate ${bgClass} hover:opacity-80 transition-opacity`}
                                    title={`${ev.name} - ${ev.clientName} (${ev.status})`}
                                >
                                    {ev.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Calendar Header */}
            <div className="p-4 flex flex-col md:flex-row justify-between items-center border-b gap-4">
                <div className="flex gap-2 items-center justify-between w-full md:w-auto">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft />
                    </button>
                    <h3 className="font-bold text-lg w-40 text-center">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronRight />
                    </button>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 text-[10px] md:text-xs">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 rounded"></div>Confirmed</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 rounded"></div>On Hold</div>
                </div>
            </div>

            {/* Scrollable Grid Container */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                <div className="overflow-x-auto h-full flex flex-col">
                    <div className="min-w-[700px] flex-1 flex flex-col">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b bg-gray-50">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="py-2 text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase">{d}</div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                            {renderCalendarDays()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const Dashboard = () => (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
            <p className="text-gray-500 text-sm">Manage your proposals and track events.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
             <div className="bg-gray-100 p-1 rounded-lg flex items-center flex-1 md:flex-none justify-center">
                <button onClick={() => setDashboardView('list')} className={`p-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${dashboardView === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                    <List size={16} /> List
                </button>
                <button onClick={() => setDashboardView('calendar')} className={`p-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${dashboardView === 'calendar' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                    <CalendarIcon size={16} /> Calendar
                </button>
             </div>
            <button onClick={handleCreateQuotation} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-sm transition-all flex-1 md:flex-none">
                <Plus size={18} /> <span className="whitespace-nowrap">New Quotation</span>
            </button>
        </div>
      </div>

      {dashboardView === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                    <th className="p-4 border-b">ID</th>
                    <th className="p-4 border-b">Client</th>
                    <th className="p-4 border-b">Date</th>
                    <th className="p-4 border-b">Amount</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {quotations.map(q => {
                        const statusColors: any = { 
                            Draft: 'bg-gray-100 text-gray-600',
                            Sent: 'bg-blue-100 text-blue-600',
                            Confirmed: 'bg-green-100 text-green-600', 
                            'On Hold': 'bg-yellow-100 text-yellow-800'
                        };
                        // Calculate quick total for dashboard view
                        const qTotal = calculateTotals(q.data).grandTotal;
                        
                        return (
                            <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono text-gray-500">{q.data.client.quoNumber}</td>
                                <td className="p-4 font-medium text-gray-800">{q.data.client.name}</td>
                                <td className="p-4 text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 font-medium text-gray-800">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(qTotal)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusColors[q.data.client.status] || 'bg-gray-100'}`}>
                                        {q.data.client.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2 flex justify-end">
                                    <button onClick={(e) => { e.stopPropagation(); setHistoryModalQuotationId(q.id); }} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors" title="View History">
                                        <Clock size={16} />
                                    </button>
                                    <button onClick={(e) => handleEditQuotation(q.id, e)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => handleDeleteQuotation(q.id, e)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {quotations.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400">No quotations found. Create one to get started.</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
      ) : (
          <CalendarView />
      )}
    </div>
  );

  // --- CRUD MASTERS ---
  const ClientManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientMaster | null>(null);
    const [formData, setFormData] = useState<ClientMaster>({ id: '', name: '', company: '', phone: '', email: '', notes: '' });

    const handleSave = () => {
        if (editingClient) {
            setClients(prev => prev.map(c => c.id === editingClient.id ? formData : c));
        } else {
            setClients(prev => [...prev, { ...formData, id: `c-${Date.now()}` }]);
        }
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete client?')) setClients(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
                <button onClick={() => { setFormData({ id: '', name: '', company: '', phone: '', email: '' }); setEditingClient(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Plus size={18} /> <span>Add Client</span>
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
                        <tr><th className="p-4">Name</th><th className="p-4">Company</th><th className="p-4">Phone</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y">
                        {clients.map(c => (
                            <tr key={c.id}>
                                <td className="p-4 font-medium">{c.name}</td>
                                <td className="p-4 text-gray-500">{c.company || '-'}</td>
                                <td className="p-4 text-gray-500">{c.phone}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => { setEditingClient(c); setFormData(c); setIsModalOpen(true); }} className="text-blue-600"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-600"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
                        <div className="space-y-3">
                            <input placeholder="Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input placeholder="Company" className="w-full border p-2 rounded" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                            <input placeholder="Phone" className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            <input placeholder="Email" className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const SkillManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState('');

    const handleSave = () => {
        if (formData.trim()) {
            setSkills(prev => [...prev, { id: `skill-${Date.now()}`, name: formData }]);
            setIsModalOpen(false);
            setFormData('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Skills</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Plus size={18} /> <span>Add Skill</span>
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-2">
                {skills.map(s => (
                    <div key={s.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 border">
                        {s.name}
                        <button onClick={() => { if(confirm('Delete?')) setSkills(prev => prev.filter(k => k.id !== s.id)); }} className="text-gray-400 hover:text-red-600"><X size={14}/></button>
                    </div>
                ))}
            </div>
             {/* Modal */}
             {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Add Skill</h3>
                        <input placeholder="Skill Name" className="w-full border p-2 rounded" value={formData} onChange={e => setFormData(e.target.value)} />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderTeamBuilder = (
    team: TeamMember[], 
    onChange: (newTeam: TeamMember[]) => void, 
    contextId: string,
    onCreateSkill: (name: string) => string | undefined // Returns ID
  ) => {
    return (
        <div className="space-y-2">
            {team.map((member, idx) => {
                const skill = skills.find(s => s.id === member.skillId);
                return (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 border rounded shadow-sm">
                        <span className="flex-1 text-sm font-medium">{skill?.name || 'Unknown Skill'}</span>
                        <button onClick={() => {
                            const newTeam = [...team];
                            if (member.count > 1) newTeam[idx].count--;
                            onChange(newTeam);
                        }} className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs hover:bg-gray-200">-</button>
                        <span className="text-sm w-4 text-center">{member.count}</span>
                        <button onClick={() => {
                            const newTeam = [...team];
                            newTeam[idx].count++;
                            onChange(newTeam);
                        }} className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs hover:bg-gray-200">+</button>
                        <button onClick={() => onChange(team.filter((_, i) => i !== idx))} className="text-red-500 ml-2 hover:text-red-700">
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
            
            {/* Inline Creation Input */}
            {activeSkillInputId === contextId ? (
                <div className="flex items-center gap-2 mt-2 p-1 bg-blue-50 rounded border border-blue-200">
                    <input 
                        autoFocus
                        value={tempSkillInput} 
                        onChange={e => setTempSkillInput(e.target.value)}
                        placeholder="New skill name..." 
                        className="flex-1 p-1 text-sm border-none bg-transparent focus:ring-0"
                    />
                    <button 
                        onClick={() => onCreateSkill(tempSkillInput)} 
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        Add
                    </button>
                    <button 
                        onClick={() => { setActiveSkillInputId(null); setTempSkillInput(''); }} 
                        className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <select 
                    className="w-full text-xs p-2 border border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-400 focus:outline-none"
                    value=""
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CREATE_NEW') {
                            setActiveSkillInputId(contextId);
                            setTempSkillInput('');
                        } else if (val) {
                            // Check if exists
                            if (!team.find(t => t.skillId === val)) {
                                onChange([...team, { skillId: val, count: 1 }]);
                            }
                        }
                    }}
                >
                    <option value="">+ Add Team Member</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="CREATE_NEW" className="font-bold text-blue-600">+ Create New Skill</option>
                </select>
            )}
        </div>
    );
  };

  const TemplateManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<EventTemplate>({ 
        id: '', name: '', defaultDuration: '', defaultCost: 0, defaultTeam: [] 
    });

    const handleSave = () => {
        if (editingId) {
            setTemplates(prev => prev.map(t => t.id === editingId ? formData : t));
        } else {
            setTemplates(prev => [...prev, { ...formData, id: `t-${Date.now()}` }]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Event Templates</h2>
                <button onClick={() => { setFormData({ id: '', name: '', defaultDuration: '', defaultCost: 0, defaultTeam: [] }); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Plus size={18} /> <span>Add Template</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                        <h3 className="font-bold text-gray-800">{t.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{t.defaultDuration} • Rs. {t.defaultCost}</p>
                        <div className="text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                            {t.defaultTeam.map(m => {
                                const s = skills.find(k => k.id === m.skillId);
                                return <div key={m.skillId}>{m.count} x {s?.name}</div>
                            })}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <button onClick={() => { setEditingId(t.id); setFormData(t); setIsModalOpen(true); }} className="p-1 bg-blue-100 text-blue-600 rounded"><Edit2 size={14} /></button>
                             <button onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))} className="p-1 bg-red-100 text-red-600 rounded"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Template' : 'Add Template'}</h3>
                        <div className="space-y-3">
                            <input placeholder="Template Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Duration" className="w-full border p-2 rounded" value={formData.defaultDuration} onChange={e => setFormData({...formData, defaultDuration: e.target.value})} />
                                <input type="number" placeholder="Cost" className="w-full border p-2 rounded" value={formData.defaultCost} onChange={e => setFormData({...formData, defaultCost: parseInt(e.target.value) || 0})} />
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded border">
                                <label className="text-xs font-bold uppercase block mb-2">Default Team</label>
                                {renderTeamBuilder(
                                    formData.defaultTeam, 
                                    (newTeam) => setFormData(prev => ({ ...prev, defaultTeam: newTeam })), 
                                    'template-editor',
                                    handleCreateAndAddSkillToTemplate
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderHistoryModal = () => {
    if (!historyModalQuotationId) return null;
    const q = quotations.find(x => x.id === historyModalQuotationId);
    if (!q) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setHistoryModalQuotationId(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">History Log</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">REF: {q.data.client.quoNumber}</p>
                    </div>
                    <button onClick={() => setHistoryModalQuotationId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {q.history.map(log => (
                        <div key={log.id} className="flex gap-3 text-sm">
                            <div className="w-8 flex flex-col items-center">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                                <div className="w-px h-full bg-blue-100 my-1" />
                            </div>
                            <div className="pb-4 flex-1">
                                <p className="text-xs text-gray-400 mb-1">{new Date(log.timestamp).toLocaleString()}</p>
                                <p className="font-medium text-gray-800">{log.user}</p>
                                <div className="text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100">{log.action}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };


  // --- WIZARD RENDERER ---
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Load Client */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Select Client</label>
                    <select onChange={(e) => handleSelectClient(e.target.value)} className="w-full p-2 rounded border border-blue-200 text-sm">
                        <option value="">-- Select --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="NEW_CLIENT" className="font-bold text-blue-600">+ Add New Client (Clear)</option>
                    </select>
                </div>
                <div className="text-blue-400 hidden md:block"><ChevronRight /></div>
                <div className="flex-1 text-xs text-blue-700">Select to auto-fill details from your database.</div>
            </div>

            {/* Client Details Section (Top) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Client Name</label>
                  <input type="text" name="name" value={data.client.name} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm font-bold" />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Company (Optional)</label>
                  <input type="text" name="company" value={data.client.company || ''} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone</label>
                  <input type="text" name="phone" value={data.client.phone} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                  <input type="email" name="email" value={data.client.email} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Client Address</label>
                  <input type="text" name="address" value={data.client.address || ''} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" placeholder="Street, City, State..." />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Event Locations</label>
                  <input type="text" name="locations" value={data.client.locations} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
               </div>
            </div>

            <hr className="border-gray-100" />

            {/* Quotation Metadata Section (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quotation No</label>
                  <input value={data.client.quoNumber} disabled className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed font-mono text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                  <select 
                    name="status" 
                    value={data.client.status} 
                    onChange={handleClientChange}
                    onBlur={() => saveQuotation()} 
                    className="w-full p-2 border rounded text-sm bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Date</label>
                  <input type="date" name="date" value={data.client.date} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valid Till</label>
                  <input type="date" name="validTill" value={data.client.validTill} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
               </div>
            </div>
          </div>
        );

      case 2: // EVENTS
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Add Template */}
            <div className="flex gap-2">
                 <select 
                    className="flex-1 p-2 border rounded text-sm"
                    onChange={(e) => {
                        const tmpl = templates.find(t => t.id === e.target.value);
                        if (tmpl) {
                            const newEvent: EventItem = {
                                id: `ev-${Date.now()}`,
                                name: tmpl.name,
                                isDateDecided: false, // Default to false
                                date: '',
                                timeRange: '',
                                isVenueDecided: false, // Default to false
                                venue: '',
                                duration: tmpl.defaultDuration,
                                team: [...tmpl.defaultTeam], // copy
                                notes: '',
                                approxCost: tmpl.defaultCost
                            };
                            setData(prev => ({ ...prev, events: [...prev.events, newEvent] }));
                            saveQuotation();
                        }
                    }}
                    value=""
                 >
                    <option value="">+ Add Event from Template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
                 <button 
                    onClick={() => setData(prev => ({ ...prev, events: [...prev.events, { id: `ev-${Date.now()}`, name: 'New Event', isDateDecided: false, date: '', timeRange: '', isVenueDecided: false, venue: '', duration: '', team: [], notes: '', approxCost: 0 }] }))}
                    className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium"
                 >
                    + Custom
                 </button>
            </div>

            {/* Event List */}
            {data.events.map((event, idx) => (
                <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm relative transition-all hover:shadow-md">
                    <button 
                        onClick={() => { if(confirm('Remove event?')) { setData(prev => ({...prev, events: prev.events.filter(e => e.id !== event.id)})); saveQuotation(); } }}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Event Details */}
                        <div className="md:col-span-7 grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Event Name</label>
                                <input className="w-full font-bold text-gray-800 border-b border-gray-200 focus:border-blue-500 outline-none py-1" value={event.name} onChange={e => {
                                    const newEvents = [...data.events]; newEvents[idx].name = e.target.value; setData({...data, events: newEvents});
                                }} onBlur={() => saveQuotation()} />
                            </div>

                            {/* Date Decided Checkbox */}
                            <div className="col-span-2 flex items-center gap-2 mb-1 mt-1">
                                <input type="checkbox" id={`date-decided-${event.id}`} checked={event.isDateDecided} onChange={e => {
                                    const newEvents = [...data.events]; newEvents[idx].isDateDecided = e.target.checked; setData({...data, events: newEvents}); saveQuotation();
                                }} />
                                <label htmlFor={`date-decided-${event.id}`} className="text-xs font-bold uppercase text-gray-500 cursor-pointer">Add Date & Time</label>
                            </div>

                            {event.isDateDecided ? (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Date</label>
                                        <input type="date" className="w-full text-sm border p-1 rounded" value={event.date} onChange={e => {
                                            const newEvents = [...data.events]; newEvents[idx].date = e.target.value; setData({...data, events: newEvents});
                                        }} onBlur={() => saveQuotation()} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Time</label>
                                        <input className="w-full text-sm border p-1 rounded" value={event.timeRange} onChange={e => {
                                            const newEvents = [...data.events]; newEvents[idx].timeRange = e.target.value; setData({...data, events: newEvents});
                                        }} onBlur={() => saveQuotation()} />
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2 bg-gray-50 border border-dashed border-gray-300 rounded p-2 text-xs text-gray-500 italic mb-2">
                                    Date & Time: To be confirmed by client
                                </div>
                            )}

                            {/* Venue Decided Checkbox */}
                            <div className="col-span-2 flex items-center gap-2 mb-1 mt-1">
                                <input type="checkbox" id={`venue-decided-${event.id}`} checked={event.isVenueDecided} onChange={e => {
                                    const newEvents = [...data.events]; newEvents[idx].isVenueDecided = e.target.checked; setData({...data, events: newEvents}); saveQuotation();
                                }} />
                                <label htmlFor={`venue-decided-${event.id}`} className="text-xs font-bold uppercase text-gray-500 cursor-pointer">Add Venue</label>
                            </div>

                            {event.isVenueDecided ? (
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Venue</label>
                                    <input className="w-full text-sm border p-1 rounded" value={event.venue} onChange={e => {
                                        const newEvents = [...data.events]; newEvents[idx].venue = e.target.value; setData({...data, events: newEvents});
                                    }} onBlur={() => saveQuotation()} />
                                </div>
                            ) : (
                                <div className="col-span-2 bg-gray-50 border border-dashed border-gray-300 rounded p-2 text-xs text-gray-500 italic mb-2">
                                    Venue: To be confirmed by client
                                </div>
                            )}

                             <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400">Duration</label>
                                <input className="w-full text-sm border p-1 rounded" value={event.duration} onChange={e => {
                                    const newEvents = [...data.events]; newEvents[idx].duration = e.target.value; setData({...data, events: newEvents});
                                }} onBlur={() => saveQuotation()} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400">Event Price / Cost (₹)</label>
                                <input type="number" className="w-full text-sm border p-1 rounded font-mono bg-yellow-50" value={event.approxCost} onChange={e => {
                                    const newEvents = [...data.events]; newEvents[idx].approxCost = parseFloat(e.target.value) || 0; setData({...data, events: newEvents});
                                }} onBlur={() => saveQuotation()} />
                            </div>
                        </div>
                        
                        {/* Team Builder */}
                        <div className="md:col-span-5 bg-gray-50 p-3 rounded border border-gray-100 flex flex-col">
                            <label className="text-[10px] font-bold uppercase text-gray-400 mb-2 flex items-center gap-1"><Users size={12}/> Team Requirements</label>
                            <div className="flex-1 overflow-y-auto max-h-[200px]">
                                {renderTeamBuilder(
                                    event.team, 
                                    (newTeam) => {
                                        const newEvents = [...data.events]; newEvents[idx].team = newTeam; setData({...data, events: newEvents});
                                        // Auto-save on team change is tricky due to UI lag, usually good to debounce or save on blur equivalents. 
                                        // Since these are buttons, we can trigger save.
                                        setTimeout(saveQuotation, 100); 
                                    },
                                    event.id,
                                    (name) => handleCreateAndAddSkill(name, event.id)
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        );
        
      case 3: // FINANCIALS
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* ADD ONS SECTION */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold uppercase text-purple-800">Additional Services (Add-ons)</h3>
                    <button onClick={() => {
                        const newAddOn: AddOn = { id: `add-${Date.now()}`, service: '', description: '', price: 0 };
                        setData(prev => ({ ...prev, addOns: [...prev.addOns, newAddOn] }));
                    }} className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-bold">+ Add Service</button>
                </div>
                {data.addOns.length === 0 && <p className="text-xs text-purple-400 italic text-center py-2">No add-ons included.</p>}
                
                <div className="space-y-2">
                    {data.addOns.map((addon, idx) => (
                        <div key={addon.id} className="flex flex-col md:flex-row gap-2 items-start">
                            <input className="flex-1 p-2 text-sm border rounded w-full" placeholder="Service Name (e.g. LED Wall)" value={addon.service} onChange={e => {
                                const arr = [...data.addOns]; arr[idx].service = e.target.value; setData({...data, addOns: arr});
                            }} />
                            <input className="flex-[2] p-2 text-sm border rounded w-full" placeholder="Description" value={addon.description} onChange={e => {
                                const arr = [...data.addOns]; arr[idx].description = e.target.value; setData({...data, addOns: arr});
                            }} />
                            <div className="flex gap-2 w-full md:w-auto">
                                <input type="number" className="w-24 p-2 text-sm border rounded font-mono flex-1 md:flex-none" placeholder="Price" value={addon.price} onChange={e => {
                                    const arr = [...data.addOns]; arr[idx].price = parseFloat(e.target.value) || 0; setData({...data, addOns: arr});
                                }} />
                                <button onClick={() => {
                                    setData(prev => ({...prev, addOns: prev.addOns.filter((_, i) => i !== idx)}));
                                }} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-bold uppercase text-yellow-800 mb-4">Package Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Package Title</label>
                        <input className="w-full p-2 border rounded font-medium" value={data.financials.packageName} onChange={e => setData({...data, financials: {...data.financials, packageName: e.target.value}})} onBlur={() => saveQuotation()}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Base Amount (Sum of Events)</label>
                        <input disabled className="w-full p-2 border rounded bg-gray-100 text-gray-500 font-mono cursor-not-allowed" value={data.financials.baseAmount} />
                        <p className="text-[10px] text-gray-400 mt-1">Auto-calculated from Event Costs</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount</label>
                        <input type="number" className="w-full p-2 border rounded font-mono" value={data.financials.discount} onChange={e => setData({...data, financials: {...data.financials, discount: parseFloat(e.target.value)||0}})} onBlur={() => saveQuotation()}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Advance Amount (₹)</label>
                        <input type="number" className="w-full p-2 border rounded font-mono" value={data.financials.advanceAmount} onChange={e => setData({...data, financials: {...data.financials, advanceAmount: parseFloat(e.target.value)||0}})} onBlur={() => saveQuotation()}/>
                    </div>
                </div>
                
                {/* Total Preview */}
                <div className="mt-4 pt-3 border-t border-yellow-200 text-sm flex flex-col gap-1 text-right">
                    <div className="text-gray-500">Add-ons Total: + {data.addOns.reduce((s,a) => s + (a.price||0), 0)}</div>
                    <div className="font-bold text-gray-800">Grand Total: {totals.grandTotal.toFixed(0)}</div>
                    {data.financials.advanceAmount > 0 && <div className="text-green-600 font-bold">Advance Paid: - {data.financials.advanceAmount}</div>}
                    <div className="text-red-600 font-bold border-t border-yellow-200 mt-1 pt-1">Balance Due: {totals.balanceDue.toFixed(0)}</div>
                </div>
            </div>
          </div>
        );
      
      case 4: // META
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="grid grid-cols-1 gap-4">
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Deliverables</label>
                    </div>
                    <textarea className="w-full p-2 border rounded text-sm h-24" value={data.meta.deliverables} onChange={e => setData({...data, meta: {...data.meta, deliverables: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>
                <div>
                     <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Delivery Timeline</label>
                    </div>
                    <textarea className="w-full p-2 border rounded text-sm h-20" value={data.meta.deliveryTimeline} onChange={e => setData({...data, meta: {...data.meta, deliveryTimeline: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1">Bank Details</label>
                    <textarea className="w-full p-2 border rounded text-sm h-24 font-mono" value={data.meta.bankDetails} onChange={e => setData({...data, meta: {...data.meta, bankDetails: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>
                
                {/* Payment Terms Section - Changed to single textarea */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Payment Terms</label>
                    </div>
                    <textarea className="w-full p-2 border rounded text-sm h-24" value={data.meta.paymentTerms} onChange={e => setData({...data, meta: {...data.meta, paymentTerms: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>

                <div>
                     <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Terms & Conditions</label>
                    </div>
                    <textarea className="w-full p-2 border rounded text-sm h-32" value={data.meta.terms} onChange={e => setData({...data, meta: {...data.meta, terms: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1">Client Signatory Name</label>
                        <input className="w-full p-2 border rounded text-sm" value={data.meta.clientSignName} onChange={e => setData({...data, meta: {...data.meta, clientSignName: e.target.value}})} onBlur={() => saveQuotation()} />
                    </div>
                     <div>
                        <label className="text-xs font-bold uppercase text-gray-500 mb-1">Studio Signatory Name</label>
                        <input className="w-full p-2 border rounded text-sm" value={data.meta.studioSignName} onChange={e => setData({...data, meta: {...data.meta, studioSignName: e.target.value}})} onBlur={() => saveQuotation()} />
                    </div>
                </div>
             </div>
          </div>
        );
      
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
        <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b p-4 flex justify-between items-center z-10">
                    <h1 className="font-bold text-gray-800">Mera Studio</h1>
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 relative">
                    {view === 'dashboard' && <Dashboard />}
                    {view === 'clients' && <ClientManager />}
                    {view === 'skills' && <SkillManager />}
                    {view === 'templates' && <TemplateManager />}
                    
                    {view === 'editor' && (
                        <div className="h-full flex flex-col">
                            {/* Editor Header */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 flex-shrink-0 gap-3">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { saveQuotation(); setView('dashboard'); }} className="p-2 hover:bg-white rounded-full transition-colors"><ChevronLeft /></button>
                                    <div>
                                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                            {data.client.name || 'New Quotation'}
                                            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{data.client.quoNumber}</span>
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex gap-2 self-end md:self-auto">
                                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 shadow-sm print:hidden">
                                        <Download size={16} /> <span className="hidden md:inline">Print / PDF</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Mobile Tabs */}
                            <div className="lg:hidden flex mb-4 bg-gray-200 p-1 rounded-lg">
                                <button 
                                    onClick={() => setMobileTab('form')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mobileTab === 'form' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                                >
                                    <PenTool size={14} /> Edit
                                </button>
                                <button 
                                    onClick={() => setMobileTab('preview')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mobileTab === 'preview' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                                >
                                    <Eye size={14} /> Preview
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                                {/* Left Panel: Form */}
                                <div className={`w-full lg:w-[45%] flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 lg:flex-shrink ${mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
                                    {/* Steps Nav */}
                                    <div className="flex border-b bg-gray-50 overflow-x-auto no-scrollbar">
                                        {['Client Details', 'Events & Team', 'Financials', 'Terms & Deliverables'].map((step, idx) => {
                                            const stepNum = idx + 1;
                                            const isActive = activeStep === stepNum;
                                            return (
                                                <button 
                                                    key={stepNum} 
                                                    onClick={() => setActiveStep(stepNum)}
                                                    className={`flex-1 p-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    {stepNum}. {step}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    
                                    {/* Scrollable Form Area */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {renderStepContent()}
                                    </div>
                                    
                                    {/* Form Footer Navigation */}
                                    <div className="p-4 border-t bg-gray-50 flex justify-between">
                                        <button 
                                            disabled={activeStep === 1} 
                                            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                                            className="px-4 py-2 rounded bg-white border hover:bg-gray-100 disabled:opacity-50 text-sm"
                                        >
                                            Back
                                        </button>
                                        <button 
                                            disabled={activeStep === 4} 
                                            onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
                                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>

                                {/* Right Panel: Live Preview */}
                                <div className={`flex-1 bg-gray-200 rounded-xl overflow-y-auto border border-gray-300 shadow-inner p-4 lg:p-8 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
                                    <div className="transform lg:scale-[0.85] origin-top overflow-x-auto">
                                        <PreviewSection data={data} totals={totals} skills={skills} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Overlay - Renders only when printing */}
            <div className="hidden print:block fixed inset-0 bg-white z-[100]">
                 <PreviewSection data={data} totals={totals} skills={skills} />
            </div>

            {renderHistoryModal()}
        </div>
    );
};

export default App;