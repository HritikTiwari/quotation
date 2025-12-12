import React from 'react';
import { QuotationData, CalculatedTotals, SkillMaster, TeamMember } from '../types';

interface PreviewProps {
  data: QuotationData;
  totals: CalculatedTotals;
  skills: SkillMaster[];
}

const PreviewSection: React.FC<PreviewProps> = ({ data, totals, skills }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderList = (text: string) => {
    return (
      <ul className="list-disc ml-5 mt-1 space-y-1">
        {text.split('\n').filter(line => line.trim() !== '').map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  };

  const renderTeamString = (team: TeamMember[]) => {
    if (!team || team.length === 0) return '-';
    return team.map(member => {
        const skillName = skills.find(s => s.id === member.skillId)?.name || 'Unknown Skill';
        return `${member.count} ${skillName}`;
    }).join(', ');
  };

  const addOnsTotal = data.addOns.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div id="printable-quotation" className="bg-white rounded-xl shadow-lg overflow-hidden max-w-[900px] mx-auto text-[#333] printable-area">
      
      {/* HEADER */}
      <div className="bg-[#ffd75b] p-6 flex justify-between items-start print:bg-[#ffd75b] print:text-black" style={{ backgroundColor: '#ffd75b', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Mera Studio & Films</h1>
          <p className="text-sm mt-1">Wedding • Pre-Wedding • Cinematic Films • Albums</p>
          <p className="text-sm">Varanasi • Lucknow • Pan India</p>
        </div>
        <div className="text-right">
          <div className="w-[120px] h-[65px] bg-white border border-dashed border-gray-800 rounded-lg flex items-center justify-center text-xs font-bold mb-2 ml-auto">
            <img src="https://picsum.photos/120/65?grayscale" alt="Logo" className="rounded-lg opacity-80" />
          </div>
          <p className="text-xs mb-0.5"><b>Quotation No:</b> {data.client.quoNumber}</p>
          <p className="text-xs mb-0.5"><b>Date:</b> {new Date(data.client.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="text-xs"><b>Prepared For:</b> {data.client.name.split('&')[0]}</p>
        </div>
      </div>

      {/* CLIENT INFO */}
      <div className="p-7 border-b border-gray-100">
        <h3 className="font-bold text-sm uppercase mb-3 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Client Information</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <p><b>Name:</b> {data.client.name}</p>
          <p><b>Company:</b> {data.client.company || '-'}</p>
          <p><b>Phone:</b> {data.client.phone}</p>
          <p><b>Email:</b> {data.client.email}</p>
          <p className="col-span-2"><b>Locations:</b> {data.client.locations}</p>
        </div>
      </div>

      {/* EVENTS */}
      <div className="p-7 border-b border-gray-100">
        <h3 className="font-bold text-sm uppercase mb-4 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Event Coverage Breakdown</h3>
        
        {data.events.map((event, index) => (
          <div key={event.id} className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm break-inside-avoid print:bg-gray-100">
            <div className="font-bold text-gray-900 mb-2">📍 {event.name || `Event ${index + 1}`}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              {event.isDateDecided && (
                  <p><b>Date:</b> {event.date} • <b>Time:</b> {event.timeRange}</p>
              )}
              {event.isVenueDecided && (
                  <p><b>Venue:</b> {event.venue}</p>
              )}
              <p><b>Coverage:</b> {event.duration}</p>
              <p><b>Price:</b> {formatCurrency(event.approxCost)}</p>
              <p className="md:col-span-2"><b>Team:</b> {renderTeamString(event.team)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PACKAGE SUMMARY */}
      <div className="p-7 border-b border-gray-100 break-inside-avoid">
        <h3 className="font-bold text-sm uppercase mb-3 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Package Summary</h3>
        
        <div className="bg-[#fff8dc] border border-[#f1d48a] rounded-lg p-4 text-sm print:bg-[#fff8dc]" style={{ backgroundColor: '#fff8dc', borderColor: '#f1d48a', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-gray-800">{data.financials.packageName}</span>
            <span>{formatCurrency(data.financials.baseAmount)}</span>
          </div>
          {data.financials.discount > 0 && (
            <div className="flex justify-between mb-2 text-green-700">
              <span>Discount</span>
              <span>- {formatCurrency(data.financials.discount)}</span>
            </div>
          )}
          {addOnsTotal > 0 && (
            <div className="flex justify-between mb-2 text-purple-700 font-medium">
              <span>Additional Services (Add-ons)</span>
              <span>+ {formatCurrency(addOnsTotal)}</span>
            </div>
          )}
          
          <div className="border-t border-[#c9b26a] my-2 pt-2 flex justify-between font-bold text-gray-900 text-base">
            <span>Grand Total</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>

          <div className="flex justify-between mb-2 text-green-700 font-medium">
            <span>Total Paid</span>
            <span>{formatCurrency(totals.totalPaid)}</span>
          </div>

           <div className="border-t border-[#c9b26a] mt-2 pt-2 flex justify-between font-bold text-red-600">
            <span>Balance Due</span>
            <span>{formatCurrency(totals.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* ADD ONS TABLE */}
      {data.addOns.length > 0 && (
        <div className="p-7 border-b border-gray-100 break-inside-avoid">
            <h3 className="font-bold text-sm uppercase mb-3 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Optional Add-ons</h3>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-left uppercase text-xs print:bg-gray-200">
                        <th className="p-2 border border-gray-200">Service</th>
                        <th className="p-2 border border-gray-200">Description</th>
                        <th className="p-2 border border-gray-200 text-right">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {data.addOns.map(addon => (
                        <tr key={addon.id}>
                            <td className="p-2 border border-gray-200 font-medium">{addon.service}</td>
                            <td className="p-2 border border-gray-200 text-gray-600">{addon.description}</td>
                            <td className="p-2 border border-gray-200 text-right font-mono">{formatCurrency(addon.price)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* DELIVERABLES */}
      <div className="p-7 border-b border-gray-100 break-inside-avoid">
        <h3 className="font-bold text-sm uppercase mb-3 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Final Deliverables</h3>
        <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-md text-sm text-gray-700 print:bg-gray-100">
            {renderList(data.meta.deliverables)}
        </div>
      </div>

      {/* PAYMENT & LOGISTICS */}
      <div className="p-7 border-b border-gray-100 break-inside-avoid">
        <h3 className="font-bold text-sm uppercase mb-3 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Payment Schedule & Logistics</h3>
        
        <div className="space-y-6">
            {/* Structured Payment Schedule */}
            <div>
                <table className="w-full text-sm border-collapse border border-gray-200 mb-4">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs uppercase print:bg-gray-200">
                      <th className="p-2 border">Phase / Milestone</th>
                      <th className="p-2 border text-right">Amount</th>
                      <th className="p-2 border text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.financials.paymentMilestones.map((ms) => (
                      <tr key={ms.id} className={ms.isPaid ? 'bg-green-50 print:bg-green-50' : ''}>
                        <td className="p-2 border font-medium">
                          {ms.name} 
                        </td>
                        <td className="p-2 border text-right font-mono">{formatCurrency(ms.amount)}</td>
                        <td className="p-2 border text-center">
                          {ms.isPaid ? (
                            <div className="flex flex-col items-center">
                              <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-bold rounded uppercase print:border print:border-green-600">Paid</span>
                              {ms.paidAt && <span className="text-[9px] text-gray-500 mt-0.5">{ms.paidAt}</span>}
                              {ms.method && <span className="text-[9px] text-gray-500">via {ms.method}</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Due</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>

            <div className="flex flex-row gap-8">
                <div className="flex-1 space-y-4 text-sm">
                    <div>
                        <p className="font-bold mb-1">Delivery Timeline</p>
                        <div className="text-gray-700 ml-4">{renderList(data.meta.deliveryTimeline)}</div>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Bank Details</p>
                        <pre className="text-gray-700 font-sans whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100 print:bg-gray-100">{data.meta.bankDetails}</pre>
                    </div>
                </div>

                <div className="w-[140px] flex flex-col items-center">
                    <p className="text-sm font-bold mb-2">UPI / QR</p>
                    <div className="w-full aspect-square border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-400">QR Code</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* TERMS */}
      <div className="p-7 border-b border-gray-100 break-inside-avoid">
        <h3 className="font-bold text-sm uppercase mb-3 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Terms & Conditions</h3>
        <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg print:bg-gray-100">
            {renderList(data.meta.terms)}
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="p-7 break-inside-avoid">
        <h3 className="font-bold text-sm uppercase mb-6 tracking-wide text-gray-800 border-l-4 border-[#ffd75b] pl-2" style={{ borderColor: '#ffd75b' }}>Approval</h3>
        <p className="text-sm text-gray-600 mb-8">By signing below, client confirms agreement with the quotation and terms.</p>
        
        <div className="flex justify-between gap-12 mt-12">
            <div className="flex-1 text-center">
                <div className="border-t border-gray-800 pt-2 text-sm font-bold">{data.meta.clientSignName || 'Client Signature'}</div>
                <div className="text-xs text-gray-500 uppercase">Client</div>
            </div>
            <div className="flex-1 text-center">
                <div className="border-t border-gray-800 pt-2 text-sm font-bold">{data.meta.studioSignName}</div>
                <div className="text-xs text-gray-500 uppercase">Authorized Signatory</div>
            </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#fffef4] border-t border-gray-200 p-4 text-center text-xs text-gray-500 print:bg-white">
        Your moments, our lens — Thank you for choosing Mera Studio & Films.
      </div>
    </div>
  );
};

export default PreviewSection;