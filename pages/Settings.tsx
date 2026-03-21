
import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Church, MapPin, Database, Save, Loader2, ShieldCheck, RefreshCw, Upload, DownloadCloud, Image as ImageIcon, MessageCircle, Key, Info, User, Users, Briefcase, Plus, Trash2, Package, Globe, Smartphone, Monitor } from 'lucide-react';
import { subscribeToCollection, updateDocument, addDocument, getCollection, deleteDocument } from '../services/firestoreService';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'LEADERSHIP' | 'SYSTEM' | 'DEPLOYMENT'>('PROFILE');
  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');
  
  const [settings, setSettings] = useState({
    id: '',
    churchName: '',
    branch: '',
    branchId: '',
    phone: '',
    address: '',
    currency: 'KES',
    logo: '',
    messagingProvider: 'NONE',
    apiKey: '',
    mission: '',
    vision: '',
    faithStatement: '',
    additionalInfo: ''
  });

  const [profile, setProfile] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    password: user.password || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  const [leadership, setLeadership] = useState<any[]>([]);
  const [newLeader, setNewLeader] = useState({ name: '', role: '', department: '' });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeSettings = subscribeToCollection('settings', (data) => {
      if (data.length > 0) setSettings(data[0]);
      setFetching(false);
    });

    const unsubscribeLeadership = subscribeToCollection('leadership', (data) => {
      setLeadership(data);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeLeadership();
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (settings.id) {
        await updateDocument('settings', settings.id, { ...settings, updatedAt: new Date().toISOString() });
      } else {
        await addDocument('settings', { ...settings, createdAt: new Date().toISOString() });
      }
      alert('Settings updated successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDocument('users', user.id, { ...profile, updatedAt: new Date().toISOString() });
      const updatedUser = { ...user, ...profile };
      localStorage.setItem('church_mgmt_user', JSON.stringify(updatedUser));
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeader.name || !newLeader.role) return;
    setLoading(true);
    try {
      await addDocument('leadership', { ...newLeader, createdAt: new Date().toISOString() });
      setNewLeader({ name: '', role: '', department: '' });
    } catch (error) {
      console.error("Error adding leader:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeader = async (id: string) => {
    if (window.confirm('Remove this leader?')) {
      await deleteDocument('leadership', id);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('church_mgmt_')) {
          backupData[key] = localStorage.getItem(key) || '';
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `church_mgmt_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setBackingUp(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("This will overwrite all current data. Are you sure?")) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('church_mgmt_')) keysToRemove.push(key);
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('church_mgmt_')) localStorage.setItem(key, value as string);
        });
        alert('Database restored successfully!');
        window.location.reload();
      } catch (error) {
        alert("Import failed.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setSettings({ ...settings, logo: event.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Settings & Control</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Personalize your experience and manage the system</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PROFILE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'}`}
          >
            <User size={14} /> <span>My Profile</span>
          </button>
          <button 
            onClick={() => setActiveTab('LEADERSHIP')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'LEADERSHIP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'}`}
          >
            <Users size={14} /> <span>Leadership</span>
          </button>
          {(user.role === 'ADMIN' || user.role === 'PASTOR') && (
            <>
              <button 
                onClick={() => setActiveTab('SYSTEM')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SYSTEM' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'}`}
              >
                <Database size={14} /> <span>System</span>
              </button>
              <button 
                onClick={() => setActiveTab('DEPLOYMENT')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'DEPLOYMENT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'}`}
              >
                <Package size={14} /> <span>Deployment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Personal Information</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input type="email" value={profile.email} disabled className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl font-bold text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input type="text" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-black" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Home Address</label>
                  <input type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-black" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Password (Leave blank to keep current)</label>
                  <input type="password" value={profile.password} onChange={(e) => setProfile({...profile, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-black" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Update Profile</span>
              </button>
            </form>
          </div>
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl">
              <h4 className="text-lg font-black mb-2 tracking-tight">Account Status</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-6">Verification Level</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center text-white">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <p className="text-xl font-black">{user.role}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">System Role</p>
                </div>
              </div>
              <p className="text-[10px] font-bold leading-relaxed opacity-80">
                Your account is active and verified. Depending on your role, you have access to specific modules of the Church Management System.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LEADERSHIP' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Church Leadership Structure</h3>
              </div>
              
              <div className="space-y-4">
                {leadership.map((leader) => (
                  <div key={leader.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200">
                        {leader.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">{leader.name}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{leader.role} • {leader.department}</p>
                      </div>
                    </div>
                    {(user.role === 'ADMIN' || user.role === 'PASTOR') && (
                      <button onClick={() => handleDeleteLeader(leader.id)} className="text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {leadership.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No leadership data defined</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {(user.role === 'ADMIN' || user.role === 'PASTOR') && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase">Add Leader</h4>
              </div>
              <form onSubmit={handleAddLeader} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                  <input type="text" required value={newLeader.name} onChange={(e) => setNewLeader({...newLeader, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-600 outline-none text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Role / Title</label>
                  <input type="text" required value={newLeader.role} onChange={(e) => setNewLeader({...newLeader, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-600 outline-none text-xs font-bold" placeholder="e.g. Head Usher" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Department</label>
                  <input type="text" value={newLeader.department} onChange={(e) => setNewLeader({...newLeader, department: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-blue-600 outline-none text-xs font-bold" placeholder="e.g. Protocol" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-[10px] uppercase tracking-widest mt-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Register Leader'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'SYSTEM' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Church size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Church Identity</h3>
              </div>
              
              <div className="mb-10 flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={40} className="text-slate-300" />
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-4">Profile Seal</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Official Church Name</label>
                    <input type="text" value={settings.churchName} onChange={(e) => setSettings({...settings, churchName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location / Branch</label>
                    <input type="text" value={settings.branch} onChange={(e) => setSettings({...settings, branch: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Base Currency</label>
                    <select disabled className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl font-black text-slate-400">
                      <option value="KES">KES</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mission Statement</label>
                    <textarea value={settings.mission} onChange={(e) => setSettings({...settings, mission: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black min-h-[80px]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vision Statement</label>
                    <textarea value={settings.vision} onChange={(e) => setSettings({...settings, vision: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black min-h-[80px]" />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageCircle size={20} className="text-indigo-600" />
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Messaging Gateway</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Provider</label>
                      <select value={settings.messagingProvider} onChange={(e) => setSettings({...settings, messagingProvider: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold text-black appearance-none">
                        <option value="NONE">Manual Mode</option>
                        <option value="META">Official Meta Cloud API</option>
                        <option value="TWILIO">Twilio Gateway</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  <span>Save All Settings</span>
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Database size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Maintenance</h3>
              </div>
              <div className="space-y-4">
                <button onClick={handleBackup} disabled={backingUp} className="w-full flex items-center justify-center gap-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black py-4 rounded-xl transition-all border border-emerald-200 text-[10px] uppercase tracking-widest">
                  {backingUp ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  <span>System Backup</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full flex items-center justify-center gap-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black py-4 rounded-xl transition-all border border-indigo-200 text-[10px] uppercase tracking-widest">
                  {importing ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                  <span>Restore Data</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DEPLOYMENT' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Build & Deployment Center</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generate installers for all platforms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Desktop EXE */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 mb-6">
                  <Monitor size={32} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase mb-2">Desktop Executable (.EXE)</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
                  Build a standalone Windows application with local database support.
                </p>
                <div className="w-full bg-slate-900 text-white p-3 rounded-xl font-mono text-[9px] mb-6 text-left">
                  npm run electron:build
                </div>
                <p className="text-[9px] font-bold text-slate-400 italic">Output: /dist_electron/*.exe</p>
              </div>

              {/* Mobile APK */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 mb-6">
                  <Smartphone size={32} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase mb-2">Android Package (.APK)</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
                  Generate an Android app using Capacitor. Requires Android Studio.
                </p>
                <div className="w-full bg-slate-900 text-white p-3 rounded-xl font-mono text-[9px] mb-6 text-left">
                  npm run mobile:sync
                </div>
                <p className="text-[9px] font-bold text-slate-400 italic">Output: /android/app/build/outputs/apk/</p>
              </div>

              {/* Website Link */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 mb-6">
                  <Globe size={32} />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase mb-2">Website & PWA</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
                  Deploy as a web app. Users can "Install" it as a PWA on any device.
                </p>
                <div className="w-full bg-slate-900 text-white p-3 rounded-xl font-mono text-[9px] mb-6 text-left">
                  npm run build
                </div>
                <p className="text-[9px] font-bold text-slate-400 italic">Output: /dist/ (Deploy to Cloud Run/Firebase)</p>
              </div>
            </div>

            <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-blue-900 uppercase tracking-tight mb-2">Important Note on Data</h5>
                  <p className="text-[10px] font-bold text-blue-700/70 leading-relaxed uppercase tracking-wide">
                    The current version uses a local storage engine for maximum privacy and offline capability. 
                    For multi-device synchronization across different platforms (e.g. phone and desktop), 
                    consider enabling the Firebase Cloud integration in the System tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
