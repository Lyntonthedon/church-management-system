
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Loader2, X, Wrench, Tag, Calendar, AlertCircle, UserPlus, RotateCcw, User } from 'lucide-react';
import { subscribeToCollection, addDocument, updateDocument } from '../services/firestoreService';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [issueTo, setIssueTo] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'AUDIO_VISUAL',
    value: '',
    condition: 'GOOD',
    location: 'Main Sanctuary',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    const unsubscribeItems = subscribeToCollection('inventory', (data) => {
      setItems(data);
      setLoading(false);
    });
    const unsubscribeMembers = subscribeToCollection('members', (data) => {
      setMembers(data);
    });
    return () => {
      unsubscribeItems();
      unsubscribeMembers();
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument('inventory', {
        ...formData,
        value: parseFloat(formData.value),
        status: 'AVAILABLE'
      });
      setShowModal(false);
      setFormData({ name: '', category: 'AUDIO_VISUAL', value: '', condition: 'GOOD', location: 'Main Sanctuary', status: 'AVAILABLE' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !issueTo) return;
    setLoading(true);
    try {
      const member = members.find(m => m.id === issueTo);
      await updateDocument('inventory', selectedItem.id, {
        status: 'ISSUED',
        issuedTo: member.fullName,
        issuedToId: member.id,
        issuedAt: new Date().toISOString()
      });
      setShowIssueModal(false);
      setSelectedItem(null);
      setIssueTo('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      await updateDocument('inventory', selectedItem.id, {
        status: 'AVAILABLE',
        issuedTo: null,
        issuedToId: null,
        issuedAt: null
      });
      setShowReturnModal(false);
      setSelectedItem(null);
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Asset & Inventory</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Church property and equipment management</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all flex items-center gap-2">
          <Plus size={18} /> <span>Register Asset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-300 font-black"><Loader2 className="animate-spin inline mr-2" /> Syncing Inventory...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
            <Package size={64} className="text-slate-100 mx-auto mb-4" strokeWidth={1} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Registry Empty</p>
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package size={24} />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.condition}
                </span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'AVAILABLE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  {item.status || 'AVAILABLE'}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">{item.name}</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-4">
              <Tag size={12} className="text-indigo-400" /> <span>{item.category.replace('_', ' ')}</span>
            </div>

            {item.status === 'ISSUED' && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight flex items-center gap-2">
                  <User size={12} /> Issued to: {item.issuedTo}
                </p>
                <p className="text-[8px] font-bold text-amber-600 mt-1 uppercase tracking-widest">
                  On {new Date(item.issuedAt).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase tracking-widest">Location</span>
                <span className="text-slate-900">{item.location}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase tracking-widest">Est. Value</span>
                <span className="text-indigo-600">KES {Number(item.value).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              {item.status === 'ISSUED' ? (
                <button 
                  onClick={() => { setSelectedItem(item); setShowReturnModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-black py-3 rounded-xl text-[10px] hover:bg-emerald-700 transition-all"
                >
                  <RotateCcw size={14} /> RETURN ITEM
                </button>
              ) : (
                <button 
                  onClick={() => { setSelectedItem(item); setShowIssueModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-3 rounded-xl text-[10px] hover:bg-indigo-600 transition-all"
                >
                  <UserPlus size={14} /> ISSUE TO MEMBER
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Asset Registration</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50" disabled={loading}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" placeholder="e.g. Yamaha Mixer MGP24X" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold">
                    <option value="AUDIO_VISUAL">A/V Equipment</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="MUSICAL">Instruments</option>
                    <option value="OFFICE">Office Supply</option>
                    <option value="VEHICLE">Church Vehicles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value (KES)</label>
                  <input required type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold" placeholder="0" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Add to Inventory</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Issue Asset</h3>
              <button onClick={() => setShowIssueModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50" disabled={loading}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleIssue} className="p-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Issuing: <span className="text-indigo-600 font-black">{selectedItem?.name}</span></p>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Member</label>
                <select required value={issueTo} onChange={(e) => setIssueTo(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold">
                  <option value="">Choose a member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.memberId})</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading || !issueTo} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Confirm Issuance</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Return Asset</h3>
              <button onClick={() => setShowReturnModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50" disabled={loading}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <RotateCcw size={48} className="text-emerald-600 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-tight">Confirm return of:</p>
                <h4 className="text-lg font-black text-slate-900 leading-tight mb-4">{selectedItem?.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Currently issued to: {selectedItem?.issuedTo}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowReturnModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={handleReturn} disabled={loading} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  <span>Confirm Return</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
