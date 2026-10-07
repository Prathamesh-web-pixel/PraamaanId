/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { DocumentVerificationPortal } from './components/citizen/DocumentVerificationPortal';
import { VerificationQueue } from './components/officer/VerificationQueue';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuditLedger } from './components/audit/AuditLedger';
import { SecurityPrivacyPage } from './components/security/SecurityPrivacyPage';
import { AuthPage } from './components/auth/AuthPage';
import { AuthVideoWalkthrough } from './components/guide/AuthVideoWalkthrough';
import { ShieldCheck, Lock, ExternalLink, Shield } from 'lucide-react';
import { PublicVerification } from './components/public/PublicVerification';
import emblemImg from './assets/images/security_vault_emblem_1791097276487.jpg';

function MainApp() {
  const { user } = useAuth();

  // Public QR verification route intentionally bypasses the authenticated portal shell.
  const publicVerificationMatch = window.location.pathname.match(/^\/verify\/([^/]+)\/?$/);
  if (publicVerificationMatch) {
    return <PublicVerification verificationId={decodeURIComponent(publicVerificationMatch[1])} />;
  }
  const { t, lang } = useLanguage();
  const [currentTab, setCurrentTab] = useState<string>('citizen');
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Enforce tab access permissions based on role
  const isVerifierOrHigher = user && ['VERIFIER', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isAdminOrHigher = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const handleSelectTab = (tab: string, authMode?: 'LOGIN' | 'REGISTER') => {
    if (authMode) {
      setAuthInitialMode(authMode);
    }

    if (!user) {
      if (tab === 'security') {
        setCurrentTab('security');
      } else {
        setCurrentTab('auth');
      }
      // Smoothly focus on form card
      setTimeout(() => {
        const el = document.getElementById('auth-portal-card');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    if (tab === 'officer' && !isVerifierOrHigher) {
      setCurrentTab('citizen');
      return;
    }
    if ((tab === 'admin' || tab === 'audit') && !isAdminOrHigher) {
      setCurrentTab('citizen');
      return;
    }

    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#17212B] flex flex-col antialiased selection:bg-[#E87524]/20 selection:text-[#E87524]">
      {/* 3-Zone Government Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          // Pre-Login Gateway: Mandatory Sign In / Sign Up Screen before anyone can access the portal
          <AuthPage
            initialMode={authInitialMode}
            onSuccessRedirect={() => setCurrentTab('citizen')}
          />
        ) : (
          // Authenticated Portal Views
          <>
            {currentTab === 'citizen' && <DocumentVerificationPortal />}
            {currentTab === 'officer' && <VerificationQueue />}
            {currentTab === 'admin' && <AdminPortal />}
            {currentTab === 'audit' && <AuditLedger />}
            {currentTab === 'security' && <SecurityPrivacyPage />}
            {currentTab === 'auth' && (
              <AuthPage
                initialMode={authInitialMode}
                onSuccessRedirect={() => setCurrentTab('citizen')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer with Video Walkthrough Guide & Sovereign Governance */}
      <footer className="w-full bg-[#FFFFFF] border-t border-[#D7DEE5] pt-12 pb-8 mt-12 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* 1. Interactive Video Simulation Walkthrough Guide */}
          <AuthVideoWalkthrough />

          {/* 2. Official Sovereign Footer Strip */}
          <div className="pt-6 border-t border-[#D7DEE5] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#D7DEE5] p-0.5 bg-[#F4F6F8] shrink-0">
                <img
                  src={emblemImg}
                  alt="Sovereign Emblem"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div>
                <div className="font-bold text-[#17212B] flex items-center gap-2">
                  <span>PramaanID Sovereign Gateway</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#138A52]" />
                  <span className="text-[11px] text-[#138A52] font-mono font-semibold">256-Bit GCM Enclave</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  PramaanID · Hackathon Prototype · AI Identity Trust Lab
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#123F5A]">
              {user && (
                <button
                  onClick={() => setCurrentTab('citizen')}
                  className="hover:text-[#E87524] transition-colors cursor-pointer"
                >
                  {t('nav.verify')}
                </button>
              )}
              <button
                onClick={() => setCurrentTab('auth')}
                className="hover:text-[#E87524] transition-colors font-bold text-[#E87524] cursor-pointer"
              >
                {user ? `${t('nav.myAccount')} / ${t('nav.logout')}` : t('nav.login')}
              </button>
              <button
                onClick={() => setCurrentTab('security')}
                className="hover:text-[#E87524] transition-colors cursor-pointer"
              >
                {t('nav.security')}
              </button>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-normal">© 2026 Sovereign Trust Enclave</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
