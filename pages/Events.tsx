
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Clock, X, Loader2, Info, Tag, User, Bell } from 'lucide-react';
import { subscribeToCollection, addDocument, handleFirestoreError, OperationType } from '../services/firestoreService';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'service',
    organizer: '',
    status: 'upcoming'
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection('events', (data) => {
      setEvents(data);
      setLoading(false);
    }, [], (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });
    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument('events', formData);
      setShowModal(false);
      setFormData({ 
        title: '', 
        description: '', 
        date: '', 
        time: '', 
        location: '', 
        category: 'service', 
        organizer: '', 
        status: 'upcoming' 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');

  const handleSetReminder = async (event: any) => {
    if (!user?.uid) return;
    try {
      await addDocument('notifications', {
        userId: user.uid,
        title: `Reminder: ${event.title}`,
        message: `Don't forget! ${event.title} is happening on ${new Date(event.date).toLocaleDateString()} at ${event.time}.`,
        type: 'event_reminder',
        isRead: false,
        link: '/events'
      });
      alert('Reminder set successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Church Events</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Calendar and event planning</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-2xl shadow-xl transition-all"
        >
          <Plus size={18} />
          <span>New Event</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
          <Loader2 size={48} className="animate-spin mb-4" />
          <p className="font-bold">Syncing calendar...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <Calendar size={64} className="text-slate-100 mb-6" strokeWidth={1} />
          <h3 className="text-xl font-black text-slate-800 mb-2">No Scheduled Events</h3>
          <p className="text-slate-400 max-w-xs font-medium">Plan your next worship service or community outreach program today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="flex justify-between items-start mb-6 relative">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Calendar size={28} />
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  event.status === 'upcoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {event.status}
                </span>
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded tracking-tighter">
                    {event.category}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-8 font-medium leading-relaxed">{event.description || 'No description provided.'}</p>
                
                <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-4 text-slate-600 font-bold text-xs">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black">Date & Time</p>
                      <p>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 font-bold text-xs">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black">Location</p>
                      <p>{event.location}</p>
                    </div>
                  </div>
                  {event.organizer && (
                    <div className="flex items-center gap-4 text-slate-600 font-bold text-xs">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black">Organizer</p>
                        <p>{event.organizer}</p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => handleSetReminder(event)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    <Bell size={14} />
                    <span>Remind Me</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border-4 border-white">
            <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Create New Event</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Event Planning Module</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Event Title</label>
                  <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black text-lg" placeholder="e.g. Sunday Celebration Service" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Date</label>
                  <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Time</label>
                  <input required type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black">
                    <option value="service">Worship Service</option>
                    <option value="outreach">Outreach</option>
                    <option value="meeting">Meeting</option>
                    <option value="conference">Conference</option>
                    <option value="youth">Youth Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Organizer</label>
                  <input type="text" value={formData.organizer} onChange={(e) => setFormData({...formData, organizer: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black" placeholder="Ministry Head" />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Location</label>
                  <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black" placeholder="Main Sanctuary / Online" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-black resize-none" placeholder="Provide event details and agenda..."></textarea>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[1.5rem] shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 text-lg">
                {loading && <Loader2 className="animate-spin" size={24} />}
                <span>Publish Event</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
