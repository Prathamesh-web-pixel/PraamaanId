/**
 * Immutable Audit Ledger Viewer
 * Official Government Styling:
 * Cards: #FFFFFF | Border: #D7DEE5 | Navy: #123F5A / #0B3A5B | Text: #17212B
 * Saffron: #E87524 | Green: #138A52
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLogEntry } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  ListFilter,
  Download,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';

export const AuditLedger: React.FC = () => {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: actionFilter,
        status: statusFilter,
        limit: 150
      });
      setLogs(res.logs);
      if (res.logs.length > 0 && !selectedLog) {
        setSelectedLog(res.logs[0]);
      }
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, statusFilter]);

  const exportAuditReport = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pramaan_audit_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.userEmail.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17212B] flex items-center gap-2">
            {t('nav.audit')}
            <span className="text-xs font-mono text-[#E87524] font-bold">
              [{logs.length} events logged]
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tamper-evident sovereign event ledger. Every authentication attempt, biometric comparison, role change, and purge is cryptographically hashed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="py-2 px-3.5 rounded-lg bg-[#FFFFFF] border border-[#D7DEE5] hover:bg-[#F4F6F8] text-xs font-bold text-[#17212B] flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#123F5A]" /> Refresh
          </button>
          <button
            onClick={exportAuditReport}
            className="py-2 px-4 rounded-lg bg-[#123F5A] hover:bg-[#0B3A5B] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit JSON
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#FFFFFF] border border-[#D7DEE5] shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by event, actor, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F6F8] border border-[#D7DEE5] rounded-lg pl-8 pr-3 py-2 text-xs text-[#17212B] placeholder-slate-400 focus:outline-none focus:border-[#123F5A]"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-1 text-xs">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-[#FFFFFF] border border-[#D7DEE5] text-[#17212B] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#123F5A]"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="FAILED_LOGIN_ATTEMPT">FAILED_LOGIN_ATTEMPT</option>
            <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
            <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
            <option value="DOCUMENT_ANALYSIS">DOCUMENT_ANALYSIS</option>
            <option value="FACE_VERIFICATION">FACE_VERIFICATION</option>
            <option value="VERIFIER_DECISION">VERIFIER_DECISION</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
            <option value="RETENTION_PURGE">RETENTION_PURGE</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#FFFFFF] border border-[#D7DEE5] text-[#17212B] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#123F5A]"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="FAILURE">FAILURE</option>
          </select>
        </div>
      </div>

      {/* Main Two-Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Log Table (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F8] sticky top-0 border-b border-[#D7DEE5] text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">Action</th>
                  <th className="py-3 px-3.5">Actor</th>
                  <th className="py-3 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DEE5]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Loading audit events...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">No audit events match filters.</td>
                  </tr>
                ) : (
                  filteredLogs.map(l => {
                    const isSelected = selectedLog?.id === l.id;
                    return (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLog(l)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/70 font-semibold' : 'hover:bg-[#F4F6F8]'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono text-slate-500 tabular-nums">
                          {new Date(l.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-[#17212B]">
                          {l.action}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 truncate max-w-[140px]">
                          {l.userEmail}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            l.status === 'SUCCESS'
                              ? 'bg-emerald-50 border-[#138A52]/40 text-[#138A52]'
                              : l.status === 'WARNING'
                              ? 'bg-amber-50 border-[#D89B00]/40 text-[#D89B00]'
                              : 'bg-red-50 border-[#B42318]/40 text-[#B42318]'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Log Inspector (5 Cols) */}
        <div className="lg:col-span-5">
          {selectedLog ? (
            <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE5]">
                <span className="text-xs font-bold text-[#17212B] uppercase tracking-wider">
                  Event Inspection
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  selectedLog.status === 'SUCCESS'
                    ? 'bg-emerald-50 border-[#138A52] text-[#138A52]'
                    : selectedLog.status === 'WARNING'
                    ? 'bg-amber-50 border-[#D89B00] text-[#D89B00]'
                    : 'bg-red-50 border-[#B42318] text-[#B42318]'
                }`}>
                  {selectedLog.status}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div>
                  <dt className="text-slate-500">Event ID</dt>
                  <dd className="text-[#17212B] font-mono font-semibold mt-0.5">{selectedLog.id}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Exact ISO Timestamp</dt>
                  <dd className="text-[#17212B] font-mono mt-0.5 tabular-nums">{selectedLog.timestamp}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Actor &amp; Role</dt>
                  <dd className="text-[#17212B] font-mono mt-0.5">
                    {selectedLog.userEmail} ({selectedLog.role})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Masked Origin IP</dt>
                  <dd className="text-[#17212B] font-mono mt-0.5">{selectedLog.ipAddress}</dd>
                </div>
                {selectedLog.resourceId && (
                  <div>
                    <dt className="text-slate-500">Associated Resource</dt>
                    <dd className="text-[#17212B] font-mono mt-0.5">{selectedLog.resourceId}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500">Cryptographic HMAC Seal</dt>
                  <dd className="text-[#123F5A] font-mono text-[11px] truncate mt-0.5 font-bold">
                    {selectedLog.signature}
                  </dd>
                </div>
              </dl>

              {/* Sanitized Details JSON */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  Sanitized Event Payload:
                </span>
                <pre className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] font-mono text-[11px] text-slate-800 overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center rounded-xl border border-[#D7DEE5] bg-[#FFFFFF]">
              <p className="text-xs text-slate-500">Select an event from the audit trail to inspect details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
