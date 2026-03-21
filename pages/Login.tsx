
import React, { useState } from 'react';
import { KeyRound, Mail, Loader2, User, ShieldCheck, ArrowRight, Church, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get users from localStorage
      const storedUsers = JSON.parse(localStorage.getItem('church_mgmt_registered_users') || '[]');
      const user = storedUsers.find((u: any) => u.email === email && u.password === password);

      if (user) {
        const { password: _, ...userData } = user;
        localStorage.setItem('church_mgmt_user', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError('Invalid email or password.');
      }
    } catch (err: any) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (accessCode !== '39759298') {
      setError('Invalid System Access Code.');
      setLoading(false);
      return;
    }

    try {
      // Get existing users
      const storedUsers = JSON.parse(localStorage.getItem('church_mgmt_registered_users') || '[]');
      
      if (storedUsers.some((u: any) => u.email === email)) {
        setError('Email already registered.');
        setLoading(false);
        return;
      }

      const newUser = {
        uid: 'local_' + Date.now(),
        fullName,
        email,
        password,
        role,
        createdAt: new Date().toISOString()
      };

      storedUsers.push(newUser);
      localStorage.setItem('church_mgmt_registered_users', JSON.stringify(storedUsers));

      const { password: _, ...userData } = newUser;
      localStorage.setItem('church_mgmt_user', JSON.stringify(userData));
      onLogin(userData);
    } catch (err: any) {
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blue Particle Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[100px]"></div>
        <div className="absolute top-[30%] right-[10%] w-[10%] h-[10%] bg-blue-300 rounded-full blur-[50px]"></div>
      </div>

      <div className="max-w-[360px] w-full z-10 animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-50 rounded-[2rem] shadow-2xl p-6 border border-blue-200">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-700 rounded-xl text-white shadow-lg mb-3">
              <Church size={24} />
            </div>
            <h1 className="text-xl font-black text-blue-900 tracking-tight">
              {isRegister ? 'Setup Admin' : 'Church Manager'}
            </h1>
            <p className="text-blue-500 font-bold text-[9px] uppercase tracking-widest mt-1">
              {isRegister ? 'Authorized Installation' : 'Secure Management Portal'}
            </p>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-[9px] font-black border-l-4 border-red-500">
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="text" required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                    placeholder="Full Name"
                  />
                </div>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none appearance-none text-blue-900"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="PASTOR">Pastor</option>
                    <option value="MEMBER">Church Member</option>
                  </select>
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex bg-blue-100 p-1 rounded-lg mb-1">
                <div className="flex-1 py-1 text-[9px] font-black rounded-md bg-blue-600 text-white shadow-sm text-center">
                  EMAIL AUTHENTICATION
                </div>
              </div>
            )}

            {isRegister ? (
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                    placeholder="Email Address"
                  />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="password" required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                    placeholder="Password"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                    placeholder="Email Address"
                  />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="password" required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                    placeholder="Password"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                <input
                  type="password" required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-blue-100/50 border border-blue-300 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none placeholder:text-blue-400 text-blue-900"
                  placeholder="Required System Access Code"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-xs mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  <span>{isRegister ? 'Initialize System' : 'Sign In'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-blue-100 pt-4">
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setAccessCode('');
              }}
              className="text-[10px] font-black text-blue-600 hover:underline"
            >
              {isRegister ? 'Back to Login' : 'Register New Installation'}
            </button>
          </div>
        </div>
        <p className="text-center text-blue-400 text-[8px] font-bold mt-4 uppercase tracking-tighter opacity-80">
          Church Management Desktop v1.0.4 • Blue Engine Edition
        </p>
      </div>
    </div>
  );
};

export default Login;