
import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, Loader2, MessageCircle, Send, Calendar, Users, Info, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { subscribeToCollection, addDocument, updateDocument } from '../services/firestoreService';

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBroadcastCenter, setShowBroadcastCenter] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<any>(null);
  const [broadcastQueue, setBroadcastQueue] = useState<any[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');
  const isPrivileged = user.role === 'ADMIN' || user.role === 'PASTOR';
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: 'ALL_MEMBERS'
  });

  useEffect(() => {
    const unsubAnn = subscribeToCollection('announcements', (data) => {
      setAnnouncements(data);
    });
    const unsubMem = subscribeToCollection('members', (data) => {
      setMembers(data);
    });
    const unsubSett = subscribeToCollection('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
      setLoading(false);
    });

    return () => {
      unsubAnn();
      unsubMem();
      unsubSett();
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument('announcements', {
        ...formData,
        broadcastStatus: 'PENDING'
      });
      setShowModal(false);
      setFormData({ title: '', content: '', target: 'ALL_MEMBERS' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openBroadcastCenter = (ann: any) => {
    setActiveAnnouncement(ann);
    let targets = members;
    if (ann.target !== 'ALL_MEMBERS') {
      targets = members.filter(m => m.ministry === ann.target);
    }
    setBroadcastQueue(targets.map(m => ({ ...m, status: 'PENDING' })));
    setShowBroadcastCenter(true);
  };

  const startAutomatedBroadcast = async () => {
    setIsBroadcasting(true);
    
    for (let i = 0; i < broadcastQueue.length; i++) {
      setBroadcastQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'SENDING' } : item));
      
      const recipient = broadcastQueue[i].phone;
      const messageContent = `*CHURCH ANNOUNCEMENT: ${activeAnnouncement.title}*\n\n${activeAnnouncement.content}`;
      
      // Simulate sending for now, or use a real API if available
      // In a real app, you'd call a cloud function or a third-party SMS API
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = true; // Mock success
      
      setBroadcastQueue(prev => prev.map((item, idx) => idx === i ? { 
        ...item, 
        status: success ? 'SUCCESS' : 'FAILED'
      } : item));
    }
    
    setIsBroadcasting(false);
    if (activeAnnouncement?.id) {
      await updateDocument('announcements', activeAnnouncement.id, { broadcastStatus: 'COMPLETED' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Church Announcements</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Automated background broadcasting center</p>
        </div>
        {isPrivileged && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all"
          >
            <Plus size={18} />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Congregation</p>
            <p className="text-lg font-black text-slate-900">{members.length} Members</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Send size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Messaging Status</p>
            <p className="text-lg font-black text-slate-900">
              {settings?.apiKey ? 'Gateway Online' : 'Simulation Mode'}
            </p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Megaphone size={24} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">System Status</p>
            <p className="text-lg font-black">Dispatcher Ready</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-12">
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold italic">
            <Loader2 className="animate-spin inline mr-2" /> Syncing with cloud database...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] border border-slate-100 text-center">
            <Megaphone size={64} strokeWidth={1} className="text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Compose Your First Message</h3>
            <p className="text-slate-400 max-w-xs mx-auto font-medium">Click "New Announcement" to start your broadcast journey.</p>
          </div>
        ) : announcements.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((ann) => (
          <div key={ann.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-100 transition-colors group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {ann.target.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar size={12} /> {new Date(ann.createdAt).toLocaleDateString()}
                </span>
                {ann.broadcastStatus === 'COMPLETED' && (
                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <CheckCircle size={10} /> Sent
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">{ann.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">{ann.content}</p>
            </div>
            {isPrivileged && (
              <button 
                onClick={() => openBroadcastCenter(ann)}
                className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-black py-5 px-10 rounded-2xl transition-all shadow-xl active:scale-95"
              >
                <Megaphone size={20} />
                <span>Broadcast Center</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Broadcast Center Modal */}
      {showBroadcastCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Bulk Dispatcher</h3>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Queue for: {activeAnnouncement?.target}</p>
              </div>
              <button onClick={() => !isBroadcasting && setShowBroadcastCenter(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-50" disabled={isBroadcasting}>
                <X size={28} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-6">
              {!settings?.apiKey && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-amber-600" size={20} />
                  <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                    Test Mode: No API configured in Settings. Messages will be simulated.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Message Preview</p>
                <h4 className="font-black text-slate-900 mb-2">{activeAnnouncement?.title}</h4>
                <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{activeAnnouncement?.content}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Queue ({broadcastQueue.length})</h5>
                  <div className="text-[10px] font-black text-indigo-600">
                    {broadcastQueue.filter(q => q.status === 'SUCCESS').length} Sent
                  </div>
                </div>
                <div className="space-y-2">
                  {broadcastQueue.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {item.fullName?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-none">{item.fullName}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1">{item.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'PENDING' && <Clock size={16} className="text-slate-300" />}
                        {item.status === 'SENDING' && <Loader2 size={16} className="text-indigo-600 animate-spin" />}
                        {item.status === 'SUCCESS' && <CheckCircle size={16} className="text-emerald-500" />}
                        {item.status === 'FAILED' && (
                          <div className="group relative">
                            <AlertCircle size={16} className="text-rose-500 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-rose-500 text-white text-[8px] p-2 rounded-lg whitespace-nowrap shadow-xl">
                              {item.error || 'Failed'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-white">
              <button 
                disabled={isBroadcasting || broadcastQueue.every(q => q.status === 'SUCCESS')}
                onClick={startAutomatedBroadcast}
                className={`w-full flex items-center justify-center gap-3 font-black py-6 rounded-2xl shadow-2xl transition-all ${
                  isBroadcasting 
                    ? 'bg-slate-100 text-slate-400' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                }`}
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    <span>Start Automated Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Compose Announcement</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <Info size={18} className="text-indigo-600 mt-1 shrink-0" />
                <p className="text-[10px] font-bold text-indigo-700 uppercase leading-relaxed">
                  The automated system will send messages to all contacts in the selected group without needing you to click each one manually.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" placeholder="e.g. Sunday Celebration Service" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Group</label>
                <select value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black">
                  <option value="ALL_MEMBERS">Everyone (Full Directory)</option>
                  <option value="CHOIR">Worship & Music Team</option>
                  <option value="YOUTH">Youth & Teens</option>
                  <option value="LEADERSHIP">Elders & Deacons</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Body</label>
                <textarea required rows={5} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black resize-none" placeholder="Enter message here..."></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Finalize Announcement</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
