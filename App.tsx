import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Zap, FileText, Plus, Trash2, Edit2, 
  ChevronRight, ChevronLeft, Save, Menu, X, Clock, Upload, CheckCircle, Search, AlertCircle, Download
} from 'lucide-react';
import { 
  INITIAL_QUOTATION, INITIAL_CLIENTS, INITIAL_SKILLS, INITIAL_EVENT_TEMPLATES 
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

  // Skill Creation UI State
  const [activeSkillInputId, setActiveSkillInputId] = useState<string | null>(null);
  const [tempSkillInput, setTempSkillInput] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load initial sample quotation if list is empty
    if (quotations.length === 0) {
      const initialRecord: QuotationRecord = {
        id: 'Q-SAMPLE-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: INITIAL_QUOTATION,
        history: [{
            id: 'h1',
            timestamp: new Date().toISOString(),
            user: 'System',
            action: 'Initial Quotation Created'
        }]
      };
      setQuotations([initialRecord]);
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
    
    // Taxable Amount (Package + Add-ons)
    const taxableAmount = packageAfterDiscount + totalAddOns;
    
    const gstAmount = (taxableAmount * q.financials.gstRate) / 100;
    const grandTotal = taxableAmount + gstAmount;
    
    const totalPaid = q.financials.paymentMilestones
        .filter(m => m.isPaid)
        .reduce((sum, m) => sum + m.amount, 0);

    const balanceDue = grandTotal - totalPaid;

    return {
        packageAfterDiscount,
        gstAmount,
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
    const client = clients.find(c => c.id === id);
    if (client) {
        setData(prev => ({
            ...prev,
            client: {
                ...prev.client,
                name: client.name,
                company: client.company || '',
                phone: client.phone,
                email: client.email
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

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
            <p className="text-gray-500 text-sm">Manage your proposals and track status.</p>
        </div>
        <button onClick={handleCreateQuotation} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 shadow-sm transition-all">
          <Plus size={18} /> <span>New Quotation</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                    const statusColors: any = { Draft: 'bg-gray-100 text-gray-600', Sent: 'bg-blue-100 text-blue-600', Accepted: 'bg-green-100 text-green-600', Rejected: 'bg-red-100 text-red-600' };
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
                <table className="w-full text-left text-sm">
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
                    <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Load Existing Client</label>
                    <select onChange={(e) => handleSelectClient(e.target.value)} className="w-full p-2 rounded border border-blue-200 text-sm">
                        <option value="">-- Select --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="text-blue-400 hidden md:block"><ChevronRight /></div>
                <div className="flex-1 text-xs text-blue-700">Select to auto-fill details from your database.</div>
            </div>

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
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
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

            <hr className="border-gray-100" />

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
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Event Locations</label>
                  <input type="text" name="locations" value={data.client.locations} onChange={handleClientChange} onBlur={() => saveQuotation()} className="w-full p-2 border rounded text-sm" />
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
                                date: '',
                                timeRange: '',
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
                    onClick={() => setData(prev => ({ ...prev, events: [...prev.events, { id: `ev-${Date.now()}`, name: 'New Event', date: '', timeRange: '', venue: '', duration: '', team: [], notes: '', approxCost: 0 }] }))}
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
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Venue</label>
                                <input className="w-full text-sm border p-1 rounded" value={event.venue} onChange={e => {
                                    const newEvents = [...data.events]; newEvents[idx].venue = e.target.value; setData({...data, events: newEvents});
                                }} onBlur={() => saveQuotation()} />
                            </div>
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
                        <div key={addon.id} className="flex gap-2 items-start">
                            <input className="flex-1 p-2 text-sm border rounded" placeholder="Service Name (e.g. LED Wall)" value={addon.service} onChange={e => {
                                const arr = [...data.addOns]; arr[idx].service = e.target.value; setData({...data, addOns: arr});
                            }} />
                            <input className="flex-[2] p-2 text-sm border rounded" placeholder="Description" value={addon.description} onChange={e => {
                                const arr = [...data.addOns]; arr[idx].description = e.target.value; setData({...data, addOns: arr});
                            }} />
                            <input type="number" className="w-24 p-2 text-sm border rounded font-mono" placeholder="Price" value={addon.price} onChange={e => {
                                const arr = [...data.addOns]; arr[idx].price = parseFloat(e.target.value) || 0; setData({...data, addOns: arr});
                            }} />
                            <button onClick={() => {
                                setData(prev => ({...prev, addOns: prev.addOns.filter((_, i) => i !== idx)}));
                            }} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
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
                </div>
                
                {/* Total Preview */}
                <div className="mt-4 pt-3 border-t border-yellow-200 text-sm flex flex-col gap-1 text-right">
                    <div className="text-gray-500">Add-ons Total: + {data.addOns.reduce((s,a) => s + (a.price||0), 0)}</div>
                    <div className="font-bold text-gray-800">Grand Total (Estimated): {totals.grandTotal.toFixed(0)}</div>
                </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold uppercase text-gray-700">Payment Milestones</h3>
                     <button onClick={() => {
                        const newMs: PaymentMilestone = { id: `pm-${Date.now()}`, name: 'New Phase', type: 'percentage', value: 0, amount: 0, dueDate: '', isPaid: false };
                        setData(prev => ({...prev, financials: {...prev.financials, paymentMilestones: [...prev.financials.paymentMilestones, newMs]}}));
                     }} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">+ Add Phase</button>
                </div>
                
                <div className="space-y-3">
                    {data.financials.paymentMilestones.map((ms, idx) => (
                        <div key={ms.id} className="border rounded p-3 bg-gray-50 relative">
                             <button onClick={() => {
                                 const newM = data.financials.paymentMilestones.filter(m => m.id !== ms.id);
                                 setData({...data, financials: {...data.financials, paymentMilestones: newM}});
                                 saveQuotation();
                             }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={14} /></button>

                             <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Phase Name</label>
                                    <input className="w-full text-sm border p-1 rounded" value={ms.name} onChange={e => {
                                        const arr = [...data.financials.paymentMilestones]; arr[idx].name = e.target.value;
                                        setData({...data, financials: {...data.financials, paymentMilestones: arr}});
                                    }} onBlur={() => saveQuotation()} />
                                </div>
                                <div className="w-24">
                                     <label className="text-[10px] uppercase font-bold text-gray-400">Type</label>
                                     <select className="w-full text-sm border p-1 rounded" value={ms.type} onChange={e => {
                                         const arr = [...data.financials.paymentMilestones]; arr[idx].type = e.target.value as any;
                                         // Recalc logic handled by effect or manual trigger could be added here for immediate feedback
                                         setData({...data, financials: {...data.financials, paymentMilestones: arr}});
                                     }} onBlur={() => saveQuotation()}>
                                        <option value="percentage">%</option>
                                        <option value="fixed">Fixed</option>
                                     </select>
                                </div>
                                <div className="w-24">
                                     <label className="text-[10px] uppercase font-bold text-gray-400">Value</label>
                                     <input type="number" className="w-full text-sm border p-1 rounded" value={ms.value} onChange={e => {
                                         const val = parseFloat(e.target.value) || 0;
                                         const arr = [...data.financials.paymentMilestones]; 
                                         arr[idx].value = val;
                                         // Immediate Calculation for UI responsiveness
                                         if (arr[idx].type === 'percentage') {
                                            arr[idx].amount = (totals.grandTotal * val) / 100;
                                         } else {
                                            arr[idx].amount = val;
                                         }
                                         setData({...data, financials: {...data.financials, paymentMilestones: arr}});
                                     }} onBlur={() => saveQuotation()} />
                                </div>
                                <div className="w-32">
                                     <label className="text-[10px] uppercase font-bold text-gray-400">Amount (₹)</label>
                                     <input disabled className="w-full text-sm border p-1 rounded bg-gray-100 text-gray-500" value={ms.amount.toFixed(0)} />
                                </div>
                                <div className="w-32">
                                     <label className="text-[10px] uppercase font-bold text-gray-400">Due Date</label>
                                     <input type="date" className="w-full text-sm border p-1 rounded" value={ms.dueDate} onChange={e => {
                                         const arr = [...data.financials.paymentMilestones]; arr[idx].dueDate = e.target.value;
                                         setData({...data, financials: {...data.financials, paymentMilestones: arr}});
                                     }} onBlur={() => saveQuotation()} />
                                </div>
                             </div>

                             {/* Payment Status Toggle */}
                             <div className="mt-3 pt-2 border-t border-gray-200 flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={ms.isPaid} onChange={e => {
                                        const arr = [...data.financials.paymentMilestones]; arr[idx].isPaid = e.target.checked;
                                        setData({...data, financials: {...data.financials, paymentMilestones: arr}});
                                        saveQuotation();
                                    }} />
                                    <span className={`text-sm font-bold ${ms.isPaid ? 'text-green-600' : 'text-gray-500'}`}>{ms.isPaid ? 'PAID' : 'Mark as Paid'}</span>
                                </label>
                                {ms.isPaid && (
                                    <>
                                        <select className="text-xs border p-1 rounded" value={ms.method || ''} onChange={e => {
                                            const arr = [...data.financials.paymentMilestones]; arr[idx].method = e.target.value as any; setData({...data, financials: {...data.financials, paymentMilestones: arr}}); saveQuotation();
                                        }}>
                                            <option value="">Method?</option>
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                        <input type="date" className="text-xs border p-1 rounded" value={ms.paidAt || ''} onChange={e => {
                                             const arr = [...data.financials.paymentMilestones]; arr[idx].paidAt = e.target.value; setData({...data, financials: {...data.financials, paymentMilestones: arr}}); saveQuotation();
                                        }} />
                                        <label className="text-xs text-blue-600 cursor-pointer flex items-center gap-1 hover:underline">
                                            <Upload size={12}/> {ms.proofFile ? 'Change Proof' : 'Upload Proof'}
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                if (e.target.files?.[0]) {
                                                    const base64 = await fileToBase64(e.target.files[0]);
                                                    const arr = [...data.financials.paymentMilestones]; arr[idx].proofFile = base64; 
                                                    setData({...data, financials: {...data.financials, paymentMilestones: arr}});
                                                    saveQuotation();
                                                }
                                            }} />
                                        </label>
                                    </>
                                )}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        );

      case 4: // META
        return (
            <div className="space-y-6 animate-fadeIn">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Deliverables (One per line)</label>
                    <textarea rows={6} className="w-full p-2 border rounded text-sm font-mono" value={data.meta.deliverables} onChange={e => setData({...data, meta: {...data.meta, deliverables: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Terms & Conditions</label>
                    <textarea rows={6} className="w-full p-2 border rounded text-sm font-mono" value={data.meta.terms} onChange={e => setData({...data, meta: {...data.meta, terms: e.target.value}})} onBlur={() => saveQuotation()} />
                </div>
            </div>
        );

      case 5: // PREVIEW
        return (
            <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                        <Download className="rotate-0" size={18} /> Download PDF
                    </button>
                </div>
                <PreviewSection data={data} totals={totals} skills={skills} />
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden print:h-auto print:overflow-visible">
      {renderHistoryModal()}
      
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:h-auto print:overflow-visible">
        {/* Top Mobile Bar */}
        <div className="bg-white p-4 border-b flex justify-between items-center md:hidden print:hidden">
            <h1 className="font-bold">Mera Studio</h1>
            <button onClick={() => setSidebarOpen(true)}><Menu /></button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 print:h-auto print:overflow-visible print:p-0">
            {view === 'dashboard' && <Dashboard />}
            {view === 'clients' && <ClientManager />}
            {view === 'skills' && <SkillManager />}
            {view === 'templates' && <TemplateManager />}
            
            {view === 'editor' && (
                <div className="max-w-4xl mx-auto flex flex-col h-full print:h-auto print:block">
                    {/* Editor Header */}
                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <button onClick={() => { saveQuotation(); setView('dashboard'); setActiveQuotationId(null); }} className="text-gray-500 hover:text-gray-800 flex items-center gap-1">
                            <ChevronLeft size={16} /> Back to Dashboard
                        </button>
                        <div className="flex gap-2">
                             <span className="text-xs text-gray-400 self-center">Auto-saving...</span>
                             <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16}/> Download / Print PDF</button>
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 print:border-none print:shadow-none print:h-auto">
                        <div className="flex border-b overflow-x-auto no-scrollbar print:hidden">
                            {[
                                {id:1, label:'Client'}, {id:2, label:'Events'}, {id:3, label:'Financials'}, {id:4, label:'Terms'}, {id:5, label:'Preview'}
                            ].map(step => (
                                <button 
                                    key={step.id} 
                                    onClick={() => setActiveStep(step.id)}
                                    className={`flex-1 min-w-[100px] py-3 text-sm font-medium border-b-2 transition-colors ${activeStep === step.id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    {step.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible print:h-auto">
                            {renderStepContent()}
                        </div>
                        
                        {/* Footer Nav */}
                        <div className="p-4 bg-gray-50 border-t flex justify-between print:hidden">
                             <button 
                                disabled={activeStep === 1}
                                onClick={() => setActiveStep(p => p - 1)}
                                className="px-4 py-2 text-gray-600 disabled:opacity-50"
                             >
                                Previous
                             </button>
                             <button 
                                disabled={activeStep === 5}
                                onClick={() => setActiveStep(p => p + 1)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                             >
                                Next Step
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;