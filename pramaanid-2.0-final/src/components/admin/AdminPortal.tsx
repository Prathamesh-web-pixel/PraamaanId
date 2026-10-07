/**
 * Administration & RBAC Management Portal
 * Official Government Styling:
 * Cards: #FFFFFF | Border: #D7DEE5 | Navy: #123F5A / #0B3A5B | Text: #17212B
 * Saffron: #E87524 | Green: #138A52 | Danger: #B42318
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Shield,
  Trash2,
  Lock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Database
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Retention purge state
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeResult, setPurgeResult] = useState<number | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch users.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (user?.role !== 'SUPER_ADMIN') {
      setStatusMessage({ text: 'Only SUPER_ADMIN has authority to reassign RBAC roles.', type: 'error' });
      return;
    }

    setUpdatingUserId(targetUserId);
    setStatusMessage(null);
    try {
      await api.updateUserRole(targetUserId, newRole);
      setStatusMessage({ text: `User role successfully elevated to ${newRole}.`, type: 'success' });
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Role change failed.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      const res = await api.purgeRetention();
      setPurgeResult(res.purgedCount);
      setStatusMessage({
        text: `Data retention purge executed. ${res.purgedCount} expired document records removed.`,
        type: 'success'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purge execution failed.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17212B] flex items-center gap-2">
          {t('nav.admin')}
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Zero-trust governance center. Enforces least-privilege role-based access control, monitors cryptographic keys, and executes privacy data retention purges.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-[#138A52]/40 text-[#138A52]'
            : 'bg-red-50 border-[#B42318]/40 text-[#B42318]'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: System Status & Retention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: AES-256 Vault */}
        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D7DEE5] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase text-[#17212B]">Document Vault</span>
            <Lock className="w-4 h-4 text-[#138A52]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#123F5A]">AES-256-GCM</div>
          <p className="text-[11px] text-slate-500">
            Authenticated symmetric cipher protecting biometric snapshots and raw identity numbers at rest.
          </p>
        </div>

        {/* Card 2: RBAC Policy */}
        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D7DEE5] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase text-[#17212B]">RBAC Enforcement</span>
            <Shield className="w-4 h-4 text-[#E87524]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#123F5A]">5 Sovereign Tiers</div>
          <p className="text-[11px] text-slate-500">
            Citizen · Verifier · Officer · Admin · Super Admin. Backend authorization on every route.
          </p>
        </div>

        {/* Card 3: Privacy & Data Retention */}
        <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#D7DEE5] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase text-[#17212B]">Data Retention Policy</span>
            <Database className="w-4 h-4 text-[#123F5A]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#123F5A]">30-Day TTL</div>
          <p className="text-[11px] text-slate-500">
            Automatic purge of uploaded document binaries to comply with national privacy directives.
          </p>
        </div>

      </div>

      {/* User Management Section */}
      <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE5]">
          <div>
            <h3 className="text-sm font-bold text-[#17212B] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#123F5A]" />
              Sovereign User Accounts &amp; Role Assignment
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Super Admin can change roles to immediately adjust access permissions.
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="py-1.5 px-3 rounded-lg bg-[#F4F6F8] hover:bg-slate-200 border border-[#D7DEE5] text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading user registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D7DEE5] text-slate-500 bg-[#F4F6F8]">
                  <th className="py-2.5 px-3 font-semibold">User Name</th>
                  <th className="py-2.5 px-3 font-semibold">Sovereign Email</th>
                  <th className="py-2.5 px-3 font-semibold">Current Role</th>
                  <th className="py-2.5 px-3 font-semibold">Privilege Reassignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DEE5]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#F4F6F8]">
                    <td className="py-3 px-3 font-bold text-[#17212B]">
                      {u.fullName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-50 border-purple-300 text-purple-800'
                          : u.role === 'ADMIN'
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : u.role === 'OFFICER'
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : u.role === 'VERIFIER'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {user?.role === 'SUPER_ADMIN' ? (
                        <select
                          value={u.role}
                          disabled={updatingUserId === u.id}
                          onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="bg-[#FFFFFF] border border-[#D7DEE5] text-[#17212B] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#123F5A]"
                        >
                          <option value="CITIZEN">CITIZEN</option>
                          <option value="VERIFIER">VERIFIER</option>
                          <option value="OFFICER">OFFICER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Requires SUPER_ADMIN</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Retention Purge Trigger */}
      <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#17212B] flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[#B42318]" />
              Sovereign Data Retention Purge Runner
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Purges all document payloads exceeding the 30-day retention horizon from memory and the encrypted vault.
            </p>
          </div>

          <button
            onClick={handleExecutePurge}
            disabled={isPurging}
            className="self-start sm:self-auto py-2.5 px-4 rounded-lg bg-[#B42318] hover:bg-[#991B1B] text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            {isPurging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Purging...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" /> Execute Immediate Retention Purge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
