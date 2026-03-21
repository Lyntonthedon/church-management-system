
import React, { useState, useEffect } from 'react';
import { Plus, Award, X, Loader2, Download, Search, User, FileText, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { subscribeToCollection, addDocument } from '../services/firestoreService';

const Certificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    type: 'MEMBERSHIP',
    fullName: '',
    candidateId: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    signedBy: '',
    title: ''
  });

  const certificateTypes = [
    { id: 'MEMBERSHIP', label: 'Membership Certificate', color: 'blue' },
    { id: 'DEDICATION', label: 'Child Dedication', color: 'emerald' },
    { id: 'LEADERSHIP', label: 'Leadership Appointment', color: 'indigo' },
    { id: 'APPRECIATION', label: 'Certificate of Appreciation', color: 'amber' },
    { id: 'TRAINING', label: 'Training Completion', color: 'violet' },
  ];

  useEffect(() => {
    const unsubscribeCerts = subscribeToCollection('certificates', (data) => {
      setCertificates(data);
      setLoading(false);
    });

    const unsubscribeMembers = subscribeToCollection('members', (data) => {
      setMembers(data);
    });

    const unsubscribeSettings = subscribeToCollection('settings', (data) => {
      if (data.length > 0) setChurchInfo(data[0]);
    });

    return () => {
      unsubscribeCerts();
      unsubscribeMembers();
      unsubscribeSettings();
    };
  }, []);

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const member = members.find(m => m.id === e.target.value);
    if (member) {
      setFormData({ ...formData, candidateId: member.id, fullName: member.fullName });
    } else {
      setFormData({ ...formData, candidateId: '', fullName: '' });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDocument('certificates', formData);
      setShowModal(false);
      setFormData({
        type: 'MEMBERSHIP',
        fullName: '',
        candidateId: '',
        issueDate: new Date().toISOString().split('T')[0],
        description: '',
        signedBy: '',
        title: ''
      });
    } catch (error) {
      console.error("Error adding certificate:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const printCertificate = async (cert: any) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const member = members.find(m => m.id === cert.candidateId);
    const typeInfo = certificateTypes.find(t => t.id === cert.type);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const getFallbackDescription = (type: string) => {
      switch (type) {
        case 'MEMBERSHIP': return 'For being a faithful and committed member of our church community.';
        case 'DEDICATION': return 'In recognition of the dedication of this child to the Lord.';
        case 'LEADERSHIP': return 'For being appointed to a leadership position within the church.';
        case 'APPRECIATION': return 'For outstanding contribution and dedicated service to the church community.';
        case 'TRAINING': return 'For successful completion of the required training program.';
        default: return 'For outstanding contribution and dedicated service to the church community.';
      }
    };

    // Helper to render text with custom font using canvas
    const renderCustomFont = (text: string, font: string, size: number, color: string): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');
        canvas.width = 2000;
        canvas.height = 400;
        ctx.fillStyle = color;
        ctx.font = `${size * 4}px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        resolve(canvas.toDataURL('image/png'));
      });
    };
    
    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');

    // Main Gold Border
    doc.setDrawColor(197, 160, 82); // Gold
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 277, 190);
    
    // Inner Thin Border
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 273, 186);

    // Bottom Right Swooshes (Decorative)
    // Dark Burgundy Swoosh
    doc.setFillColor(45, 10, 45); // Dark Burgundy
    doc.setDrawColor(45, 10, 45);
    doc.triangle(297, 210, 297, 120, 150, 210, 'F');
    
    // Gold Swoosh
    doc.setFillColor(197, 160, 82); // Gold
    doc.triangle(297, 210, 297, 140, 180, 210, 'F');
    
    // Silver Swoosh
    doc.setFillColor(192, 192, 192); // Silver
    doc.triangle(297, 210, 297, 160, 210, 210, 'F');

    // Top Left Ribbon
    doc.setFillColor(45, 10, 45); // Dark Burgundy
    doc.rect(10, 30, 120, 15, 'F');
    // Ribbon tail
    doc.triangle(130, 30, 130, 45, 140, 37.5, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(typeInfo?.label.toUpperCase() || 'CERTIFICATE', 20, 40);

    // Header "CERTIFICATE"
    doc.setTextColor(30, 41, 59);
    doc.setFont('times', 'normal');
    doc.setFontSize(50);
    doc.text('CERTIFICATE', 35, 30);

    // Wreath and Year (Top Right)
    doc.setDrawColor(192, 192, 192); // Silver
    doc.setLineWidth(0.5);
    doc.circle(240, 35, 15);
    doc.setTextColor(192, 192, 192);
    doc.setFontSize(10);
    doc.text('2026', 240, 33, { align: 'center' });
    doc.text('AWARD', 240, 38, { align: 'center' });

    // "PROUDLY PRESENTED TO"
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PROUDLY PRESENTED TO', 148.5, 75, { align: 'center' });

    // Recipient Name with Great Vibes font using canvas
    const nameDataUrl = await renderCustomFont(cert.fullName, "'Great Vibes', cursive", 60, '#C5A052');
    if (nameDataUrl) {
      doc.addImage(nameDataUrl, 'PNG', (pageWidth - 180) / 2, 85, 180, 36);
    } else {
      doc.setTextColor(197, 160, 82); // Gold
      doc.setFont('times', 'italic');
      doc.setFontSize(65);
      doc.text(cert.fullName, 148.5, 105, { align: 'center' });
    }

    // Description
    doc.setTextColor(71, 85, 105);
    doc.setFont('times', 'normal');
    doc.setFontSize(16);
    const description = cert.description || getFallbackDescription(cert.type);
    doc.text(description, 148.5, 125, { align: 'center', maxWidth: 200 });

    // Signature Line (Bottom Left)
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(40, 180, 110, 180);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SIGNATURE', 75, 185, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.text(cert.signedBy || 'Lead Pastor', 75, 175, { align: 'center' });

    // Premium Award Seal (Bottom Right)
    const sealX = 240;
    const sealY = 165;
    doc.setFillColor(197, 160, 82); // Gold
    doc.circle(sealX, sealY, 18, 'F');
    doc.setFillColor(45, 10, 45); // Dark Burgundy
    doc.circle(sealX, sealY, 15, 'F');
    doc.setTextColor(197, 160, 82);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PREMIUM', sealX, sealY - 2, { align: 'center' });
    doc.text('AWARD', sealX, sealY + 3, { align: 'center' });
    // Stars in seal
    doc.setFontSize(12);
    doc.text('★★★', sealX, sealY - 7, { align: 'center' });
    doc.text('★★★', sealX, sealY + 10, { align: 'center' });

    doc.save(`${cert.type}_Certificate_${cert.fullName}.pdf`);
  };

  const filteredCerts = certificates.filter(c => 
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Certificate Center</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Generate official church recognition documents</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all flex items-center gap-2">
          <Plus size={18} />
          <span>Issue Certificate</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or certificate type..."
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Loader2 className="animate-spin inline mr-2" /> Loading Certificates...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[2.5rem] border border-slate-100 text-center">
            <Award size={48} className="text-slate-100 mx-auto mb-4" />
            <p className="font-black text-slate-400 italic">No certificates issued yet.</p>
          </div>
        ) : filteredCerts.map((cert) => {
          const typeInfo = certificateTypes.find(t => t.id === cert.type);
          const member = members.find(m => m.id === cert.candidateId);
          return (
            <div key={cert.id} className="bg-white rounded-[2rem] border border-slate-50 p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/20 to-transparent rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  cert.type === 'MEMBERSHIP' ? 'bg-blue-50 text-blue-600' :
                  cert.type === 'DEDICATION' ? 'bg-emerald-50 text-emerald-600' :
                  cert.type === 'LEADERSHIP' ? 'bg-indigo-50 text-indigo-600' :
                  cert.type === 'APPRECIATION' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                }`}>
                  <Award size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedCert(cert); setShowPreviewModal(true); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                    <Search size={16} />
                  </button>
                  <button onClick={() => printCertificate(cert)} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 transition-all">
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1 truncate pr-8">{cert.fullName}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{typeInfo?.label}</p>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                  {member?.image ? <img src={member.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-[10px]">{cert.fullName.charAt(0)}</div>}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-900 leading-none truncate">Issued On</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-1">{new Date(cert.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-slate-900">Issue New Certificate</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Certificate Type</label>
                  <select 
                    required 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold"
                  >
                    {certificateTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Custom Title (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Certificate of Excellence"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Member</label>
                  <select 
                    required 
                    value={formData.candidateId} 
                    onChange={handleMemberSelect}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold"
                  >
                    <option value="">-- Select Member --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Date</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.issueDate} 
                    onChange={(e) => setFormData({...formData, issueDate: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Signed By</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.signedBy} 
                    onChange={(e) => setFormData({...formData, signedBy: e.target.value})} 
                    placeholder="e.g. Rev. John Doe"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Certificate Description / Citation</label>
                  <textarea 
                    required 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Describe the reason for this certificate..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold min-h-[100px]" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                <span>Issue Certificate</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {showPreviewModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Certificate Preview</h3>
              <div className="flex gap-3">
                <button onClick={() => printCertificate(selectedCert)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs">
                  <Download size={14} /> <span>Download PDF</span>
                </button>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-12 bg-slate-100 overflow-auto max-h-[70vh] flex justify-center">
              {/* Premium Certificate Design UI */}
              <div className="bg-white w-[800px] h-[565px] relative shadow-2xl border-[12px] border-[#C5A052] p-1 shrink-0">
                <div className="w-full h-full border-2 border-[#C5A052] p-12 relative overflow-hidden">
                  {/* Decorative Swooshes */}
                  <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#2D0A2D] rotate-45 transform translate-x-20 translate-y-20"></div>
                  <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#C5A052] rotate-45 transform translate-x-10 translate-y-10"></div>
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#C0C0C0] rotate-45 transform"></div>

                  {/* Ribbon */}
                  <div className="absolute top-12 left-0 flex items-center">
                    <div className="bg-[#2D0A2D] text-white px-8 py-2 font-black text-[10px] tracking-widest uppercase">
                      {certificateTypes.find(t => t.id === selectedCert.type)?.label || 'CERTIFICATE'}
                    </div>
                    <div className="w-0 h-0 border-t-[18px] border-t-transparent border-b-[18px] border-b-transparent border-l-[15px] border-l-[#2D0A2D]"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h1 className="font-['Playfair_Display'] text-5xl text-slate-800 mb-12">
                      {selectedCert.type === 'APPRECIATION' ? 'CERTIFICATE' : selectedCert.type.split('_')[0]}
                    </h1>
                    
                    <div className="absolute top-0 right-0 text-center">
                      <div className="w-20 h-20 border-2 border-slate-200 rounded-full flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-300">2026</span>
                        <span className="text-[8px] font-black text-slate-300 tracking-widest">AWARD</span>
                      </div>
                    </div>

                    <div className="mt-20 text-center">
                      <p className="font-black text-slate-500 text-xs tracking-[0.3em] uppercase mb-8">PROUDLY PRESENTED TO</p>
                      <h2 className="font-['Great_Vibes'] text-7xl text-[#C5A052] mb-8">{selectedCert.fullName}</h2>
                      <p className="font-['Playfair_Display'] text-slate-600 text-sm max-w-lg mx-auto leading-relaxed italic">
                        {selectedCert.description || (
                          selectedCert.type === 'MEMBERSHIP' ? 'For being a faithful and committed member of our church community.' :
                          selectedCert.type === 'DEDICATION' ? 'In recognition of the dedication of this child to the Lord.' :
                          selectedCert.type === 'LEADERSHIP' ? 'For being appointed to a leadership position within the church.' :
                          selectedCert.type === 'TRAINING' ? 'For successful completion of the required training program.' :
                          'For outstanding contribution and dedicated service to the church community.'
                        )}
                      </p>
                    </div>

                    <div className="mt-24 flex justify-between items-end px-12">
                      <div className="text-center">
                        <div className="font-['Great_Vibes'] text-2xl text-slate-800 mb-1">{selectedCert.signedBy || 'Lead Pastor'}</div>
                        <div className="w-40 h-px bg-slate-300 mb-2"></div>
                        <p className="font-black text-slate-400 text-[8px] tracking-widest uppercase">SIGNATURE</p>
                      </div>
                      
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-[#C5A052] p-1">
                          <div className="w-full h-full rounded-full border-2 border-white/30 flex flex-col items-center justify-center bg-[#2D0A2D]">
                            <span className="text-[8px] font-black text-[#C5A052] tracking-tighter">PREMIUM</span>
                            <span className="text-[10px] font-black text-white tracking-widest">AWARD</span>
                            <div className="text-[#C5A052] text-[8px] mt-1">★★★★★</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
