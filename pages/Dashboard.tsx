
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  HandHeart, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Activity,
  Clock,
  Megaphone,
  Heart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { subscribeToCollection } from '../services/firestoreService';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [welfare, setWelfare] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');
  const isPrivileged = user.role === 'ADMIN' || user.role === 'PASTOR';

  useEffect(() => {
    const unsubMembers = subscribeToCollection('members', (data) => {
      setMembers(data);
      if (isPrivileged) updateActivities('Member', data);
    });

    let unsubFinances = () => {};
    if (isPrivileged) {
      unsubFinances = subscribeToCollection('finances', (data) => {
        setFinances(data);
        updateActivities('Finance', data);
      });
    }

    let unsubPastoral = () => {};
    if (isPrivileged) {
      unsubPastoral = subscribeToCollection('pastoral_care', (data) => {
        setWelfare(data);
        updateActivities('Care', data);
      });
    }

    let unsubInventory = () => {};
    if (isPrivileged) {
      unsubInventory = subscribeToCollection('inventory', (data) => {
        updateActivities('Inventory', data);
      });
    }

    let unsubLibrary = () => {};
    if (isPrivileged) {
      unsubLibrary = subscribeToCollection('library', (data) => {
        updateActivities('Library', data);
      });
    }

    let unsubBaptisms = () => {};
    if (isPrivileged) {
      unsubBaptisms = subscribeToCollection('baptisms', (data) => {
        updateActivities('Baptism', data);
      });
    }

    const unsubAnnouncements = subscribeToCollection('announcements', (data) => {
      setAnnouncements(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3));
    });

    const unsubPrayers = subscribeToCollection(
      'prayer_requests', 
      (data) => {
        // Filter locally if not privileged
        const filteredData = isPrivileged ? data : data.filter(r => r.userId === user.uid);
        setPrayerRequests(filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3));
      }
    );

    setLoading(false);

    return () => {
      unsubMembers();
      unsubFinances();
      unsubPastoral();
      unsubInventory();
      unsubLibrary();
      unsubBaptisms();
      unsubAnnouncements();
      unsubPrayers();
    };
  }, [isPrivileged, user.uid]);

  const updateActivities = (type: string, data: any[]) => {
    setActivities(prev => {
      const newActivities = data.map(item => ({
        id: item.id,
        type,
        title: item.fullName || item.name || item.title || item.description || 'New Entry',
        timestamp: item.createdAt || item.date || new Date().toISOString(),
        action: item.createdAt ? 'Added' : 'Updated'
      }));
      
      // Merge and take latest 5
      const merged = [...prev.filter(a => a.type !== type), ...newActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      
      return merged;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-blue-100">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="font-black text-blue-400 uppercase tracking-widest text-[10px]">Processing Blue-Engine Data...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalIncome = finances
    .filter(f => f.type !== 'expense')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  const totalExpenses = finances
    .filter(f => f.type === 'expense')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Prepare chart data for last 6 months
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthName = format(date, 'MMM');
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthFinances = finances.filter(f => {
      const fDate = f.date?.toDate ? f.date.toDate() : new Date(f.date);
      return isWithinInterval(fDate, { start, end });
    });

    const income = monthFinances
      .filter(f => f.type !== 'expense')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    const expenses = monthFinances
      .filter(f => f.type === 'expense')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    const monthMembers = members.filter(m => {
      const mDate = m.dateJoined?.toDate ? m.dateJoined.toDate() : new Date(m.dateJoined || 0);
      return mDate <= end;
    }).length;

    return { name: monthName, income, expenses, totalMembers: monthMembers };
  });

  // Calculate trends
  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return '+0%';
    const current = data[data.length - 1][key];
    const previous = data[data.length - 2][key];
    if (previous === 0) return current > 0 ? '+100%' : '+0%';
    const diff = ((current - previous) / previous) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const cards = [
    { label: 'Registered Members', value: members.length, icon: Users, color: 'bg-blue-600', trend: calculateTrend(chartData, 'totalMembers') },
    { label: 'Care Records', value: welfare.length, icon: HandHeart, color: 'bg-cyan-600', trend: '+2%' },
    { label: 'Total Income', value: `KES ${totalIncome.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-800', trend: calculateTrend(chartData, 'income') },
    { label: 'Total Expenses', value: `KES ${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: 'bg-indigo-600', trend: calculateTrend(chartData, 'expenses') },
  ];

  if (!isPrivileged) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2 tracking-tight">Welcome back, {user.fullName}!</h2>
            <p className="text-blue-100 font-bold text-xs uppercase tracking-widest">Your spiritual journey continues here.</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                <Megaphone size={20} className="text-blue-600" />
                Latest Announcements
              </h3>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Recently Posted</span>
            </div>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="py-10 text-center text-blue-300 font-bold text-[10px] uppercase tracking-widest">No announcements yet</div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">{ann.category}</span>
                      <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-black text-blue-900 mb-1">{ann.title}</h4>
                    <p className="text-xs text-blue-500 line-clamp-2 font-medium">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                <Heart size={20} className="text-blue-600" />
                My Prayer Requests
              </h3>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Latest Status</span>
            </div>
            <div className="space-y-4">
              {prayerRequests.length === 0 ? (
                <div className="py-10 text-center text-blue-300 font-bold text-[10px] uppercase tracking-widest">No prayer requests yet</div>
              ) : (
                prayerRequests.map((req) => (
                  <div key={req.id} className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-blue-900 mb-1 line-clamp-1">{req.request}</h4>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                      req.status === 'ANSWERED' ? 'bg-green-100 text-green-600' :
                      req.status === 'PRAYED' ? 'bg-blue-100 text-blue-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isPositive = card.trend.startsWith('+');
          return (
            <div key={idx} className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center text-[10px] font-black px-3 py-1.5 rounded-full ${isPositive ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {card.trend}
                </div>
              </div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
              <h3 className="text-2xl font-black text-blue-900 mt-1 tracking-tight">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-blue-50 p-8 rounded-[3rem] border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-blue-900 tracking-tight">Real Income vs Expenses (KES)</h3>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Last 6 Months</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#3b82f6', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#3b82f6', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#eff6ff'}}
                  contentStyle={{ backgroundColor: '#f0f9ff', borderRadius: '24px', border: '1px solid #bfdbfe', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1e3a8a' }}
                />
                <Bar dataKey="income" fill="#2563eb" radius={[10, 10, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#93c5fd" radius={[10, 10, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Live Activity
            </h3>
            <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full"></span>
          </div>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="py-10 text-center text-blue-300 font-bold text-[10px] uppercase tracking-widest">No recent activity</div>
            ) : (
              activities.map((activity, idx) => (
                <div key={`${activity.type}-${activity.id}-${idx}`} className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-blue-100 hover:border-blue-300 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{activity.type}</span>
                      <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">• {activity.action}</span>
                    </div>
                    <h4 className="text-xs font-black text-blue-900 mt-0.5 line-clamp-1">{activity.title}</h4>
                    <p className="text-[8px] font-bold text-blue-400 mt-1 uppercase tracking-widest">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-blue-50 p-8 rounded-[3rem] border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-blue-900 tracking-tight">Congregation Growth History</h3>
            <div className={`flex items-center gap-2 text-xs font-black text-blue-700`}>
              <TrendingUp size={16} />
              <span>{calculateTrend(chartData, 'totalMembers')}</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#3b82f6', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#3b82f6', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f0f9ff', borderRadius: '24px', border: '1px solid #bfdbfe', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1e3a8a' }}
                />
                <Area type="monotone" dataKey="totalMembers" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" name="Members" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;