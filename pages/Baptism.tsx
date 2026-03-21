
import React, { useState, useEffect } from 'react';
import { Plus, Waves, X, Loader2, Calendar, CheckCircle, Hash, CreditCard, Award } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { subscribeToCollection, addDocument } from '../services/firestoreService';

const Baptism: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    fullName: '', 
    baptismDate: '', 
    officiatedBy: '', 
    location: 'Main Sanctuary', 
    status: 'COMPLETED',
    memberId: '',
    candidateId: '' // The ID of the member from the directory
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection('baptisms', (data) => {
      setLogs(data);
      setLoading(false);
    }, [], (error) => {
      console.error("Error fetching baptisms:", error);
      setLoading(false);
    });

    // Fetch members for selection
    const unsubscribeMembers = subscribeToCollection('members', (data) => {
      setMembers(data);
    });

    // Fetch church info from settings
    const unsubscribeSettings = subscribeToCollection('settings', (data) => {
      if (data.length > 0) {
        setChurchInfo(data[0]);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeMembers();
      unsubscribeSettings();
    };
  }, []);

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const member = members.find(m => m.id === e.target.value);
    if (member) {
      setFormData({
        ...formData,
        candidateId: member.id,
        fullName: member.fullName,
        memberId: member.memberId || `BAP-${Math.floor(1000 + Math.random() * 9000)}`
      });
    } else {
      setFormData({
        ...formData,
        candidateId: '',
        fullName: '',
        memberId: `BAP-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDocument('baptisms', formData);
      setShowModal(false);
      setFormData({ 
        fullName: '', 
        baptismDate: '', 
        officiatedBy: '', 
        location: 'Main Sanctuary', 
        status: 'COMPLETED',
        memberId: '',
        candidateId: ''
      });
    } catch (error) {
      console.error("Error adding baptism record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const printCertificate = (log: any) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const member = members.find(m => m.id === log.candidateId);
    
    // Modern Background / Border
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 0, 297, 210, 'F');

    // Subtle Flower-like spots background
    const drawFlowerSpot = (x: number, y: number, size: number) => {
      doc.setFillColor(219, 234, 254); // blue-100
      // Center
      doc.circle(x, y, size * 0.4, 'F');
      // Petals
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const px = x + Math.cos(angle) * size * 0.6;
        const py = y + Math.sin(angle) * size * 0.6;
        doc.circle(px, py, size * 0.35, 'F');
      }
    };

    // Randomly place some flower spots
    const spots = [
      [30, 40, 5], [260, 50, 8], [50, 160, 6], [240, 170, 7],
      [148, 20, 4], [10, 100, 10], [280, 120, 9], [100, 190, 5],
      [200, 30, 6], [80, 60, 4], [220, 140, 5]
    ];
    
    doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
    spots.forEach(([x, y, s]) => drawFlowerSpot(x, y, s));
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    
    // Decorative elements
    doc.setDrawColor(37, 99, 235); // blue-600
    doc.setLineWidth(2);
    doc.line(10, 10, 287, 10); // Top
    doc.line(10, 200, 287, 200); // Bottom
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.rect(12, 12, 273, 186);
    
    // Church Logo (Left)
    if (churchInfo?.logo) {
      try {
        doc.addImage(churchInfo.logo, 'PNG', 25, 25, 25, 25);
      } catch (e) {
        console.error("Error adding church logo to PDF", e);
      }
    }

    // Member Image (Right)
    if (member?.image) {
      try {
        // Circular-ish frame for member image
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.rect(242, 25, 30, 35);
        doc.addImage(member.image, 'JPEG', 242, 25, 30, 35);
      } catch (e) {
        console.error("Error adding member image to PDF", e);
      }
    }

    // Header Content
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text(churchInfo?.churchName?.toUpperCase() || 'NAIROBI HOPE CHAPEL', 148.5, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(churchInfo?.branch?.toUpperCase() || 'MAIN BRANCH', 148.5, 42, { align: 'center' });

    // Main Title
    doc.setFontSize(48);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.setFont('times', 'bold');
    doc.text('Certificate of Baptism', 148.5, 75, { align: 'center' });
    
    // Body text
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('helvetica', 'normal');
    doc.text('This is to solemnly certify that', 148.5, 95, { align: 'center' });
    
    doc.setFontSize(36);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('times', 'bold');
    doc.text(log.fullName.toUpperCase(), 148.5, 115, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('Having publicly confessed faith in our Lord Jesus Christ,', 148.5, 130, { align: 'center' });
    doc.text(`was baptized by immersion on the ${new Date(log.baptismDate).toLocaleDateString()}`, 148.5, 138, { align: 'center' });
    doc.text(`at ${log.location}`, 148.5, 146, { align: 'center' });
    
    // Mission/Vision/Faith (Small text at bottom)
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'italic');
    const missionText = churchInfo?.mission ? `Mission: ${churchInfo.mission}` : '';
    const visionText = churchInfo?.vision ? `Vision: ${churchInfo.vision}` : '';
    const faithText = churchInfo?.faithStatement ? `Faith: ${churchInfo.faithStatement}` : '';
    
    let footerY = 185;
    if (missionText) doc.text(missionText, 148.5, footerY, { align: 'center', maxWidth: 250 });
    if (visionText) doc.text(visionText, 148.5, footerY + 4, { align: 'center', maxWidth: 250 });
    if (faithText) doc.text(faithText, 148.5, footerY + 8, { align: 'center', maxWidth: 250 });

    // Signatures
    doc.setDrawColor(203, 213, 225); // slate-200
    doc.setLineWidth(0.5);
    doc.line(40, 175, 110, 175);
    doc.line(187, 175, 257, 175);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIATING PASTOR', 75, 182, { align: 'center' });
    doc.text('CHURCH SECRETARY', 222, 182, { align: 'center' });
    
    doc.setFont('times', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(log.officiatedBy, 75, 172, { align: 'center' });
    
    doc.save(`Baptism_Certificate_${log.fullName}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Baptism Registry</h2><p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Baptismal records and certificate generation</p></div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all flex items-center gap-2"><Plus size={18} /><span>Register Candidate</span></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? ( <div className="col-span-full py-20 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Processing Records...</div> ) : logs.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[2.5rem] border border-blue-100 text-center"><Waves size={48} className="text-blue-100 mx-auto mb-4" /><p className="font-black text-slate-400">Registry Empty</p></div>
        ) : logs.map((log) => (
          <div key={log.id} className="bg-white rounded-[2rem] border border-blue-50 p-6 shadow-sm group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Waves size={24} /></div>
              <button onClick={() => printCertificate(log)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-black text-[10px]"><Award size={16} /><span>CERTIFICATE</span></button>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">{log.fullName}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">REG ID: {log.memberId}</p>
            <div className="space-y-3 pt-4 border-t border-blue-50">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-widest"><span>Date</span><span className="text-slate-900">{new Date(log.baptismDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-widest"><span>Officiator</span><span className="text-slate-900">{log.officiatedBy}</span></div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-blue-50 flex items-center justify-between"><h3 className="text-xl font-black text-slate-900">New Baptism Entry</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button></div>
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Member</label>
                <select 
                  required 
                  value={formData.candidateId} 
                  onChange={handleMemberSelect}
                  className="w-full px-5 py-4 bg-blue-50/50 border-2 border-blue-50 rounded-2xl focus:border-blue-600 outline-none font-bold"
                >
                  <option value="">-- Select Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Candidate Name (Auto-filled)</label><input readOnly value={formData.fullName} className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Baptism Date</label><input required type="date" value={formData.baptismDate} onChange={(e) => setFormData({...formData, baptismDate: e.target.value})} className="w-full px-5 py-4 bg-blue-50/50 border-2 border-blue-50 rounded-2xl focus:border-blue-600 outline-none font-bold" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Officiated By</label><input required value={formData.officiatedBy} onChange={(e) => setFormData({...formData, officiatedBy: e.target.value})} className="w-full px-5 py-4 bg-blue-50/50 border-2 border-blue-50 rounded-2xl focus:border-blue-600 outline-none font-bold" /></div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Generate Record</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Baptism;