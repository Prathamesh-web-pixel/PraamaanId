/**
 * Officer & Verifier Inspection Queue
 * Official Government Styling:
 * Cards: #FFFFFF | Border: #D7DEE5 | Navy: #123F5A / #0B3A5B | Text: #17212B
 * Saffron: #E87524 | Green: #138A52 | Danger: #B42318
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { VerificationRecord, VerificationStatus, RiskLevel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { IDCardGraphic } from '../citizen/IDCardGraphic';
import {
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  BadgeCheck,
  Award
} from 'lucide-react';
import officerImg from '../../assets/images/officer_profile_badge_1791097288346.jpg';

export const VerificationQueue: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Decision state
  const [decisionVerdict, setDecisionVerdict] = useState<'VERIFIED' | 'REJECTED' | 'FLAGGED_TAMPERED'>('VERIFIED');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Forensic Heatmap toggle in Officer View
  const [showInspectorHeatmap, setShowInspectorHeatmap] = useState<boolean>(true);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await api.getVerifications({
        status: statusFilter,
        riskLevel: riskFilter
      });
      setRecords(res.records);
      if (res.records.length > 0 && !selectedRecord) {
        setSelectedRecord(res.records[0]);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, riskFilter]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !remarks.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.submitVerificationDecision(selectedRecord.id, decisionVerdict, remarks);
      setActionSuccessMessage(`Decision [${decisionVerdict}] successfully recorded with audit signature.`);
      setSelectedRecord(res.record);
      setRemarks('');
      fetchRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record decision.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.maskedDocumentNumber.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Officer Command Banner with Official Portrait */}
      <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#123F5A] bg-[#F4F6F8] shadow-sm shrink-0">
            <img
              src={officerImg}
              alt="Gazetted Verification Officer"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#123F5A] text-white">
                GAZETTED OFFICER DESK
              </span>
              <span className="text-xs text-slate-500 font-mono">Enclave Clearance Tier 4</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#17212B] mt-1">
              National Forensic Document Inspection Workstation
            </h1>
            <p className="text-xs text-slate-500">
              Assigned: {user?.fullName || 'Col. Rajeshwardas Gupta'} · {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecords}
          className="py-2 px-4 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] hover:bg-slate-200 text-xs font-bold text-[#17212B] flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#123F5A]" /> Refresh Live Queue
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#FFFFFF] border border-[#D7DEE5] shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by applicant name, ID, or token..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F6F8] border border-[#D7DEE5] rounded-lg pl-8 pr-3 py-2 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A]"
          />
        </div>

        {/* Status Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-[#F4F6F8] rounded-lg border border-[#D7DEE5] text-xs">
          {['ALL', 'PENDING_REVIEW', 'FLAGGED_TAMPERED', 'VERIFIED', 'REJECTED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === st ? 'bg-[#123F5A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-1 p-1 bg-[#F4F6F8] rounded-lg border border-[#D7DEE5] text-xs">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(rk => (
            <button
              key={rk}
              onClick={() => setRiskFilter(rk)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                riskFilter === rk ? 'bg-[#123F5A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {rk === 'ALL' ? 'All Risks' : `${rk} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Pane: Record List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[800px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#D7DEE5]">
              Loading cases...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#FFFFFF] rounded-xl border border-[#D7DEE5]">
              No matching verification cases found for selected filters.
            </div>
          ) : (
            filteredRecords.map(rec => {
              const isSelected = selectedRecord?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    setSelectedRecord(rec);
                    setActionSuccessMessage(null);
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/60 border-[#E87524] shadow-sm'
                      : 'bg-[#FFFFFF] border-[#D7DEE5] hover:bg-[#F4F6F8]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#17212B]">{rec.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {rec.documentType} · {rec.maskedDocumentNumber}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      rec.riskLevel === 'HIGH'
                        ? 'bg-red-50 border-[#B42318]/40 text-[#B42318]'
                        : rec.riskLevel === 'MEDIUM'
                        ? 'bg-amber-50 border-[#D89B00]/40 text-[#D89B00]'
                        : 'bg-emerald-50 border-[#138A52]/40 text-[#138A52]'
                    }`}>
                      {rec.riskLevel} RISK
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D7DEE5] text-[11px] text-slate-500">
                    <span className="font-mono">ID: {rec.id}</span>
                    <span className={`font-bold ${
                      rec.status === 'VERIFIED'
                        ? 'text-[#138A52]'
                        : rec.status === 'FLAGGED_TAMPERED'
                        ? 'text-[#B42318]'
                        : 'text-[#D89B00]'
                    }`}>
                      {rec.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: Deep Forensic Inspector (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedRecord ? (
            <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 space-y-6 shadow-sm">
              
              {/* Case Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#D7DEE5]">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-semibold">
                    CASE DOSSIER #{selectedRecord.id}
                  </span>
                  <h2 className="text-lg font-bold text-[#17212B] mt-0.5">
                    {selectedRecord.fullName}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block font-mono">
                    Ingested: {new Date(selectedRecord.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-mono text-[#138A52] font-bold">
                    Confidence: {selectedRecord.confidenceScore}%
                  </span>
                </div>
              </div>

              {/* Success Notification */}
              {actionSuccessMessage && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-[#138A52]/40 text-xs text-[#138A52] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#138A52] shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Visual ID Card Replica with Spectrogram in Officer Dossier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17212B] uppercase tracking-wider">
                    Document Replica &amp; Spectrogram Inspection
                  </span>
                  <button
                    onClick={() => setShowInspectorHeatmap(!showInspectorHeatmap)}
                    className="text-xs text-[#123F5A] hover:underline font-mono flex items-center gap-1 font-bold"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#E87524]" />
                    {showInspectorHeatmap ? 'Hide Tamper Spectrogram' : 'Show Tamper Spectrogram'}
                  </button>
                </div>

                <IDCardGraphic
                  documentType={selectedRecord.documentType}
                  documentNumber={selectedRecord.maskedDocumentNumber}
                  fullName={selectedRecord.fullName}
                  dateOfBirth={selectedRecord.dateOfBirth}
                  gender={selectedRecord.gender}
                  address={selectedRecord.analysis.extracted.address}
                  fatherName={selectedRecord.analysis.extracted.fatherName}
                  riskLevel={selectedRecord.riskLevel}
                  tamperFlags={selectedRecord.analysis.forensics.tamperFlags}
                  showForensicHeatmap={showInspectorHeatmap}
                />
              </div>

              {/* Forensic Anomaly Inspection Box */}
              <div className="p-4 rounded-xl bg-[#F4F6F8] border border-[#D7DEE5] space-y-3">
                <h3 className="text-xs font-bold text-[#17212B] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#E87524]" />
                  Forensic Tamper Inspection Report
                </h3>

                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D7DEE5]">
                    <span className="text-[10px] text-slate-500 font-mono">Font Kerning</span>
                    <div className="font-mono font-bold text-[#17212B] mt-0.5">
                      {selectedRecord.analysis.forensics.fontConsistencyScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D7DEE5]">
                    <span className="text-[10px] text-slate-500 font-mono">Optic Hologram</span>
                    <div className="font-mono font-bold text-[#17212B] mt-0.5">
                      {selectedRecord.analysis.forensics.hologramAuthenticityScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#D7DEE5]">
                    <span className="text-[10px] text-slate-500 font-mono">Photo Bounding</span>
                    <div className="font-mono font-bold text-[#17212B] mt-0.5">
                      {selectedRecord.analysis.forensics.photoBoxIntegrityScore}%
                    </div>
                  </div>
                </div>

                {selectedRecord.analysis.forensics.tamperFlags.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#B42318]">Flags Raised:</span>
                    <ul className="text-xs text-[#B42318] list-disc list-inside space-y-0.5">
                      {selectedRecord.analysis.forensics.tamperFlags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-[#138A52] flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Zero digital tampering or font alterations detected in OCR scan.
                  </p>
                )}

                <p className="text-[11px] text-slate-600 pt-2 border-t border-[#D7DEE5]">
                  <span className="text-[#17212B] font-bold">Examiner Observation: </span>
                  {selectedRecord.analysis.forensics.forensicNotes}
                </p>
              </div>

              {/* Gazetted Officer Decision Form */}
              <form onSubmit={handleDecisionSubmit} className="pt-4 border-t border-[#D7DEE5] space-y-3">
                <h4 className="text-xs font-bold text-[#17212B] uppercase tracking-wider">
                  Record Gazetted Verdict
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionVerdict('VERIFIED')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      decisionVerdict === 'VERIFIED'
                        ? 'bg-[#138A52] text-white border-[#138A52] shadow-sm'
                        : 'bg-[#F4F6F8] border-[#D7DEE5] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve &amp; Certify
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionVerdict('FLAGGED_TAMPERED')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      decisionVerdict === 'FLAGGED_TAMPERED'
                        ? 'bg-[#D89B00] text-white border-[#D89B00] shadow-sm'
                        : 'bg-[#F4F6F8] border-[#D7DEE5] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Flag For Field Review
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionVerdict('REJECTED')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      decisionVerdict === 'REJECTED'
                        ? 'bg-[#B42318] text-white border-[#B42318] shadow-sm'
                        : 'bg-[#F4F6F8] border-[#D7DEE5] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Fraudulent
                  </button>
                </div>

                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter formal examiner remarks or justification..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D7DEE5] rounded-lg p-2.5 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !remarks.trim()}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#123F5A] hover:bg-[#0B3A5B] disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recording Sovereign Decision...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Commit Audit-Signed Decision
                    </>
                  )}
                </button>
              </form>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center rounded-xl border border-[#D7DEE5] bg-[#FFFFFF]">
              <p className="text-xs text-slate-500">Select a case from the queue to inspect forensics.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
