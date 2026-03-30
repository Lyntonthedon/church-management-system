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
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[100px]"></div>
        <div className="absolute top-[30%] right-[10%] w-[10%] h-[10%] bg-blue-300 rounded-full blur-[50px]"></div>
      </div>

      <div className="max-w-[360px] w-full z-10 animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-50 rounded-[2rem] shadow-2xl p-6 border border-blue-200">
          
          {/* Header */}
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

          {/* Form */}
          <form onSubmit={isRegister ? handleRegister : handleSubmit} className="space-y-3">
            
            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-[9px] font-black border-l-4 border-red-500">
                {error}
              </div>
            )}

            {isRegister && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input
                    type="text"
                    required
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
              </>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                placeholder="Email Address"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-blue-100/50 border border-blue-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                placeholder="Password"
              />
            </div>

            {isRegister && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                <input
                  type="password"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-blue-100/50 border border-blue-300 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold focus:border-blue-600 outline-none text-blue-900"
                  placeholder="System Access Code"
                />
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  <span>{isRegister ? 'Initialize System' : 'Sign In'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
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

        {/* Footer Branding */}
        <div className="text-center mt-4 space-y-1">
          <p className="text-blue-400 text-[8px] font-bold uppercase tracking-tighter opacity-80">
            Church Management Desktop v1.0.4 • Blue Engine Edition
          </p>
          <p className="text-blue-500 text-[9px] font-extrabold tracking-wide">
            Powered by <span className="text-blue-700">Slyntos AI</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;