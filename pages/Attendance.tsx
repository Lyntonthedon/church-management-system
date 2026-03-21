
import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, X, Loader2, Calendar, Users, TrendingUp } from 'lucide-react';
import { subscribeToCollection, addDocument } from '../services/firestoreService';

const Attendance: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: 'Sunday Service',
    date: new Date().toISOString().split('T')[0],
    totalCount: '',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection('attendance', (data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument('attendance', {
        ...formData,
        totalCount: parseInt(formData.totalCount)
      });
      setShowModal(false);
      setFormData({ serviceName: 'Sunday Service', date: new Date().toISOString().split('T')[0], totalCount: '', notes: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Log</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Track congregation growth and participation</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-2xl shadow-xl transition-all"
        >
          <Plus size={18} />
          <span>Record Count</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Service Type</th>
                <th className="px-8 py-5">Count</th>
                <th className="px-8 py-5">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center font-bold text-slate-300"><Loader2 className="animate-spin inline mr-2" /> Loading records...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center font-bold text-slate-400 italic">No attendance data recorded yet.</td></tr>
              ) : [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-slate-300" />
                      <span className="font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-900">{log.serviceName}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-indigo-600" />
                      <span className="text-xl font-black text-slate-900">{log.totalCount}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase">
                      <TrendingUp size={14} />
                      <span>Stable</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Record Attendance</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50" disabled={loading}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service/Event Name</label>
                <select value={formData.serviceName} onChange={(e) => setFormData({...formData, serviceName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black appearance-none">
                  <option>Sunday Service</option>
                  <option>Wednesday Mid-week</option>
                  <option>Night Vigil</option>
                  <option>Youth Meeting</option>
                  <option>Special Outreach</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Attendance</label>
                  <input required type="number" value={formData.totalCount} onChange={(e) => setFormData({...formData, totalCount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" placeholder="0" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Save Attendance</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
