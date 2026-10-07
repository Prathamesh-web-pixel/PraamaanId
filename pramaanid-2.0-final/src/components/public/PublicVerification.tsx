import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, AlertTriangle, Clock3, LockKeyhole } from 'lucide-react';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface Props { verificationId: string; }

export const PublicVerification: React.FC<Props> = ({ verificationId }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicVerification(verificationId)
      .then(res => setData(res.verification))
      .catch(err => setError(err instanceof Error ? err.message : 'Verification record unavailable.'))
      .finally(() => setLoading(false));
  }, [verificationId]);

  const isVerified = data?.status === 'VERIFIED';
  const qrValue = `${window.location.origin}/verify/${encodeURIComponent(verificationId)}`;

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#17212B] flex items-center justify-center p-5">
      <div className="w-full max-w-2xl bg-white border border-[#D7DEE5] rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#123F5A] text-white px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/70 font-mono">PRAMAANID</div>
            <h1 className="text-xl font-bold mt-1">Public Verification Receipt</h1>
          </div>
          <ShieldCheck className="w-8 h-8" />
        </div>

        {loading && <div className="p-10 text-center text-slate-500">Checking verification receipt…</div>}

        {!loading && error && (
          <div className="p-10 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto text-[#B42318] mb-3" />
            <h2 className="font-bold text-lg">Verification unavailable</h2>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="p-6 space-y-6">
            <div className={`rounded-xl border p-5 ${isVerified ? 'border-[#138A52] bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="flex items-center gap-3">
                {isVerified ? <CheckCircle2 className="w-7 h-7 text-[#138A52]" /> : <Clock3 className="w-7 h-7 text-amber-600" />}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Status</div>
                  <div className={`text-2xl font-black ${isVerified ? 'text-[#138A52]' : 'text-amber-700'}`}>
                    {data.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Verification ID" value={data.id} mono />
              <Info label="Document" value={data.documentType} />
              <Info label="Document Number" value={data.maskedDocumentNumber} mono />
              <Info label="Verified At" value={new Date(data.verifiedAt).toLocaleString()} />
              <Info label="Trust Score" value={`${data.trustScore}/100`} strong />
              <Info label="Risk Level" value={data.riskLevel} />
            </div>

            <div className="border-t border-[#D7DEE5] pt-6 flex flex-col sm:flex-row gap-6 items-center">
              <div className="bg-white border border-[#D7DEE5] rounded-xl p-3">
                <QRCodeSVG
                  value={qrValue}
                  size={176}
                  level="M"
                  includeMargin
                  aria-label="PramaanID verification QR code"
                />
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-[#123F5A]"><LockKeyhole className="w-4 h-4" /> Read-only public verification</div>
                <p>Scan this QR code to independently open this verification receipt.</p>
                <p className="text-xs">No name, date of birth, address, selfie, or raw document image is exposed on this public page.</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">Cryptographic seal</div>
              <div className="font-mono text-[11px] break-all text-slate-700">{data.cryptographicSeal}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Info = ({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) => (
  <div className="rounded-lg border border-[#D7DEE5] p-4">
    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">{label}</div>
    <div className={`mt-1 ${mono ? 'font-mono text-xs' : ''} ${strong ? 'text-xl font-black text-[#123F5A]' : 'font-semibold'}`}>{value}</div>
  </div>
);
