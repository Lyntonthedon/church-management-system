
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Calendar, Settings as SettingsIcon, LogOut, ChevronRight, 
  Database, Waves, HeartHandshake, CheckSquare, Megaphone, Package, Heart, BookOpen, Award
} from 'lucide-react';
import { subscribeToCollection, updateDocument } from './services/firestoreService';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Finances from './pages/Finances';
import Events from './pages/Events';
import Settings from './pages/Settings';
import Baptism from './pages/Baptism';
import Certificates from './pages/Certificates';
import PastoralCare from './pages/PastoralCare';
import Attendance from './pages/Attendance';
import Announcements from './pages/Announcements';
import Inventory from './pages/Inventory';
import Counseling from './pages/Counseling';
import Library from './pages/Library';
import PrayerRequests from './pages/PrayerRequests';
import Chat from './pages/Chat';
import { OperationType } from './services/firestoreService';
import { Bell, MessageCircle } from 'lucide-react';

const App: React.FC<{user: any, onLogout: () => void}> = ({ user, onLogout }) => {
  const location = useLocation();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToCollection(
      'notifications', 
      (data) => {
        const filteredData = data.filter(n => n.userId === user.uid);
        const sortedData = [...filteredData].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setNotifications(sortedData.slice(0, 10));
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDocument('notifications', id, { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
    { path: '/chat', label: 'Community Chat', icon: MessageCircle, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
    { path: '/members', label: 'Congregation', icon: Users, roles: ['ADMIN', 'PASTOR'] },
    { path: '/attendance', label: 'Attendance', icon: CheckSquare, roles: ['ADMIN', 'PASTOR'] },
    { path: '/announcements', label: 'Broadcasting', icon: Megaphone, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
    { path: '/prayer', label: 'Prayer Altar', icon: Heart, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
    { path: '/pastoral', label: 'Outreach', icon: HeartHandshake, roles: ['ADMIN', 'PASTOR'] },
    { path: '/counseling', label: 'Counseling', icon: Heart, roles: ['ADMIN', 'PASTOR'] },
    { path: '/finances', label: 'Treasury', icon: Wallet, roles: ['ADMIN', 'PASTOR'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'PASTOR'] },
    { path: '/library', label: 'Media Library', icon: BookOpen, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
    { path: '/events', label: 'Calendar', icon: Calendar, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
    { path: '/baptism', label: 'Baptism', icon: Waves, roles: ['ADMIN', 'PASTOR'] },
    { path: '/certificates', label: 'Certificates', icon: Award, roles: ['ADMIN', 'PASTOR'] },
    { path: '/settings', label: 'Control Panel', icon: SettingsIcon, roles: ['ADMIN', 'PASTOR', 'MEMBER'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-blue-900 overflow-hidden">
      <aside className="w-64 bg-blue-50 border-r border-blue-200 flex flex-col shadow-2xl z-20">
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-xl">C</span>
            </div>
            <div>
              <h1 className="font-black text-blue-900 text-sm leading-none tracking-tight">CHURCH OS</h1>
              <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-1">Enterprise CMS</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-blue-700 hover:bg-blue-100'}`}>
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'group-hover:text-blue-800'} />
                    <span className="font-bold text-[11px]">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={12} />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-blue-200 bg-blue-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-black text-xs border-2 border-white shadow-sm">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-blue-900 truncate">{user.fullName}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-blue-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest transition-colors w-full">
            <LogOut size={14} /> <span>Terminate Session</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden bg-blue-100">
        <header className="h-14 bg-blue-50 border-b border-blue-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">
            {allNavItems.find(i => i.path === location.pathname)?.label || 'System Core'}
          </h2>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-blue-50">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Alerts & Reminders</h3>
                  <span className="text-[8px] font-bold text-blue-500 uppercase">{unreadCount} New</span>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-blue-300">
                      <Bell size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">All clear!</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 border-b border-blue-50 hover:bg-blue-50/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        <p className="text-[11px] font-black text-blue-900 mb-1">{n.title}</p>
                        <p className="text-[10px] text-blue-600 font-medium leading-tight">{n.message}</p>
                        <p className="text-[8px] text-blue-400 font-bold mt-2 uppercase">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[9px] font-black px-3 py-1 bg-blue-600 text-white rounded-full border border-blue-500 uppercase shadow-sm">
              <Database size={10} /> <span>Engine Online</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/pastoral" element={<PastoralCare />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/events" element={<Events />} />
            <Route path="/baptism" element={<Baptism />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/prayer" element={<PrayerRequests />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/counseling" element={<Counseling />} />
            <Route path="/library" element={<Library />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
export default App;