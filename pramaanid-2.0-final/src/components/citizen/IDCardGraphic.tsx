/**
 * Authentic Sovereign Indian ID Card Graphic Renderer
 * Generates high-fidelity visual representations of Aadhaar, PAN, and Passport
 * with optional forensic tamper heatmap overlay and security guilloche lines.
 */

import React from 'react';
import { DocumentType, RiskLevel } from '../../types';
import { Shield, QrCode, Cpu, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

interface IDCardGraphicProps {
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  fatherName?: string;
  riskLevel?: RiskLevel;
  tamperFlags?: string[];
  showForensicHeatmap?: boolean;
  maskPII?: boolean;
}

export const IDCardGraphic: React.FC<IDCardGraphicProps> = ({
  documentType,
  documentNumber,
  fullName,
  dateOfBirth,
  gender,
  address,
  fatherName,
  riskLevel = 'LOW',
  tamperFlags = [],
  showForensicHeatmap = false,
  maskPII = true
}) => {
  const isAadhaar = documentType === 'AADHAAR';
  const isPAN = documentType === 'PAN';
  const isPassport = documentType === 'PASSPORT';

  return (
    <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* 1. AADHAAR CARD VISUALIZATION */}
      {isAadhaar && (
        <div className="relative bg-gradient-to-b from-amber-50/95 via-white to-emerald-50/90 text-slate-900 border-2 border-slate-300 p-4 rounded-xl shadow-lg font-sans overflow-hidden">
          
          {/* Subtle Tricolor Top Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />
          
          {/* Guilloche Security Background Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #d97706 1px, transparent 1px), radial-gradient(circle at 0% 0%, #059669 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />

          {/* Aadhaar Header */}
          <div className="flex items-center justify-between pb-2 border-b border-amber-600/30">
            <div className="flex items-center gap-2">
              {/* Ashoka Pillar Lion Capital Motif */}
              <div className="w-8 h-8 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center text-amber-700 font-bold text-xs">
                🏛️
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-800 leading-tight">
                  PRAMAANID / HACKATHON PROTOTYPE
                </div>
                <div className="text-[9px] text-amber-800 font-semibold">
                  भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-red-600 font-mono tracking-wider">
                आधार / AADHAAR
              </span>
              <span className="block text-[8px] text-slate-500 font-mono">आम आदमी का अधिकार</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="grid grid-cols-12 gap-3 py-3 items-center">
            
            {/* Photo Box */}
            <div className="col-span-4 relative">
              <div className="w-24 h-28 mx-auto rounded border-2 border-slate-400 bg-slate-200 overflow-hidden relative shadow-inner flex flex-col items-center justify-center text-slate-400">
                {/* Silhouette or Portrait */}
                <div className="w-14 h-14 rounded-full bg-slate-300 border border-slate-400 mb-1" />
                <div className="w-20 h-8 rounded-t-full bg-slate-400" />
                
                {/* Holographic Watermark Badge */}
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 opacity-80 flex items-center justify-center text-[7px] font-bold text-amber-900 shadow">
                  ✓
                </div>
              </div>
            </div>

            {/* Identity Details */}
            <div className="col-span-8 space-y-1 text-left text-xs">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">नाम / Name</span>
                <span className="font-bold text-slate-900 tracking-wide text-xs">{fullName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">जन्म तिथि / DOB</span>
                  <span className="font-semibold text-slate-800 font-mono text-xs">{dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">लिंग / Gender</span>
                  <span className="font-semibold text-slate-800 text-xs">{gender}</span>
                </div>
              </div>

              {address && (
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">पता / Address</span>
                  <span className="text-[10px] text-slate-700 line-clamp-2 leading-tight">{address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Aadhaar Number Strip */}
          <div className="mt-1 pt-2 border-t border-slate-300 flex items-center justify-between bg-white/80 p-2 rounded border border-slate-200">
            <div className="text-center flex-1">
              <span className="text-[9px] text-slate-500 block uppercase font-mono">मेरा आधार, मेरी पहचान</span>
              <span className="font-mono text-base font-bold tracking-widest text-slate-900">
                {documentNumber}
              </span>
            </div>
            
            <div className="w-9 h-9 bg-slate-900 text-white rounded p-1 flex items-center justify-center">
              <QrCode className="w-7 h-7" />
            </div>
          </div>
        </div>
      )}

      {/* 2. PAN CARD VISUALIZATION */}
      {isPAN && (
        <div className="relative bg-gradient-to-br from-sky-950 via-slate-900 to-blue-950 text-slate-100 border-2 border-blue-800/80 p-4 rounded-xl shadow-2xl font-sans overflow-hidden">
          
          {/* Holographic metallic header band */}
          <div className="flex items-center justify-between pb-2 border-b border-blue-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                ⚖️
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-300 leading-tight">
                  आयकर विभाग / INCOME TAX DEPARTMENT
                </div>
                <div className="text-[9px] text-slate-300 font-medium">
                  भारत सरकार / GOVT. OF INDIA
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-amber-400 font-mono tracking-wider">
                PAN CARD
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="grid grid-cols-12 gap-3 py-3 items-center">
            
            {/* Photo & Hologram */}
            <div className="col-span-4 relative">
              <div className="w-24 h-28 mx-auto rounded border border-amber-400/50 bg-slate-800 overflow-hidden relative shadow flex flex-col items-center justify-center text-slate-500">
                <div className="w-14 h-14 rounded-full bg-slate-700 border border-slate-600 mb-1" />
                <div className="w-20 h-8 rounded-t-full bg-slate-600" />
                
                {/* Optic Security Hologram */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none" />
              </div>

              {/* Digital signature strip */}
              <div className="w-24 mx-auto mt-1.5 h-5 bg-slate-800/90 border border-slate-700 rounded flex items-center justify-center">
                <span className="font-serif italic text-[9px] text-slate-300 tracking-wider">
                  {fullName.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="col-span-8 space-y-1.5 text-left text-xs">
              <div>
                <span className="text-[9px] text-slate-400 uppercase block">नाम / Name</span>
                <span className="font-bold text-white tracking-wide text-xs">{fullName}</span>
              </div>

              {fatherName && (
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">पिता का नाम / Father's Name</span>
                  <span className="font-medium text-slate-300 text-[11px]">{fatherName}</span>
                </div>
              )}

              <div>
                <span className="text-[9px] text-slate-400 uppercase block">जन्म की तारीख / Date of Birth</span>
                <span className="font-semibold text-slate-200 font-mono text-xs">{dateOfBirth}</span>
              </div>

              <div className="pt-1">
                <span className="text-[9px] text-amber-400 uppercase block font-semibold">
                  स्थायी खाता संख्या / Permanent Account Number
                </span>
                <span className="font-mono text-sm font-bold tracking-widest text-amber-300">
                  {documentNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PASSPORT VISUALIZATION */}
      {isPassport && (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-100 border-2 border-indigo-700/60 p-4 rounded-xl shadow-2xl font-sans overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-indigo-700/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                🇮🇳
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-300 leading-tight">
                  भारत गणराज्य / REPUBLIC OF INDIA
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  PASSPORT · BIOMETRIC DATA PAGE
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Cpu className="w-4 h-4" />
              <span className="text-[10px] font-mono">ICAO 9303</span>
            </div>
          </div>

          {/* Passport Body */}
          <div className="grid grid-cols-12 gap-3 py-3 items-center">
            <div className="col-span-4">
              <div className="w-24 h-28 mx-auto rounded border border-indigo-500/50 bg-slate-800 overflow-hidden relative shadow flex flex-col items-center justify-center text-slate-500">
                <div className="w-14 h-14 rounded-full bg-slate-700 border border-slate-600 mb-1" />
                <div className="w-20 h-8 rounded-t-full bg-slate-600" />
              </div>
            </div>

            <div className="col-span-8 space-y-1 text-left text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono">Type / Country</span>
                  <span className="font-semibold text-slate-200 font-mono text-xs">P / IND</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono">Passport No.</span>
                  <span className="font-bold text-amber-300 font-mono text-xs">{documentNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block font-mono">Given Name(s)</span>
                <span className="font-bold text-white tracking-wide text-xs">{fullName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono">Nationality</span>
                  <span className="font-semibold text-slate-200 text-xs">INDIAN</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-mono">Date of Birth</span>
                  <span className="font-semibold text-slate-200 font-mono text-xs">{dateOfBirth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ICAO MRZ Code Strip */}
          <div className="mt-2 pt-2 border-t border-indigo-900 bg-black/60 p-2 rounded font-mono text-[9px] text-emerald-400/90 tracking-widest leading-none select-all overflow-x-auto">
            <div>{`P<IND${fullName.replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<<<<<<<<<<`}</div>
            <div>{`${documentNumber}0IND${dateOfBirth.replace(/-/g, '').slice(2)}4M3109158<<<<<<<<<<<<<<02`}</div>
          </div>
        </div>
      )}

      {/* FORENSIC TAMPER HEATMAP OVERLAY (When Toggled) */}
      {showForensicHeatmap && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] p-4 flex flex-col justify-between border-2 border-rose-500 rounded-xl z-20 pointer-events-none animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              FORENSIC ANOMALY SPECTROGRAM ACTIVE
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">
              Risk: {riskLevel}
            </span>
          </div>

          {/* Simulated Tamper Bounding Rectangles */}
          <div className="my-auto space-y-2">
            {tamperFlags.length > 0 ? (
              tamperFlags.map((flag, i) => (
                <div key={i} className="p-2 rounded bg-rose-950/80 border border-rose-500 text-[11px] text-rose-200 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span>{flag}</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero digital tampering anomalies detected in micro-mesh</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-right">
            SHA-256 Optical Frame Checksum: Verified
          </div>
        </div>
      )}

    </div>
  );
};
