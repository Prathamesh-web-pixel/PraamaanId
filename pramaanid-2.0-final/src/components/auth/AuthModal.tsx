/**
 * Sovereign Authentication Modal
 * Allows custom credential login, new citizen account creation,
 * and quick-filling predefined sovereign test accounts.
 */

import React, { useState } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { X, Lock, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
        onClose();
      } else {
        const msg = await register(email, fullName, password);
        setSuccess(msg);
        setMode('LOGIN');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillPreset = (role: UserRole) => {
    const p = PRESET_ACCOUNTS[role];
    setEmail(p.email);
    setPassword(p.pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 relative shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-left">
          <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
            Sovereign Portal Gate
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">
            {mode === 'LOGIN' ? 'Identity Authentication' : 'Register Citizen Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'LOGIN'
              ? 'Sign in with your verified sovereign credentials'
              : 'Create a zero-trust citizen profile for identity document submission'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded transition-colors ${
              mode === 'LOGIN' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded transition-colors ${
              mode === 'REGISTER' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Citizen
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Legal Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikramaditya Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. citizen@pramaan.gov.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Password {mode === 'REGISTER' && <span className="text-[10px] text-slate-500">(Min 8 chars, Aa1#)</span>}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <Lock className="w-3.5 h-3.5" />
            {mode === 'LOGIN' ? 'Authenticate Session' : 'Create Citizen Account'}
          </button>
        </form>

        {/* Quick Fill Preset Accounts */}
        {mode === 'LOGIN' && (
          <div className="pt-3 border-t border-slate-800 space-y-2 text-left">
            <span className="text-[11px] font-medium text-slate-400 block">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['CITIZEN', 'VERIFIER', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'] as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => fillPreset(r)}
                  className="py-1 px-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 flex items-center justify-between text-left transition-colors"
                >
                  <span className="truncate">{r}</span>
                  <KeyRound className="w-2.5 h-2.5 text-slate-500 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
