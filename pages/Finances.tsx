import React, { useState, useEffect } from 'react';
import { Wallet, Search, Plus, Filter, FileSpreadsheet, X, Loader2, DollarSign, MessageCircle, CreditCard, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { subscribeToCollection, addDocument } from '../services/firestoreService';

const Finances: React.FC = () => {
  const [finances, setFinances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'income',
    memberId: '',
    method: 'cash',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection('finances', (data) => {
      setFinances(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument('finances', {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ 
        description: '', 
        amount: '', 
        category: '', 
        type: 'income', 
        memberId: '', 
        method: 'cash',
        notes: '' 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totals = finances.reduce((acc, f) => {
    if (f.type === 'expense') acc.expenses += f.amount;
    else acc.income += f.amount;
    return acc;
  }, { income: 0, expenses: 0 });

  // Income categories
  const incomeCategories = [
    'Tithe',
    'Offering',
    'Donation',
    'Pledge',
    'Special Event',
    'Building Fund',
    'Mission Fund',
    'Other Income'
  ];

  // Expense categories
  const expenseCategories = [
    'Salaries',
    'Utilities',
    'Rent',
    'Maintenance',
    'Outreach',
    'Events',
    'Equipment',
    'Transport',
    'Stationery',
    'Other Expense'
  ];

  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">Treasury Management</h2>
          <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mt-1">Financial stewardship in KES</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(finances);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Finances');
              XLSX.writeFile(wb, `church_finances_${new Date().toISOString().split('T')[0]}.xlsx`);
            }} 
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-200 text-blue-700 font-bold py-3 px-6 rounded-2xl transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} />
            <span>Export Report</span>
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black py-3 px-6 rounded-2xl shadow-xl transition-all"
          >
            <Plus size={18} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-8 rounded-[2.5rem] shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-1">Net Balance</p>
          <p className="text-3xl font-black">KES {(totals.income - totals.expenses).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-8 rounded-[2.5rem] border-l-4 border-l-green-500 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle className="text-green-600" size={20} />
            <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Total Income</p>
          </div>
          <p className="text-2xl font-black text-green-700">KES {totals.income.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-8 rounded-[2.5rem] border-l-4 border-l-red-500 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="text-red-600" size={20} />
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Total Expenses</p>
          </div>
          <p className="text-2xl font-black text-red-700">KES {totals.expenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-blue-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-200">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Method</th>
                <th className="px-8 py-5 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold"><Loader2 className="animate-spin inline mr-2" /> Loading...</td></tr>
              ) : finances.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-gray-400 font-bold italic">No financial transactions recorded.</td></tr>
              ) : finances.map((f) => {
                const fDate = new Date(f.date || f.createdAt);
                return (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5 text-xs font-bold text-gray-600">{fDate.toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <p className="font-black text-gray-900">{f.description}</p>
                      {f.notes && <p className="text-xs text-gray-400 mt-1">{f.notes}</p>}
                      {f.memberId && <span className="text-[9px] text-blue-400 uppercase">Member: {f.memberId}</span>}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        f.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {f.category || f.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1">
                        <CreditCard size={12} /> {f.method}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-right font-black text-lg ${f.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {f.type === 'expense' ? '-' : '+'}{f.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Record Transaction</h3>
                <p className="text-blue-200 font-bold text-[10px] uppercase tracking-widest mt-1">Financial Entry</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddFinance} className="p-8">
              {/* Transaction Type Toggle */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('income');
                    setFormData({...formData, type: 'income', category: ''});
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    transactionType === 'income' 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowUpCircle size={18} /> Income
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('expense');
                    setFormData({...formData, type: 'expense', category: ''});
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    transactionType === 'expense' 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowDownCircle size={18} /> Expense
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-900" 
                    placeholder="e.g., Sunday Offering, Electricity Bill"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Amount (KES)</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-900" 
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    required 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-900"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Payment Method</label>
                  <select 
                    value={formData.method} 
                    onChange={(e) => setFormData({...formData, method: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-900"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="online">Online Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Member ID (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.memberId} 
                    onChange={(e) => setFormData({...formData, memberId: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-900" 
                    placeholder="For member contributions"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
                  <textarea 
                    rows={3}
                    value={formData.notes} 
                    onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-900" 
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full mt-6 bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Record {transactionType === 'income' ? 'Income' : 'Expense'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finances;