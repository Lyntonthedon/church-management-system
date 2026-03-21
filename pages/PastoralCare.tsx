
import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, X, Loader2, MessageCircle, Phone, Calendar, User, CheckCircle, Clock, Edit3, Trash2 } from 'lucide-react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../services/firestoreService';

const PastoralCare: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONVERT' | 'PRAYER' | 'VISITOR'>('CONVERT');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    type: 'CONVERT' as 'CONVERT' | 'PRAYER' | 'VISITOR',
    notes: '',
    status: 'PENDING' as 'PENDING' | 'FOLLOWED_UP' | 'COMPLETED',
    followUpDate: '',
    nextAction: ''
  });

  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');

  useEffect(() => {
    const unsubscribe = subscribeToCollection('pastoral_care', (data) => {
      setLogs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, [], (error) => {
      console.error("Error fetching pastoral care logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = {
    total: logs.filter(l => l.type === activeTab).length,
    pending: logs.filter(l => l.type === activeTab && l.status === 'PENDING').length,
    followedUp: logs.filter(l => l.type === activeTab && l.status === 'FOLLOWED_UP').length,
    completed: logs.filter(l => l.type === activeTab && l.status === 'COMPLETED').length,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDocument('pastoral_care', editingId, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDocument('pastoral_care', {
          ...formData,
          type: activeTab,
          assignedTo: user.id,
          createdAt: new Date().toISOString()
        });
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ 
        fullName: '', 
        phone: '', 
        type: activeTab, 
        notes: '', 
        status: 'PENDING',
        followUpDate: '',
        nextAction: ''
      });
    } catch (error) {
      console.error("Error saving pastoral record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (log: any) => {
    setEditingId(log.id);
    setFormData({
      fullName: log.fullName,
      phone: log.phone,
      type: log.type,
      notes: log.notes || '',
      status: log.status,
      followUpDate: log.followUpDate || '',
      nextAction: log.nextAction || ''
    });
    setShowModal(true);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDocument('pastoral_care', id, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDocument('pastoral_care', id);
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  const openWhatsApp = (log: any) => {
    let message = "";
    if (log.type === 'CONVERT') message = `Hi ${log.fullName}, we are so excited about your decision to follow Christ! We are here to support you in your new journey. Welcome to the family!`;
    if (log.type === 'VISITOR') message = `Hi ${log.fullName}, it was a blessing having you at our service! We hope you felt the love of God. We'd love to see you again soon.`;
    if (log.type === 'PRAYER') message = `Hi ${log.fullName}, we received your prayer request and our intercessory team is lifting you up today. God bless you!`;
    
    const url = `https://wa.me/${log.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredLogs = logs.filter(l => 
    l.type === activeTab && 
    (statusFilter === 'ALL' || l.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pastoral Care & Follow-up</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Nurturing souls and tracking spiritual growth</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ 
              fullName: '', 
              phone: '', 
              type: activeTab, 
              notes: '', 
              status: 'PENDING',
              followUpDate: '',
              nextAction: ''
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-2xl shadow-xl transition-all"
        >
          <Plus size={18} />
          <span>New Registration</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-600' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-600' },
          { label: 'Followed Up', value: stats.followedUp, color: 'bg-blue-100 text-blue-600' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-100 text-emerald-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} p-4 rounded-3xl border border-white/50 shadow-sm`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</p>
            <p className="text-2xl font-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-3xl w-fit shadow-sm overflow-x-auto max-w-full">
          {(['CONVERT', 'VISITOR', 'PRAYER'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {tab === 'CONVERT' ? 'New Converts' : tab === 'PRAYER' ? 'Prayer Requests' : 'First Timers'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none bg-transparent border-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="FOLLOWED_UP">Followed Up</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Loader2 className="animate-spin inline mr-2" /> Loading care logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[2.5rem] border border-slate-100 text-center">
            <HeartHandshake size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-400 italic">No {activeTab.toLowerCase()} records yet.</p>
          </div>
        ) : filteredLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-none">{log.fullName}</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{log.phone}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(log)}
                  className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  title="Edit Record"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => openWhatsApp(log)}
                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  title="WhatsApp Follow-up"
                >
                  <MessageCircle size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(log.id)}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  title="Delete Record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">{log.notes || 'No specific notes added.'}</p>
              </div>

              {log.nextAction && (
                <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Next Action</p>
                  <p className="text-xs text-indigo-900 font-bold">{log.nextAction}</p>
                  {log.followUpDate && (
                    <div className="flex items-center gap-1 mt-2 text-[9px] font-black text-indigo-400 uppercase">
                      <Calendar size={10} />
                      <span>Due: {new Date(log.followUpDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                    <Clock size={12} /> 
                    <span>Registered: {new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <select 
                    value={log.status}
                    onChange={(e) => handleStatusUpdate(log.id, e.target.value)}
                    className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest outline-none border-none cursor-pointer ${
                      log.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                      log.status === 'FOLLOWED_UP' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="FOLLOWED_UP">Followed Up</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{editingId ? 'Edit' : 'New'} {activeTab === 'VISITOR' ? 'Visitor' : activeTab === 'CONVERT' ? 'Convert' : 'Prayer Request'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingId ? 'Update' : 'Register'} for follow-up tracking</p>
              </div>
              <button onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes / Prayer Details</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Next Follow-up Action</label>
                  <input type="text" placeholder="e.g. Call to check in" value={formData.nextAction} onChange={(e) => setFormData({...formData, nextAction: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Follow-up Date</label>
                  <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({...formData, followUpDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{editingId ? 'Update Record' : 'Register for Follow-up'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastoralCare;
