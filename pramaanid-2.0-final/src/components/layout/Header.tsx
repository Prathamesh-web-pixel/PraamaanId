/**
 * Top Navigation Bar adhering to official Indian Government styling:
 * Header: #0B3A5B | Navy: #123F5A | Saffron: #E87524 | Green: #138A52
 * Clean UI without internal technical labels.
 */

import React, { useState } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  KeyRound,
  Sparkles,
  Lock,
  Globe,
  User,
  Check,
  UserPlus
} from 'lucide-react';
import emblemImg from '../../assets/images/security_vault_emblem_1791097276487.jpg';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string, authMode?: 'LOGIN' | 'REGISTER') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, switchPersona } = useAuth();
  const { t, lang, setLang, languages, currentLangInfo } = useLanguage();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const canAccessVerifier = user && ['VERIFIER', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const canAccessAdmin = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      
      {/* Official Top National Strip */}
      <div className="bg-[#082940] border-b border-[#123F5A] px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-300">
          
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#E87524]" />
            <span className="font-bold text-white tracking-wide">{t('gov.title')}</span>
            <span className="text-slate-500">·</span>
            <span className="hidden sm:inline text-slate-300">{t('gov.dept')}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Cryptographic Enclave Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <Lock className="w-3 h-3" />
              <span>{t('enclave.active')}</span>
            </div>

            {/* Functional Language Dropdown Selector in Utility Strip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setRoleDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 bg-[#123F5A] hover:bg-[#1A5375] text-white rounded px-2.5 py-1 border border-[#1A5375] text-[11px] font-bold transition-colors shadow-sm cursor-pointer"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#E87524]" />
                <span>{currentLangInfo.nativeName}</span>
                <span className="text-[10px] text-slate-400 font-mono">({currentLangInfo.code})</span>
                <ChevronDown className="w-3 h-3 text-slate-300 ml-0.5" />
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-[#D7DEE5] shadow-2xl p-1.5 z-50 text-[#17212B]"
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#D7DEE5] mb-1">
                    Select Language / भाषा चुनें
                  </div>
                  {languages.map((l) => {
                    const isSelected = lang === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 text-[#123F5A] font-bold border border-amber-200'
                            : 'text-slate-700 hover:bg-[#F4F6F8]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{l.nativeName}</span>
                          <span className="text-[11px] text-slate-400">({l.name})</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E87524]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main 3-Zone Government Navigation Bar */}
      <div className="bg-[#0B3A5B] border-b border-[#123F5A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Zone 1: Single Brand Element with Official Crest */}
          <button
            onClick={() => onSelectTab(user ? 'citizen' : 'auth')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-[#E87524] bg-white p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src={emblemImg}
                alt="PramaanID Sovereign Emblem"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
                PramaanID
              </span>
              <span className="hidden sm:block text-[10px] text-amber-300/80 font-mono tracking-wider uppercase">
                {lang === 'HI' ? 'राष्ट्रीय पहचान सत्यापन पोर्टल' : 'National Sovereign Identity Portal'}
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-200">
            {user ? (
              <>
                <button
                  onClick={() => onSelectTab('citizen')}
                  className={`transition-colors hover:text-white py-1.5 cursor-pointer ${
                    currentTab === 'citizen' ? 'text-amber-300 border-b-2 border-[#E87524]' : 'text-slate-200'
                  }`}
                >
                  {t('nav.verify')}
                </button>

                {canAccessVerifier && (
                  <button
                    onClick={() => onSelectTab('officer')}
                    className={`transition-colors hover:text-white py-1.5 cursor-pointer ${
                      currentTab === 'officer' ? 'text-amber-300 border-b-2 border-[#E87524]' : 'text-slate-200'
                    }`}
                  >
                    {t('nav.officer')}
                  </button>
                )}

                {canAccessAdmin && (
                  <button
                    onClick={() => onSelectTab('admin')}
                    className={`transition-colors hover:text-white py-1.5 cursor-pointer ${
                      currentTab === 'admin' ? 'text-amber-300 border-b-2 border-[#E87524]' : 'text-slate-200'
                    }`}
                  >
                    {t('nav.admin')}
                  </button>
                )}

                {canAccessAdmin && (
                  <button
                    onClick={() => onSelectTab('audit')}
                    className={`transition-colors hover:text-white py-1.5 cursor-pointer ${
                      currentTab === 'audit' ? 'text-amber-300 border-b-2 border-[#E87524]' : 'text-slate-200'
                    }`}
                  >
                    {t('nav.audit')}
                  </button>
                )}

                <button
                  onClick={() => onSelectTab('security')}
                  className={`transition-colors hover:text-white py-1.5 cursor-pointer ${
                    currentTab === 'security' ? 'text-amber-300 border-b-2 border-[#E87524]' : 'text-slate-200'
                  }`}
                >
                  {t('nav.security')}
                </button>

                <button
                  onClick={() => onSelectTab('auth')}
                  className={`transition-colors hover:text-white py-1.5 font-bold flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'auth' ? 'text-amber-300 border-b-2 border-[#E87524]' : 'text-[#E87524] hover:text-amber-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('nav.myAccount')} / {t('nav.logout')}</span>
                </button>
              </>
            ) : (
              // Pre-login state: Navigation links for visitors
              <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                <button
                  onClick={() => onSelectTab('auth', 'LOGIN')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-amber-200"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E87524]" />
                  <span>Sign In</span>
                </button>
                <span className="text-slate-500">·</span>
                <button
                  onClick={() => onSelectTab('auth', 'REGISTER')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-slate-200"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Register Citizen</span>
                </button>
                <span className="text-slate-500">·</span>
                <button
                  onClick={() => onSelectTab('security')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('nav.security')}
                </button>
              </div>
            )}
          </nav>

          {/* Zone 3: Primary Actions & User Profile Status */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setRoleDropdownOpen(!roleDropdownOpen);
                    setLangDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#123F5A] border border-[#1A5375] hover:border-amber-400 text-xs text-white transition-all shadow-sm cursor-pointer"
                  title="Switch Role Persona"
                >
                  <span className="w-2 h-2 rounded-full bg-[#138A52] animate-pulse" />
                  <span className="font-bold">{user.role}</span>
                  <span className="text-slate-400">|</span>
                  <span className="truncate max-w-[100px] text-slate-200">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {/* Persona Switcher Dropdown */}
                {roleDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#D7DEE5] shadow-2xl p-2 z-50 text-left text-[#17212B]"
                    onMouseLeave={() => setRoleDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[#D7DEE5] mb-1">
                      <p className="text-xs font-bold text-[#123F5A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E87524]" /> {t('auth.quickFill')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Switch roles to evaluate server authorization guards.
                      </p>
                    </div>

                    {(Object.keys(PRESET_ACCOUNTS) as UserRole[]).map((r) => {
                      const preset = PRESET_ACCOUNTS[r];
                      const isCurrent = user.role === r;
                      return (
                        <button
                          key={r}
                          onClick={async () => {
                            setRoleDropdownOpen(false);
                            await switchPersona(r);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-50 text-[#123F5A] font-bold border border-amber-200'
                              : 'text-slate-700 hover:bg-[#F4F6F8]'
                          }`}
                        >
                          <UserCheck className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isCurrent ? 'text-[#E87524]' : 'text-slate-400'}`} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{preset.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({r})</span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{preset.desc}</p>
                          </div>
                        </button>
                      );
                    })}

                    <div className="border-t border-[#D7DEE5] mt-1 pt-1 flex items-center justify-between px-2 py-1">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onSelectTab('auth');
                        }}
                        className="text-[11px] text-[#123F5A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <User className="w-3 h-3" /> {t('nav.myAccount')}
                      </button>
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          logout();
                        }}
                        className="text-[11px] text-[#B42318] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Pre-login state: Clean action buttons for Sign In and Register
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('auth', 'LOGIN')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#123F5A] hover:bg-[#1A5375] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer border border-[#1A5375]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E87524]" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onSelectTab('auth', 'REGISTER')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#E87524] hover:bg-[#D4681E] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
