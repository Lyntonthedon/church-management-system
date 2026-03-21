
import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Mail, Phone, MapPin, Briefcase, X, Download, Loader2, MessageCircle, Hash, Users as UsersIcon, Award, Edit2, Trash2, Skull } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../services/firestoreService';

const Members: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'deceased'>('all');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '',
    address: '',
    ministry: '',
    branch: 'Main Branch',
    status: 'active',
    familyId: '',
    spiritualMilestones: '',
    image: '',
    memberId: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCollection('members', (data) => {
      setMembers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    
    if (activeTab === 'deceased') {
      return matchesSearch && m.status === 'deceased';
    }
    return matchesSearch && m.status !== 'deceased';
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setFormData({ ...formData, image: event.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const milestones = typeof formData.spiritualMilestones === 'string' 
        ? formData.spiritualMilestones.split(',').map(s => s.trim()).filter(s => s !== '')
        : formData.spiritualMilestones;

      if (editMode && currentMemberId) {
        await updateDocument('members', currentMemberId, {
          ...formData,
          spiritualMilestones: milestones,
        });
      } else {
        await addDocument('members', {
          ...formData,
          spiritualMilestones: milestones,
          memberId: formData.memberId || `MEM-${Math.floor(1000 + Math.random() * 9000)}`
        });
      }
      
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: any) => {
    setEditMode(true);
    setCurrentMemberId(member.id);
    setFormData({
      ...member,
      spiritualMilestones: Array.isArray(member.spiritualMilestones) 
        ? member.spiritualMilestones.join(', ') 
        : member.spiritualMilestones || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try {
        await deleteDocument('members', id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const markAsDeceased = async (member: any) => {
    if (window.confirm(`Mark ${member.fullName} as deceased? This will move them to the deceased list.`)) {
      try {
        await updateDocument('members', member.id, { status: 'deceased' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentMemberId(null);
    setFormData({
      fullName: '', email: '', phone: '', gender: 'MALE', 
      dob: '', address: '', ministry: '', branch: 'Main Branch', status: 'active',
      familyId: '', spiritualMilestones: '', image: '', memberId: ''
    });
  };

  const openWhatsApp = (m: any) => {
    const url = `https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Greetings ${m.fullName}, we hope you're having a blessed day!`)}`;
    window.open(url, '_blank');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Church Member Directory', 14, 22);
    const tableData = members.map(m => [m.memberId || 'PENDING', m.fullName, m.email, m.phone, m.ministry || 'N/A', m.status]);
    (doc as any).autoTable({
      startY: 35,
      head: [['ID', 'Full Name', 'Email', 'Phone', 'Ministry', 'Status']],
      body: tableData,
      headStyles: { fillColor: [37, 99, 235] },
      theme: 'grid'
    });
    doc.save('church_members_directory.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Congregation Directory</h2>
          <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mt-1">Manage all church members and leaders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportPDF} className="flex items-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-200 text-blue-700 font-bold py-3 px-6 rounded-2xl transition-all shadow-sm">
            <Download size={18} />
            <span>Export PDF</span>
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all">
            <Plus size={18} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-blue-100 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400 hover:bg-blue-50'}`}
        >
          Active Members
        </button>
        <button 
          onClick={() => setActiveTab('deceased')}
          className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'deceased' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Skull size={14} />
          Deceased Members
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-[2rem] border border-blue-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, contact or location..."
            className="w-full pl-14 pr-4 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold text-blue-900 placeholder:text-blue-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-[2.5rem] border border-blue-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-100/50 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] border-b border-blue-200">
                <th className="px-8 py-5">Member</th>
                <th className="px-8 py-5">Contact Info</th>
                <th className="px-8 py-5 text-center">ID / Dept</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-blue-400 font-bold"><Loader2 className="animate-spin inline mr-2" /> Syncing Blue Directory...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={6} className="p-16 text-center text-blue-400 font-bold italic">No members found matching your search.</td></tr>
              ) : filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-blue-100/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all font-black overflow-hidden">
                        {m.image ? (
                          <img src={m.image} alt={m.fullName} className="w-full h-full object-cover" />
                        ) : (
                          m.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-black text-blue-900 leading-none">{m.fullName}</p>
                        <p className="text-[10px] text-blue-500 font-bold uppercase mt-1 tracking-wider">{m.branch}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-blue-700 text-xs font-bold">
                        <Mail size={14} className="text-blue-300" /> <span>{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-700 text-xs font-bold">
                        <Phone size={14} className="text-blue-300" /> <span>{m.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase mb-1">
                        <UsersIcon size={10} />
                        <span>{m.familyId || 'No Family'}</span>
                      </div>
                      <span className="text-xs font-black text-blue-800 bg-blue-200 px-3 py-1 rounded-lg">
                        {m.ministry || 'General'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                        m.status === 'active' ? 'bg-blue-200 text-blue-700' : 
                        m.status === 'deceased' ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-400'
                      }`}>
                        {m.status}
                      </span>
                      <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                        {m.spiritualMilestones?.map((ms: string, idx: number) => (
                          <span key={idx} className="flex items-center gap-1 text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                            <Award size={8} /> {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {m.status !== 'deceased' && (
                        <>
                          <button onClick={() => openWhatsApp(m)} className="p-2 text-blue-600 hover:bg-blue-200 rounded-xl transition-all" title="WhatsApp">
                            <MessageCircle size={18} />
                          </button>
                          <button onClick={() => markAsDeceased(m)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-all" title="Mark as Deceased">
                            <Skull size={18} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleEdit(m)} className="p-2 text-blue-600 hover:bg-blue-200 rounded-xl transition-all" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-blue-950/70 backdrop-blur-sm">
          <div className="bg-blue-50 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-blue-200">
            <div className="p-8 border-b border-blue-100 flex items-center justify-between bg-blue-100/30">
              <h3 className="text-xl font-black text-blue-900">{editMode ? 'Edit Member Info' : 'Add Congregation Member'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-blue-200 rounded-full transition-colors">
                <X size={24} className="text-blue-400" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-8 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="col-span-2 flex flex-col items-center mb-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl bg-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:border-blue-600 transition-all overflow-hidden"
                >
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <User size={32} className="text-blue-300 mx-auto" />
                      <span className="text-[8px] font-black text-blue-400 uppercase mt-1 block">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                <input required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Phone</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Ministry/Dept</label>
                <select value={formData.ministry} onChange={(e) => setFormData({...formData, ministry: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900">
                  <option value="">None / General</option>
                  <option value="CHOIR">Worship Team</option>
                  <option value="MEDIA">Media & IT</option>
                  <option value="USHERS">Protocol / Ushers</option>
                  <option value="CHILDREN">Sunday School</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="visitor">Visitor</option>
                  <option value="new_convert">New Convert</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Family/Household ID</label>
                <input type="text" value={formData.familyId} onChange={(e) => setFormData({...formData, familyId: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900" placeholder="e.g. FAM-001" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Spiritual Milestones</label>
                <input type="text" value={formData.spiritualMilestones} onChange={(e) => setFormData({...formData, spiritualMilestones: e.target.value})} className="w-full px-5 py-4 bg-blue-100 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-blue-900" placeholder="Baptism, Confirmation..." />
              </div>
              <div className="col-span-2 mt-4">
                <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  <span>{editMode ? 'Update Member Info' : 'Register Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
