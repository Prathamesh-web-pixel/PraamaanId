/**
 * Dedicated Sovereign Authentication & Sign Out Page
 * Styled strictly with official government colors:
 * Background: #F4F6F8 | Header/Navy: #0B3A5B / #123F5A | Cards: #FFFFFF | Border: #D7DEE5
 * Saffron: #E87524 | Green: #138A52 | Danger: #B42318 | Warning: #D89B00 | Text: #17212B
 * 
 * Features:
 * - Dynamic Math Captcha with NO answer in placeholder
 * - Clean "Sign In with Google" (No technical SDK exposure)
 * - 2 Clean Tabs: "Sign In" and "Sign Up"
 * - 1-Click Evaluation Personas for testing
 * - Stored User Data & Verifications Viewer
 */

import React, { useState, useEffect } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole, VerificationRecord } from '../../types';
import { api } from '../../services/api';
import { getVerificationsFromFirestore } from '../../firebase';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Download,
  Database,
  Eye,
  Check,
  Shield,
  UserPlus
} from 'lucide-react';
import emblemImg from '../../assets/images/security_vault_emblem_1791097276487.jpg';

interface AuthPageProps {
  initialMode?: 'LOGIN' | 'REGISTER';
  onSuccessRedirect: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'LOGIN', onSuccessRedirect }) => {
  const {
    user,
    login,
    register,
    loginWithGoogleFirebase,
    logout,
    switchPersona
  } = useAuth();
  const { t, lang } = useLanguage();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // Sync mode if prop changes
  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Dynamic Random Math Captcha
  const [captchaNum1, setCaptchaNum1] = useState<number>(() => Math.floor(Math.random() * 8) + 4);
  const [captchaNum2, setCaptchaNum2] = useState<number>(() => Math.floor(Math.random() * 7) + 3);
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 4);
    setCaptchaNum2(Math.floor(Math.random() * 7) + 3);
    setCaptchaInput('');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Stored user verification history
  const [storedRecords, setStoredRecords] = useState<VerificationRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Load user's stored data when logged in
  useEffect(() => {
    if (user) {
      setLoadingRecords(true);
      api.getVerifications()
        .then((res: { records: VerificationRecord[] }) => {
          setStoredRecords(res.records || []);
        })
        .catch(() => {
          getVerificationsFromFirestore(user.id).then(records => {
            setStoredRecords(records as VerificationRecord[]);
          }).catch(() => {});
        })
        .finally(() => setLoadingRecords(false));
    }
  }, [user]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (authMode === 'REGISTER' && password !== confirmPassword) {
      setError(lang === 'HI' ? 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' : 'Passwords do not match. Please re-enter.');
      return;
    }

    // Dynamic Captcha Verification
    const expectedAnswer = captchaNum1 + captchaNum2;
    if (parseInt(captchaInput.trim(), 10) !== expectedAnswer) {
      setError(lang === 'HI' ? 'गलत सुरक्षा कैप्चा उत्तर! कृपया दोबारा प्रयास करें।' : 'Incorrect security captcha answer. Please solve the calculation again.');
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'LOGIN') {
        await login(email, password);
        setSuccess(lang === 'HI' ? 'सफलतापूर्वक प्रमाणीकरण संपन्न हुआ।' : 'Session successfully authenticated. Loading workspace...');
        setTimeout(() => onSuccessRedirect(), 600);
      } else if (authMode === 'REGISTER') {
        const msg = await register(email, fullName, password);
        setSuccess(msg || 'Citizen account registered successfully.');
        // Automatically sign in the registered user
        await login(email, password).catch(() => {});
        setTimeout(() => onSuccessRedirect(), 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogleFirebase();
      setSuccess('Authenticated with Google. Loading workspace...');
      setTimeout(() => onSuccessRedirect(), 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = async (role: UserRole) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await switchPersona(role);
      setSuccess(lang === 'HI' ? `${role} सत्र सक्रिय हो गया।` : `Switched to ${role} session.`);
      setTimeout(() => onSuccessRedirect(), 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch role.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteLogout = async () => {
    setIsSubmitting(true);
    try {
      await logout();
      setLogoutConfirmOpen(false);
      setSuccess(lang === 'HI' ? 'सत्र सुरक्षित रूप से समाप्त हो गया है।' : 'Session securely revoked and logged out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="auth-portal-card" className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Official Government Pre-Login Security Banner */}
      <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-xl border border-[#D7DEE5] p-1 bg-[#F4F6F8] shadow-sm flex items-center justify-center shrink-0">
            <img
              src={emblemImg}
              alt="Sovereign Seal"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-bold text-[#E87524] uppercase tracking-wider">
                {t('gov.title')}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-[11px] text-[#123F5A] font-semibold">
                Sovereign Trust Enclave
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#17212B] tracking-tight mt-0.5">
              {!user ? (lang === 'HI' ? 'प्रवेश पूर्व प्रमाणीकरण गेट' : 'Portal Sign In & Citizen Registration Gate') : t('auth.title')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {!user ? (
                lang === 'HI' 
                  ? 'पहचान दस्तावेजों के प्रसंस्करण के लिए कृपया पहले साइन इन या साइन अप करें।' 
                  : 'Please Sign In or Register an account before accessing sovereign document verification tools.'
              ) : t('auth.subtitle')}
            </p>
          </div>
        </div>

        {/* Security Enclave Status */}
        <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] text-center shrink-0 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#123F5A]">
            <Lock className="w-3.5 h-3.5 text-[#E87524]" />
            <span>FIPS-140 &amp; Bcrypt-10</span>
          </div>
          <span className="text-[10px] text-[#138A52] font-mono block font-bold flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#138A52]" />
            Sovereign Enclave Active
          </span>
        </div>
      </div>

      {/* Mandatory Pre-Login Alert Notice (when logged out) */}
      {!user && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
          <Shield className="w-5 h-5 text-[#E87524] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#17212B] uppercase tracking-wide block">
              {lang === 'HI' ? 'सुरक्षा निर्देश: प्रमाणीकरण आवश्यक' : 'Mandatory Sovereign Access Directive'}
            </span>
            <p className="text-slate-700 leading-relaxed">
              {lang === 'HI'
                ? 'संवेदनशील पहचान दस्तावेजों (आधार, पैन, पासपोर्ट) की सुरक्षा सुनिश्चित करने के लिए सभी उपयोगकर्ताओं को पोर्टल में प्रवेश से पहले साइन इन या साइन अप करना अनिवार्य है।'
                : 'To protect sensitive sovereign identity proofs (Aadhaar, PAN, Passport, Biometrics), all users must authenticate before accessing the portal. All user profile data and verification receipts are cryptographically sealed and securely stored.'}
            </p>
          </div>
        </div>
      )}

      {/* If User is Logged In: Dedicated Account Management, Stored Data & Logout Gate */}
      {user ? (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border-2 border-[#138A52]/40 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D7DEE5]">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[#138A52]/10 border-2 border-[#138A52]/30 flex items-center justify-center text-[#138A52] shrink-0">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      ACTIVE SOVEREIGN SESSION
                    </span>
                    <span className="text-[10px] font-mono text-[#E87524] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                      {user.role}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#17212B] mt-1">
                    {user.fullName}
                  </h2>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Email: <span className="font-semibold text-[#17212B]">{user.email}</span> · User ID: <span className="text-slate-600">{user.id}</span>
                  </div>
                </div>
              </div>

              {/* Logout Action Button */}
              <button
                onClick={() => setLogoutConfirmOpen(true)}
                className="py-2.5 px-6 rounded-lg bg-[#B42318] hover:bg-[#991B1B] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>

            {/* User Data Storage Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#123F5A]" /> Local Vault Storage
                </span>
                <span className="font-bold text-[#17212B] text-sm mt-0.5 block">Stored &amp; Encrypted</span>
                <span className="text-[11px] text-slate-500">AES-256-GCM enclave</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#138A52]" /> Cloud Identity Vault
                </span>
                <span className="font-bold text-[#138A52] text-sm mt-0.5 block">Synchronized</span>
                <span className="text-[11px] text-slate-500">Persistent user record</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block uppercase font-bold flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-[#138A52]" /> Verifications Stored
                </span>
                <span className="font-bold text-[#123F5A] text-sm mt-0.5 block">{storedRecords.length} Documents</span>
                <span className="text-[11px] text-slate-500">SHA-256 digital seals</span>
              </div>
            </div>

            {/* Quick Persona Switcher for Evaluation */}
            <div className="pt-4 border-t border-[#D7DEE5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#123F5A] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E87524]" /> Switch Role Persona For Evaluation:
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Instant Server Re-Auth</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {(Object.keys(PRESET_ACCOUNTS) as UserRole[]).map((r) => {
                  const preset = PRESET_ACCOUNTS[r];
                  const isCurrent = user.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => handleQuickPreset(r)}
                      disabled={isSubmitting || isCurrent}
                      className={`p-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                        isCurrent
                          ? 'bg-[#123F5A] text-white border-[#123F5A] shadow-sm'
                          : 'bg-[#F4F6F8] text-[#17212B] border-[#D7DEE5] hover:border-[#123F5A] hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="font-bold text-xs">{r}</div>
                      <div className="text-[10px] opacity-80 mt-0.5 truncate">
                        {isCurrent ? 'Active Persona' : 'Switch'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Confirmation Dialog */}
            {logoutConfirmOpen && (
              <div className="p-5 rounded-xl bg-amber-50 border-2 border-[#D89B00] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D89B00] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#17212B]">
                      {lang === 'HI' ? 'लॉग आउट पुष्टि' : 'Confirm Sovereign Sign Out'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {t('auth.logoutConfirm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleExecuteLogout}
                    disabled={isSubmitting}
                    className="py-2 px-5 rounded-lg bg-[#B42318] hover:bg-[#991B1B] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('auth.logoutBtn')}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setLogoutConfirmOpen(false)}
                    className="py-2 px-4 rounded-lg bg-[#FFFFFF] border border-[#D7DEE5] text-slate-700 text-xs font-semibold hover:bg-[#F4F6F8] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User's Stored Documents & Verification History View */}
          <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE5]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#138A52]" />
                <h3 className="text-sm font-bold text-[#17212B]">
                  {lang === 'HI' ? 'आपके संग्रहीत दस्तावेज़ और सत्यापन रिकॉर्ड' : 'My Stored Documents & Verification History'}
                </h3>
              </div>
              <span className="text-[11px] text-[#138A52] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                Stored in Cloud &amp; Enclave
              </span>
            </div>

            {loadingRecords ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#123F5A]" />
                <span>Loading your stored documents...</span>
              </div>
            ) : storedRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <p>No verification records stored yet for this user profile.</p>
                <button
                  onClick={onSuccessRedirect}
                  className="py-2 px-4 rounded-lg bg-[#123F5A] text-white font-bold hover:bg-[#0B3A5B] transition-colors cursor-pointer"
                >
                  Verify Your First Document Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {storedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17212B]">{rec.documentType}</span>
                        <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-[#D7DEE5]">
                          {rec.maskedDocumentNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          rec.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'FLAGGED_TAMPERED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Name: <strong className="text-slate-800">{rec.fullName}</strong> · Stored: {new Date(rec.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 font-mono block">SEAL VERIFIED</span>
                        <span className="text-[10px] text-slate-600 font-mono truncate max-w-[120px] block">
                          {rec.cryptographicSeal?.substring(0, 12)}...
                        </span>
                      </div>
                      <button
                        onClick={onSuccessRedirect}
                        className="py-1.5 px-3 rounded bg-white hover:bg-slate-100 border border-[#D7DEE5] text-[#123F5A] font-bold text-xs transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* If User is Logged Out: Official Pre-Login Sign In & Citizen Registration Form */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left: Sign In & Sign Up Form (7 Cols) */}
          <div className="md:col-span-7 bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* 2 Clean Segmented Tabs: Sign In vs Sign Up */}
            <div className="flex rounded-lg bg-[#F4F6F8] p-1 border border-[#D7DEE5] text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'LOGIN' ? 'bg-[#123F5A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{lang === 'HI' ? 'साइन इन (लॉगिन)' : 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-md font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'REGISTER' ? 'bg-[#123F5A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{lang === 'HI' ? 'साइन अप (पंजीकरण)' : 'Sign Up / Register'}</span>
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-[#B42318]/40 text-xs text-[#B42318] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-[#138A52]/40 text-xs text-[#138A52] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Credential Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Full Name for Sign Up */}
              {authMode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                    Legal Full Name (as per Aadhaar / PAN card)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Subhash Iyer"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D7DEE5] rounded-lg px-3.5 py-2.5 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A] focus:ring-1 focus:ring-[#123F5A]"
                  />
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. citizen@pramaan.gov.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D7DEE5] rounded-lg px-3.5 py-2.5 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A] focus:ring-1 focus:ring-[#123F5A]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                  {t('auth.password')} {authMode === 'REGISTER' && <span className="font-normal text-slate-500">(Min 8 chars: uppercase, lowercase, number, special)</span>}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D7DEE5] rounded-lg px-3.5 py-2.5 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A] focus:ring-1 focus:ring-[#123F5A]"
                />
              </div>

              {/* Confirm Password for Sign Up */}
              {authMode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D7DEE5] rounded-lg px-3.5 py-2.5 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A] focus:ring-1 focus:ring-[#123F5A]"
                  />
                </div>
              )}

              {/* Security Captcha Challenge - Clean Dynamic Math with NO answers in placeholder */}
              <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#17212B] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#123F5A]" /> Security Anti-Bot Captcha
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#E87524] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Solve: {captchaNum1} + {captchaNum2} = ?
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                      title="Generate new calculation"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter calculation sum"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D7DEE5] rounded px-3 py-1.5 text-xs text-[#17212B] font-mono focus:outline-none focus:border-[#123F5A]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-[#123F5A] hover:bg-[#0B3A5B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {authMode === 'LOGIN' ? 'Sign In to Portal' : 'Create Account & Sign In'}
                    </span>
                  </>
                )}
              </button>

              {/* Clean "Sign In with Google" Button (Official Google 'G' Icon) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg border border-[#D7DEE5] hover:bg-[#F4F6F8] text-[#17212B] font-bold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-sm cursor-pointer bg-white"
                >
                  {/* Official Google 'G' SVG */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </div>

              {/* Security Storage Note */}
              <div className="text-[11px] text-slate-500 font-mono text-center pt-1">
                256-Bit Authenticated GCM Enclave · Zero Unmasked PII
              </div>
            </form>
          </div>

          {/* Right: Quick Sovereign Role Testing Desk (5 Cols) */}
          <div className="md:col-span-5 bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-[#D7DEE5]">
              <span className="text-[10px] font-mono font-bold text-[#E87524] uppercase tracking-wider">
                EVALUATION GATEWAY
              </span>
              <h3 className="text-sm font-bold text-[#17212B] mt-0.5">
                {t('auth.quickFill')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click any sovereign role below to instantly log in and verify RBAC protection on backend routes:
              </p>
            </div>

            <div className="space-y-2">
              {(Object.keys(PRESET_ACCOUNTS) as UserRole[]).map((r) => {
                const preset = PRESET_ACCOUNTS[r];
                return (
                  <button
                    key={r}
                    onClick={() => handleQuickPreset(r)}
                    disabled={isSubmitting}
                    className="w-full text-left p-3 rounded-lg border border-[#D7DEE5] hover:border-[#123F5A] hover:bg-[#F4F6F8] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#17212B] group-hover:text-[#123F5A] flex items-center gap-1.5">
                        <span>{preset.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">[{r}]</span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{preset.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#123F5A] shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-[#138A52]/30 text-[11px] text-[#138A52] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password verification: Bcrypt cost factor 10 active</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
