
import React, { useState, useEffect } from 'react';
import { Heart, Plus, Search, Loader2, X, Calendar, Clock, User, CheckCircle, MoreHorizontal } from 'lucide-react';
import { subscribeToCollection, addDocument } from '../services/firestoreService';

const Counseling: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    member: '',
    pastor: '',
    sessionDate: '',
    topic: 'SPIRITUAL_GROWTH',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection('counseling', (data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument('counseling', formData);
      setShowModal(false);
      setFormData({ member: '', pastor: '', sessionDate: '', topic: 'SPIRITUAL_GROWTH', notes: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Counseling Portal</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Confidential pastoral appointments and records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all flex items-center gap-2">
          <Plus size={18} /> <span>Book Session</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Session Date</th>
                <th className="px-8 py-5">Member</th>
                <th className="px-8 py-5">Pastor</th>
                <th className="px-8 py-5">Topic</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-300 uppercase text-[10px] font-black"><Loader2 className="animate-spin inline mr-2" /> Syncing appointments...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No counseling sessions recorded.</td></tr>
              ) : [...logs].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 text-xs text-slate-500">{new Date(log.sessionDate).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-slate-900">{log.member}</td>
                  <td className="px-8 py-6 text-indigo-600">{log.pastor}</td>
                  <td className="px-8 py-6 uppercase text-[9px] tracking-widest"><span className="bg-slate-100 px-2 py-1 rounded-lg">{log.topic.replace('_', ' ')}</span></td>
                  <td className="px-8 py-6 text-right"><button className="p-2 hover:bg-slate-100 rounded-xl"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Counseling Session</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50" disabled={loading}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Name</label>
                  <input required value={formData.member} onChange={(e) => setFormData({...formData, member: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" placeholder="Search member..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Pastor</label>
                  <input required value={formData.pastor} onChange={(e) => setFormData({...formData, pastor: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Date</label>
                <input required type="datetime-local" value={formData.sessionDate} onChange={(e) => setFormData({...formData, sessionDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Schedule Appointment</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Counseling;
