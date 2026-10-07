/**
 * Dedicated Security & Privacy Page
 * Official Government Styling:
 * Cards: #FFFFFF | Border: #D7DEE5 | Navy: #123F5A / #0B3A5B | Text: #17212B
 * Saffron: #E87524 | Green: #138A52
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SecurityReport } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  Database,
  EyeOff,
  Activity,
  Server,
  Layers,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Cpu,
  ArrowRight
} from 'lucide-react';

const SECURITY_PILLARS = [
  {
    title: 'Secure Authentication',
    description: 'Bcryptjs hashing (cost factor 10), HttpOnly SameSite=strict session cookies, and automated account lockout after 5 failed attempts.',
    icon: KeyRound,
    status: 'ENFORCED'
  },
  {
    title: 'Role-Based Access',
    description: '5 sovereign tiers (Citizen, Verifier, Officer, Admin, Super Admin). All administrative APIs guarded on backend with least privilege.',
    icon: Layers,
    status: 'ENFORCED'
  },
  {
    title: 'Protected APIs',
    description: 'Rate limiting on authentication and AI OCR endpoints, sliding-window anti-abuse filters, and strict session verification.',
    icon: Server,
    status: 'ENFORCED'
  },
  {
    title: 'Encrypted Transport',
    description: 'TLS 1.3 in transit with HSTS, strict CSP headers, nosniff MIME protection, and frame-ancestors clickjacking prevention.',
    icon: ShieldCheck,
    status: 'ENFORCED'
  },
  {
    title: 'Input Validation',
    description: 'Strict Zod schemas rejecting unexpected fields, binary magic-byte inspection (JPEG, PNG, WEBP, PDF), and 5MB payload caps.',
    icon: FileCheck,
    status: 'ENFORCED'
  },
  {
    title: 'Audit Trail',
    description: 'Immutable HMAC-signed ledger recording every upload, OCR extraction, verdict, and login with correlation IDs and masked IPs.',
    icon: Activity,
    status: 'ENFORCED'
  },
  {
    title: 'Secret Protection',
    description: 'Zero private API keys in client bundles. Rigorous environment variable validation at startup; no secrets logged or exposed.',
    icon: Lock,
    status: 'ENFORCED'
  },
  {
    title: 'Privacy by Design',
    description: 'Aadhaar / PAN PII masking, AES-256-GCM encrypted document storage at rest, and automated 30-day data retention purge.',
    icon: EyeOff,
    status: 'ENFORCED'
  }
];

export const SecurityPrivacyPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [auditReport, setAuditReport] = useState<SecurityReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);

  const runAudit = async () => {
    setIsRunningAudit(true);
    try {
      const res = await api.getSecurityAuditReport();
      setAuditReport(res);
    } catch (err) {
      console.error('Failed to run security audit:', err);
    } finally {
      setIsRunningAudit(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="space-y-10">
      
      {/* Hero Section with Plain Language Guarantee (Official Government White Card) */}
      <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-8 shadow-sm relative overflow-hidden space-y-4">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#E87524] font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" /> Sovereign Trust &amp; Privacy Charter
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17212B]">
            Security &amp; Privacy by Design
          </h1>

          <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-[#E87524]/40 text-[#17212B] text-sm font-semibold leading-relaxed">
            &ldquo;Your documents are sensitive. The platform is designed around secure authentication, controlled access, protected APIs and privacy-aware processing.&rdquo;
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            PramaanID operates under a zero-trust sovereign architecture. Raw document buffers are analyzed in isolated server-side workers, encrypted with AES-256-GCM, and masked before long-term storage. No client-side telemetry or external third-party tracking is ever executed.
          </p>
        </div>
      </div>

      {/* Visual Security Architecture Diagram */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B]">Visual Security Architecture</h2>
          <p className="text-xs text-slate-500">
            End-to-end request lifecycle through sovereign defense layers. Direct database or secret access is strictly blocked.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 shadow-sm overflow-x-auto">
          <div className="min-w-[850px] flex items-center justify-between gap-2 text-center text-xs">
            
            {/* Step 1 */}
            <div className="flex-1 p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">01. CLIENT</span>
              <div className="font-bold text-[#17212B]">User Browser</div>
              <div className="text-[11px] text-slate-500">Zero plain secrets</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* Step 2 */}
            <div className="flex-1 p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">02. TRANSPORT</span>
              <div className="font-bold text-[#17212B]">HTTPS / TLS 1.3</div>
              <div className="text-[11px] text-slate-500">HSTS + Strict CSP</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* Step 3 */}
            <div className="flex-1 p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">03. PERIMETER</span>
              <div className="font-bold text-[#17212B]">Rate Limiter</div>
              <div className="text-[11px] text-slate-500">Anti-abuse window</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* Step 4 */}
            <div className="flex-1 p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">04. IDENTITY</span>
              <div className="font-bold text-[#17212B]">RBAC &amp; Session</div>
              <div className="text-[11px] text-slate-500">5 Sovereign tiers</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* Step 5 */}
            <div className="flex-1 p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">05. AI ENGINE</span>
              <div className="font-bold text-[#17212B]">Gemini Forensics</div>
              <div className="text-[11px] text-slate-500">Tamper detection</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* Step 6 */}
            <div className="flex-1 p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">06. REST</span>
              <div className="font-bold text-[#17212B]">AES-256 Vault</div>
              <div className="text-[11px] text-slate-500">Masked PII storage</div>
            </div>

          </div>
        </div>
      </div>

      {/* Badges & Pillar Cards (Mandatory Set in Government White Cards) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#17212B]">Sovereign Security Controls</h2>
          <p className="text-xs text-slate-500">
            Real architectural controls actively executed across the server and API endpoints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECURITY_PILLARS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D7DEE5] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-[#123F5A]" />
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 border border-[#138A52]/30 text-[#138A52]">
                    {p.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#17212B]">{p.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Security Audit Console & Vulnerability Scanner */}
      <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D7DEE5]">
          <div>
            <h2 className="text-base font-bold text-[#17212B] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#123F5A]" />
              Live Repository Security &amp; Compliance Scanner
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 15-point inspection identical to <code className="text-[#123F5A] font-bold font-mono">npm run security:audit</code>.
            </p>
          </div>

          <button
            onClick={runAudit}
            disabled={isRunningAudit}
            className="self-start sm:self-auto py-2.5 px-4 rounded-lg bg-[#123F5A] hover:bg-[#0B3A5B] disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            {isRunningAudit ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running Audit Checks...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Execute Security Audit
              </>
            )}
          </button>
        </div>

        {/* Audit Metrics */}
        {auditReport && (
          <>
            <div className="flex items-center gap-5 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-[#138A52] font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>{auditReport.summary.pass} Passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#D89B00] font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>{auditReport.summary.warn} Warnings</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#B42318] font-bold">
                <XCircle className="w-4 h-4" />
                <span>{auditReport.summary.fail} Failures</span>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="divide-y divide-[#D7DEE5] rounded-xl border border-[#D7DEE5] bg-[#FFFFFF] overflow-hidden shadow-sm">
              {auditReport.checks.map((chk, i) => (
                <div key={i} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-[#F4F6F8] transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#17212B]">{chk.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({chk.category})</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{chk.description}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                    chk.status === 'PASS'
                      ? 'bg-emerald-50 border-[#138A52]/40 text-[#138A52]'
                      : chk.status === 'WARN'
                      ? 'bg-amber-50 border-[#D89B00]/40 text-[#D89B00]'
                      : 'bg-red-50 border-[#B42318]/40 text-[#B42318]'
                  }`}>
                    [{chk.status}]
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
