
import React, { useState, useEffect } from 'react';
import { Heart, Send, User, Calendar, MessageSquare, Loader2, Plus, Trash2 } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, subscribeToCollection } from '../services/firestoreService';

interface PrayerRequest {
  id: string;
  userId: string;
  userName: string;
  request: string;
  category: string;
  status: 'PENDING' | 'PRAYED' | 'ANSWERED';
  createdAt: string;
  isAnonymous: boolean;
}

const PrayerRequests: React.FC = () => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRequest, setNewRequest] = useState('');
  const [category, setCategory] = useState('General');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCollection<Omit<PrayerRequest, 'id'>>('prayer_requests', (data) => {
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRequests(sortedData as PrayerRequest[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    setSubmitting(true);
    try {
      await addDocument<Omit<PrayerRequest, 'id' | 'createdAt'>>('prayer_requests', {
        userId: user.id || 'anonymous',
        userName: user.fullName || 'Anonymous',
        request: newRequest,
        category,
        status: 'PENDING',
        isAnonymous
      });
      setNewRequest('');
      setShowModal(false);
    } catch (error) {
      console.error('Error adding prayer request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prayer request?')) {
      try {
        await deleteDocument('prayer_requests', id);
      } catch (error) {
        console.error('Error deleting prayer request:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">PRAYER ALTAR</h1>
          <p className="text-blue-500 font-bold text-[10px] uppercase tracking-widest">Intercession & Spiritual Support</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>SUBMIT REQUEST</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-tight">
                    {req.isAnonymous ? 'Anonymous Member' : req.userName}
                  </h3>
                  <div className="flex items-center gap-2 text-[9px] text-blue-400 font-bold">
                    <Calendar size={10} />
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                req.status === 'ANSWERED' ? 'bg-green-100 text-green-600' :
                req.status === 'PRAYED' ? 'bg-blue-100 text-blue-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {req.status}
              </span>
            </div>

            <p className="text-xs text-blue-800 leading-relaxed mb-4 font-medium italic">
              "{req.request}"
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-blue-50">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                {req.category}
              </span>
              {(user.role === 'ADMIN' || user.role === 'PASTOR' || user.id === req.userId) && (
                <button
                  onClick={() => handleDelete(req.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-blue-100 animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Send size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">SUBMIT REQUEST</h2>
                  <p className="text-blue-500 font-bold text-[10px] uppercase tracking-widest">Share your burden with the church</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-blue-50 border border-blue-100 rounded-xl py-3 px-4 text-xs font-bold focus:border-blue-600 outline-none appearance-none text-blue-900"
                  >
                    <option value="General">General Prayer</option>
                    <option value="Healing">Healing & Health</option>
                    <option value="Financial">Financial Breakthrough</option>
                    <option value="Family">Family & Relationships</option>
                    <option value="Spiritual">Spiritual Growth</option>
                    <option value="Thanksgiving">Testimony & Thanksgiving</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2 ml-1">Your Request</label>
                  <textarea
                    required
                    value={newRequest}
                    onChange={(e) => setNewRequest(e.target.value)}
                    className="w-full bg-blue-50 border border-blue-100 rounded-xl py-3 px-4 text-xs font-bold focus:border-blue-600 outline-none min-h-[120px] text-blue-900"
                    placeholder="Type your prayer request here..."
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="anonymous" className="text-[10px] font-black text-blue-900 uppercase tracking-widest cursor-pointer">
                    Post Anonymously
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : (
                      <>
                        <span>SUBMIT TO ALTAR</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrayerRequests;
