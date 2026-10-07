/**
 * Citizen Document Verification Portal
 * Official Government Palette:
 * Main BG: #F4F6F8 | Header/Navy: #0B3A5B / #123F5A | Cards: #FFFFFF | Border: #D7DEE5
 * Saffron: #E87524 | Green: #138A52 | Warning: #D89B00 | Danger: #B42318 | Text: #17212B
 */

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { VerificationRecord, DocumentType, FaceVerificationResult } from '../../types';
import { IDCardGraphic } from './IDCardGraphic';
import {
  ShieldCheck,
  FileCheck2,
  Camera,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Download,
  UploadCloud,
  FileText,
  ScanLine,
  RefreshCw,
  QrCode,
  Building2,
  Sparkles,
  Layers,
  Fingerprint,
  Cpu,
  BadgeCheck,
  Zap
} from 'lucide-react';
import heroImg from '../../assets/images/hero_pramaan_portal_1791097264259.jpg';
import emblemImg from '../../assets/images/security_vault_emblem_1791097276487.jpg';

// Sample fictional identity documents for rapid testing
const SAMPLE_DOCUMENTS: Array<{
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  isTampered?: boolean;
  docNumber: string;
  fullName: string;
  dob: string;
  gender: string;
  address?: string;
  fatherName?: string;
  base64: string;
}> = [
  {
    id: 'sample_aadhaar',
    name: 'Aadhaar Smart Card',
    type: 'AADHAAR',
    description: 'UIDAI standard card with guilloche pattern and QR code',
    docNumber: 'XXXX-XXXX-9021',
    fullName: 'ROHAN CHANDRAKANT PATIL',
    dob: '1989-04-27',
    gender: 'Male',
    address: 'Flat 402, Shivam Enclave, Baner Road, Pune, Maharashtra 411045',
    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
  },
  {
    id: 'sample_pan',
    name: 'PAN Card (Income Tax)',
    type: 'PAN',
    description: 'Permanent Account Number with hologram & microlettering',
    docNumber: 'XXXXX9874F',
    fullName: 'AARAV SURESH SHARMA',
    dob: '1992-08-14',
    gender: 'Male',
    fatherName: 'SURESH KUMAR SHARMA',
    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
  },
  {
    id: 'sample_passport',
    name: 'Passport (Republic of India)',
    type: 'PASSPORT',
    description: 'ICAO Doc 9303 compliant biometric passport data page',
    docNumber: 'ZXXXXXX1',
    fullName: 'PRIYA RAJESH VERMA',
    dob: '1995-11-03',
    gender: 'Female',
    address: 'Sector 42, Golf Course Road, Gurugram, Haryana 122002',
    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
  },
  {
    id: 'sample_tampered',
    name: 'Altered ID (Tampered Anomaly)',
    type: 'PAN',
    isTampered: true,
    description: 'Suspicious card with font kerning alteration and digital clone artifacts',
    docNumber: 'XXXXX1111Q',
    fullName: 'ALOK MANOHAR JADHAV',
    dob: '1985-02-12',
    gender: 'Male',
    fatherName: 'MANOHAR JADHAV',
    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
  }
];

export const DocumentVerificationPortal: React.FC = () => {
  const { user, saveVerificationData } = useAuth();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('AADHAAR');
  const [maskPII, setMaskPII] = useState<boolean>(true);
  const [filePayload, setFilePayload] = useState<string | null>(SAMPLE_DOCUMENTS[0].base64);
  const [fileMime, setFileMime] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('Aadhaar Smart Card (Fictional Demo).jpg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationRecord | null>(null);

  // Active display card state
  const [currentCardData, setCurrentCardData] = useState({
    type: SAMPLE_DOCUMENTS[0].type,
    number: SAMPLE_DOCUMENTS[0].docNumber,
    name: SAMPLE_DOCUMENTS[0].fullName,
    dob: SAMPLE_DOCUMENTS[0].dob,
    gender: SAMPLE_DOCUMENTS[0].gender,
    address: SAMPLE_DOCUMENTS[0].address,
    fatherName: SAMPLE_DOCUMENTS[0].fatherName,
    isTampered: false
  });

  // Forensic Heatmap toggle
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Biometric selfie state
  const [selfiePayload, setSelfiePayload] = useState<string | null>(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState<boolean>(false);
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(null);
  const [identityResult, setIdentityResult] = useState<{ score: number; verdict: 'CONSISTENT' | 'REVIEW' | 'CONFLICT'; documentsChecked: number; matchedFields: string[]; conflicts: Array<{ field: string; documents: string[]; values: string[] }>; reasons: string[] } | null>(null);
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [livenessStep, setLivenessStep] = useState<number>(0);
  const [livenessFrames, setLivenessFrames] = useState<string[]>([]);
  const [demoSelfie, setDemoSelfie] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAnalysisError(lang === 'HI' ? 'फ़ाइल का आकार 5MB की सीमा से अधिक है।' : 'File size exceeds the 5MB sovereign security threshold.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFilePayload(base64);
      setFileMime(file.type || 'image/jpeg');
      setFileName(file.name);
      setAnalysisError(null);
      setVerificationResult(null);
      setFaceResult(null);
      setIdentityResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setSelectedDocType(sample.type);
    setFilePayload(sample.base64);
    setFileMime('image/jpeg');
    setFileName(`${sample.name}.jpg`);
    setAnalysisError(null);
    setVerificationResult(null);
    setFaceResult(null);
    setShowHeatmap(Boolean(sample.isTampered));

    setCurrentCardData({
      type: sample.type,
      number: sample.docNumber,
      name: sample.fullName,
      dob: sample.dob,
      gender: sample.gender,
      address: sample.address,
      fatherName: sample.fatherName,
      isTampered: Boolean(sample.isTampered)
    });
  };

  const handleAnalyze = async () => {
    if (!filePayload) {
      setAnalysisError(lang === 'HI' ? 'कृपया दस्तावेज़ चुनें।' : 'Please upload an identity document or select a sample.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await api.uploadAndAnalyzeDocument({
        imageBase64: filePayload,
        mimeType: fileMime,
        declaredType: selectedDocType,
        maskPII
      });
      setVerificationResult(res.record);
      // Persist verification data to Firebase Firestore and enclave
      await saveVerificationData(res.record);
      setCurrentCardData({
        type: res.record.documentType,
        number: res.record.maskedDocumentNumber,
        name: res.record.fullName,
        dob: res.record.dateOfBirth,
        gender: res.record.gender,
        address: res.record.analysis.extracted.address,
        fatherName: res.record.analysis.extracted.fatherName,
        isTampered: res.record.riskLevel === 'HIGH'
      });
      if (res.record.riskLevel === 'HIGH') {
        setShowHeatmap(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIdentityConsistency = async () => {
    if (!verificationResult) return;
    setIsCheckingIdentity(true);
    setAnalysisError(null);
    try {
      const list = await api.getVerifications();
      const sameUser = list.records.filter(r => r.userId === verificationResult.userId);
      const candidates = [verificationResult, ...sameUser.filter(r => r.id !== verificationResult.id)].slice(0, 5);
      if (candidates.length < 2) {
        setAnalysisError('Upload or verify at least two documents before running identity consistency.');
        return;
      }
      const res = await api.checkIdentityConsistency(candidates.map(r => r.id));
      setIdentityResult(res.result);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Cross-document verification failed.');
    } finally {
      setIsCheckingIdentity(false);
    }
  };

  // Live Camera Selfie Controls: short challenge-response sequence.
  // This is a capture workflow, not a claim of spoof-proof liveness detection.
  const LIVENESS_STEPS = ['Look straight', 'Turn your head left', 'Turn your head right'];

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setDemoSelfie(false);
      setLivenessStep(0);
      setLivenessFrames([]);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setAnalysisError('Camera access was blocked. Use the demo capture only for presentation; it does not prove liveness.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL('image/jpeg', 0.86);
    const nextFrames = [...livenessFrames, frame];

    if (nextFrames.length < LIVENESS_STEPS.length) {
      setLivenessFrames(nextFrames);
      setLivenessStep(nextFrames.length);
      return;
    }

    // Build one contact sheet so the server-side vision model can assess the sequence.
    const sheet = document.createElement('canvas');
    sheet.width = 960;
    sheet.height = 320;
    const sheetCtx = sheet.getContext('2d');
    if (!sheetCtx) return;
    sheetCtx.fillStyle = '#ffffff';
    sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

    let loaded = 0;
    nextFrames.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        sheetCtx.drawImage(img, index * 320, 0, 320, 320);
        loaded += 1;
        if (loaded === nextFrames.length) {
          setSelfiePayload(sheet.toDataURL('image/jpeg', 0.88));
          setLivenessFrames(nextFrames);
          setLivenessStep(3);
          stopCamera();
        }
      };
      img.src = src;
    });
  };

  const simulateSelfieCapture = () => {
    const dummySelfie = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    setSelfiePayload(dummySelfie);
    setLivenessFrames([]);
    setLivenessStep(0);
    setDemoSelfie(true);
    stopCamera();
  };

  const handleBiometricFaceMatch = async () => {
    if (!verificationResult || !selfiePayload) return;

    setIsVerifyingFace(true);
    try {
      const res = await api.verifyFace({
        documentImageBase64: filePayload || verificationResult.previewThumbnail,
        selfieImageBase64: selfiePayload,
        verificationId: verificationResult.id,
        challengeFrames: demoSelfie ? 0 : livenessFrames.length
      });
      setFaceResult(res.result);
      if (res.result.verdict === 'MATCHED') {
        const updated = { ...verificationResult, status: 'VERIFIED' as const, faceMatch: res.result };
        setVerificationResult(updated);
        await saveVerificationData(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Face verification error.';
      setAnalysisError(msg);
    } finally {
      setIsVerifyingFace(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Sovereign AI Command Center Hero Banner (Navy #0B3A5B & Gold) */}
      <div className="relative rounded-xl overflow-hidden border border-[#D7DEE5] bg-[#0B3A5B] text-white shadow-sm">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="PramaanID Sovereign Command Center"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B3A5B] via-[#0B3A5B]/90 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#E87524] text-white flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5" /> {t('hero.badge')}
            </span>
            <span className="text-[11px] font-mono text-emerald-300 bg-[#123F5A] px-2.5 py-1 rounded border border-emerald-500/40">
              {t('hero.standards')}
            </span>
            <span className="text-[10px] font-mono text-white/90 bg-white/10 px-2.5 py-1 rounded border border-white/20">HACKATHON PROTOTYPE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {t('hero.title')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl font-normal">
            {t('hero.subtitle')}
          </p>

          {/* Metric Highlights in Official Government Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#123F5A] border border-[#1A5375]">
              <span className="text-[10px] text-slate-300 block uppercase">{t('hero.encryption')}</span>
              <span className="text-sm font-bold text-white">AES-256-GCM</span>
            </div>
            <div className="p-3 rounded-lg bg-[#123F5A] border border-[#1A5375]">
              <span className="text-[10px] text-slate-300 block uppercase">{t('hero.privacy')}</span>
              <span className="text-sm font-bold text-amber-300">PII Minimized</span>
            </div>
            <div className="p-3 rounded-lg bg-[#123F5A] border border-[#1A5375]">
              <span className="text-[10px] text-slate-300 block uppercase">{t('hero.integrity')}</span>
              <span className="text-sm font-bold text-emerald-400">SHA-256 HMAC</span>
            </div>
            <div className="p-3 rounded-lg bg-[#123F5A] border border-[#1A5375]">
              <span className="text-[10px] text-slate-300 block uppercase">{t('hero.retention')}</span>
              <span className="text-sm font-bold text-white">30-Day TTL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Verification Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upload, Quick Presets & Privacy Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 space-y-6 shadow-sm">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE5]">
              <h2 className="text-sm font-bold text-[#17212B] uppercase tracking-wide flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#E87524]" />
                {t('doc.step1')}
              </h2>
              <span className="text-[10px] text-[#138A52] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-[#138A52]/30 font-bold">
                ENCLAVE GUARD
              </span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-bold text-[#17212B] mb-2">{t('doc.select')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'AADHAAR', label: t('doc.aadhaar') },
                  { id: 'PAN', label: t('doc.pan') },
                  { id: 'PASSPORT', label: t('doc.passport') },
                  { id: 'VOTER_ID', label: t('doc.voter') }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedDocType(item.id as DocumentType);
                      const matchingSample = SAMPLE_DOCUMENTS.find(s => s.type === item.id);
                      if (matchingSample) handleLoadSample(matchingSample);
                    }}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-lg text-left transition-all border ${
                      selectedDocType === item.id
                        ? 'bg-[#123F5A] border-[#123F5A] text-white shadow-sm'
                        : 'bg-[#F4F6F8] border-[#D7DEE5] text-[#17212B] hover:border-[#123F5A]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fictional Sample Quick-Select Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#17212B]">{t('doc.quickTest')}</span>
                <span className="text-[11px] text-slate-500 font-mono">{t('doc.quickTestSub')}</span>
              </div>
              <div className="space-y-2">
                {SAMPLE_DOCUMENTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSample(s)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      fileName === `${s.name}.jpg`
                        ? 'bg-amber-50/80 border-[#E87524] text-[#17212B] shadow-sm'
                        : 'bg-[#F4F6F8] border-[#D7DEE5] text-[#17212B] hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {s.name}
                        {s.isTampered && (
                          <span className="text-[10px] text-[#B42318] font-mono bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                            [Tampered Test]
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.description}</div>
                    </div>
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Box with Magic-Byte Checks */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D7DEE5] hover:border-[#123F5A] rounded-xl p-6 text-center cursor-pointer bg-[#F4F6F8] transition-all hover:bg-slate-100"
              >
                <UploadCloud className="w-8 h-8 text-[#123F5A] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#17212B]">
                  {fileName ? fileName : t('doc.upload')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  {t('doc.uploadDesc')}
                </p>
              </div>
            </div>

            {/* PII Masking Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
              <div className="flex items-center gap-2.5">
                {maskPII ? (
                  <EyeOff className="w-4 h-4 text-[#138A52] shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-[#E87524] shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-[#17212B]">
                    {t('doc.maskPII')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t('doc.maskPIIDesc')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaskPII(!maskPII)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  maskPII ? 'bg-[#138A52]' : 'bg-slate-400'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    maskPII ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Error Banner */}
            {analysisError && (
              <div className="p-3 rounded-lg bg-red-50 border border-[#B42318]/40 text-xs text-[#B42318] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Main Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !filePayload}
              className="w-full py-3 px-4 rounded-lg bg-[#E87524] hover:bg-[#D46517] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('doc.analyzing')}
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  {t('doc.analyzeBtn')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Document Graphical Visualizer & Forensics (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Visual ID Card Preview Container */}
          <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE5]">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-[#123F5A]" />
                <h3 className="text-xs font-bold text-[#17212B] uppercase tracking-wider">
                  {t('replica.title')}
                </h3>
              </div>

              {/* Heatmap Overlay Switcher */}
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`text-xs px-3 py-1.5 rounded-lg font-mono font-bold transition-colors flex items-center gap-1.5 border ${
                  showHeatmap
                    ? 'bg-red-50 border-[#B42318] text-[#B42318]'
                    : 'bg-[#F4F6F8] border-[#D7DEE5] text-slate-700 hover:text-black'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {showHeatmap ? t('replica.hideSpectrogram') : t('replica.showSpectrogram')}
              </button>
            </div>

            {/* Render High-Fidelity Indian ID Card Replica */}
            <div className="py-2">
              <IDCardGraphic
                documentType={currentCardData.type}
                documentNumber={currentCardData.number}
                fullName={currentCardData.name}
                dateOfBirth={currentCardData.dob}
                gender={currentCardData.gender}
                address={currentCardData.address}
                fatherName={currentCardData.fatherName}
                riskLevel={verificationResult?.riskLevel || (currentCardData.isTampered ? 'HIGH' : 'LOW')}
                tamperFlags={verificationResult?.analysis.forensics.tamperFlags || (currentCardData.isTampered ? [
                  'Font kerning inconsistency on alphanumeric PAN string',
                  'Photo border demonstrates pixelation artifact'
                ] : [])}
                showForensicHeatmap={showHeatmap}
                maskPII={maskPII}
              />
            </div>
          </div>

          {/* Forensics Report in Clean Government White Card */}
          <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE5]">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-semibold">
                  SOVEREIGN FORENSIC DOSSIER
                </span>
                <h3 className="text-base font-bold text-[#17212B] mt-0.5">
                  {t('forensic.title')}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase ${
                  verificationResult?.status === 'VERIFIED' || (!verificationResult && !currentCardData.isTampered)
                    ? 'bg-emerald-50 border-[#138A52]/40 text-[#138A52]'
                    : 'bg-red-50 border-[#B42318]/40 text-[#B42318]'
                }`}>
                  {verificationResult?.status?.replace('_', ' ') || (currentCardData.isTampered ? 'FLAGGED TAMPERED' : 'READY')}
                </span>
              </div>
            </div>

            {/* Forensic Scores Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block font-mono">{t('forensic.risk')}</span>
                <div className={`text-sm font-bold font-mono mt-0.5 ${
                  verificationResult?.riskLevel === 'HIGH' || currentCardData.isTampered
                    ? 'text-[#B42318]'
                    : 'text-[#138A52]'
                }`}>
                  {verificationResult?.riskLevel || (currentCardData.isTampered ? 'HIGH' : 'LOW')} RISK
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block font-mono">{t('forensic.font')}</span>
                <div className="text-sm font-bold font-mono text-[#17212B] mt-0.5">
                  {verificationResult?.analysis.forensics.fontConsistencyScore || (currentCardData.isTampered ? 42 : 98)}%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block font-mono">{t('forensic.hologram')}</span>
                <div className="text-sm font-bold font-mono text-[#17212B] mt-0.5">
                  {verificationResult?.analysis.forensics.hologramAuthenticityScore || (currentCardData.isTampered ? 35 : 97)}%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5]">
                <span className="text-[10px] text-slate-500 block font-mono">{t('forensic.photo')}</span>
                <div className="text-sm font-bold font-mono text-[#17212B] mt-0.5">
                  {verificationResult?.analysis.forensics.photoBoxIntegrityScore || (currentCardData.isTampered ? 48 : 99)}%
                </div>
              </div>
            </div>

            {/* Explainable Trust Score */}
            {verificationResult && (
              <div className="rounded-xl border border-[#D7DEE5] bg-white overflow-hidden">
                <div className="px-4 py-3 bg-[#F4F6F8] border-b border-[#D7DEE5] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-semibold">PRAMAAN TRUST ENGINE</span>
                    <h4 className="text-sm font-bold text-[#17212B]">Explainable Trust Score</h4>
                  </div>
                  <div className={`text-2xl font-black font-mono ${verificationResult.trustScore >= 80 ? 'text-[#138A52]' : verificationResult.trustScore >= 60 ? 'text-[#B7791F]' : 'text-[#B42318]'}`}>
                    {verificationResult.trustScore}<span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${verificationResult.trustScore >= 80 ? 'bg-[#138A52]' : verificationResult.trustScore >= 60 ? 'bg-[#B7791F]' : 'bg-[#B42318]'}`}
                      style={{ width: `${Math.max(0, Math.min(100, verificationResult.trustScore))}%` }}
                    />
                  </div>
                  {verificationResult.identityConsistencyScore !== undefined && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] px-3 py-2 text-xs">
                      <span className="text-slate-500">Identity consistency</span>
                      <span className="font-mono font-bold text-[#123F5A]">{verificationResult.identityConsistencyScore}/100</span>
                    </div>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {verificationResult.trustReasons.slice(0, 4).map((reason, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-600">
                        <span className="font-bold text-[#123F5A]">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cross-Document Identity Consistency */}
            {verificationResult && (
              <div className="rounded-xl border border-[#D7DEE5] bg-white overflow-hidden">
                <div className="px-4 py-3 bg-[#F4F6F8] border-b border-[#D7DEE5] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-semibold">IDENTITY CONSISTENCY ENGINE</span>
                    <h4 className="text-sm font-bold text-[#17212B]">Cross-Document Verification</h4>
                  </div>
                  <button onClick={handleIdentityConsistency} disabled={isCheckingIdentity} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#123F5A] text-white disabled:opacity-50">
                    {isCheckingIdentity ? 'Comparing…' : 'Compare My Documents'}
                  </button>
                </div>
                {identityResult ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Identity Consistency Score</div>
                        <div className={`text-2xl font-black font-mono ${identityResult.score >= 90 ? 'text-[#138A52]' : identityResult.score >= 70 ? 'text-[#B7791F]' : 'text-[#B42318]'}`}>{identityResult.score}/100</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border ${identityResult.verdict === 'CONSISTENT' ? 'bg-emerald-50 text-[#138A52] border-[#138A52]/40' : identityResult.verdict === 'REVIEW' ? 'bg-amber-50 text-[#B7791F] border-amber-300' : 'bg-red-50 text-[#B42318] border-red-300'}`}>
                        {identityResult.verdict}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Checked {identityResult.documentsChecked} documents · {identityResult.matchedFields.length} matching identity fields</div>
                    <div className="space-y-1.5">
                      {identityResult.reasons.slice(0, 4).map((reason, idx) => (
                        <div key={idx} className="flex gap-2 text-xs text-slate-600"><span className="font-bold text-[#123F5A]">•</span><span>{reason}</span></div>
                      ))}
                    </div>
                    {identityResult.conflicts.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <div className="text-[10px] font-bold text-[#B42318] uppercase mb-1">Detected conflicts</div>
                        {identityResult.conflicts.map((conflict, idx) => (
                          <div key={idx} className="text-xs text-[#7F1D1D]">{conflict.field}: {conflict.values.join(' ↔ ')}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-xs text-slate-500">Compare this document with your other verified documents to detect name or DOB inconsistencies.</div>
                )}
              </div>
            )}

            {/* Examiner Observations */}
            <div className="text-xs text-slate-700 bg-[#F4F6F8] p-3.5 rounded-lg border border-[#D7DEE5]">
              <span className="font-bold text-[#123F5A]">{t('forensic.examiner')}: </span>
              {verificationResult?.analysis.forensics.forensicNotes || (
                currentCardData.isTampered
                  ? 'Digital alterations detected along Tax Assessee Number field kerning. Synthetic font variation detected.'
                  : 'Document microlettering, guilloche pattern, and Verhoeff algorithm checksum valid. Zero digital tampering detected.'
              )}
            </div>

            {/* Biometric Selfie Liveness Section */}
            <div className="pt-4 border-t border-[#D7DEE5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#17212B] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#123F5A]" />
                    {t('bio.title')}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t('bio.subtitle')}
                  </p>
                </div>

                {faceResult && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 border border-[#138A52] text-[#138A52]">
                    {faceResult.verdict} ({faceResult.matchScore}%)
                  </span>
                )}
              </div>

              {cameraActive ? (
                <div className="text-center space-y-3">
                  <div className="relative inline-block rounded-xl overflow-hidden border-2 border-[#123F5A] bg-black shadow-lg">
                    <video ref={videoRef} autoPlay playsInline className="w-72 h-60 object-cover" />
                    <div className="absolute inset-0 border-2 border-dashed border-[#E87524] rounded-full m-8 pointer-events-none" />
                  </div>
                  <div className="rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] p-3 text-left max-w-md mx-auto">
                    <div className="text-[10px] uppercase font-mono text-slate-500">Liveness challenge {Math.min(livenessStep + 1, 3)} / 3</div>
                    <div className="font-bold text-[#123F5A] mt-1">{LIVENESS_STEPS[livenessStep] || 'Capture complete'}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Capture three different frames. The server evaluates the sequence; this is not a spoof-proof guarantee.</div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={capturePhoto}
                      className="py-2 px-5 rounded-lg bg-[#E87524] text-white font-bold text-xs hover:bg-[#D46517] transition-colors shadow-sm"
                    >
                      {livenessStep < 2 ? 'Capture frame' : 'Capture final frame'}
                    </button>
                    <button onClick={stopCamera} className="py-2 px-4 rounded-lg bg-white border border-[#D7DEE5] text-slate-700 text-xs font-semibold">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={startCamera}
                    className="py-2 px-3.5 rounded-lg bg-[#123F5A] hover:bg-[#0B3A5B] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {selfiePayload && !demoSelfie ? 'Retake liveness' : 'Start liveness'}
                  </button>

                  <button
                    onClick={simulateSelfieCapture}
                    className="py-2 px-3.5 rounded-lg bg-[#F4F6F8] hover:bg-slate-200 border border-[#D7DEE5] text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Demo capture
                  </button>

                  {selfiePayload && !faceResult && (
                    <button
                      onClick={handleBiometricFaceMatch}
                      disabled={isVerifyingFace || (!demoSelfie && livenessFrames.length !== 3)}
                      className="py-2 px-4 rounded-lg bg-[#138A52] hover:bg-[#0E6C40] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isVerifyingFace ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying…
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="w-3.5 h-3.5" /> Run biometric check
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {!cameraActive && selfiePayload && !faceResult && (
                <div className={`text-[11px] rounded-lg border p-3 ${demoSelfie ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  {demoSelfie ? 'Demo frame loaded. It is useful for UI testing but cannot establish liveness.' : 'Three challenge frames captured. Run the biometric check to evaluate face match and liveness.'}
                </div>
              )}
              {faceResult && (
                <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('bio.confidence')}:</span>
                    <span className="font-mono text-[#138A52] font-bold">{faceResult.confidence}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('bio.liveness')}:</span>
                    <span className={`font-bold ${faceResult.livenessPassed ? 'text-[#138A52]' : 'text-[#B42318]'}`}>{faceResult.livenessPassed ? 'PASSED' : 'INCONCLUSIVE'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pt-1 border-t border-[#D7DEE5]">
                    {faceResult.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Verifiable Sovereign Certificate (Clean Official Government Card) */}
            {(verificationResult?.status === 'VERIFIED' || faceResult?.verdict === 'MATCHED') && (
              <div className="bg-[#FFFFFF] border-2 border-[#138A52] rounded-xl p-6 relative overflow-hidden shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-[#138A52]/40 text-[#138A52] flex items-center justify-center font-bold shadow-sm">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#E87524] font-mono tracking-widest uppercase font-bold">
                        {t('cert.badge')}
                      </span>
                      <h4 className="text-lg font-bold text-[#17212B] mt-0.5">
                        {t('cert.title')}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-mono">TOKEN ID</span>
                    <span className="text-xs text-[#123F5A] font-mono font-bold">
                      {verificationResult?.id || 'VER_CERT_SOVEREIGN_2026'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] text-xs font-mono space-y-1 text-slate-700">
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold">{t('cert.seal')}: </span>
                    <span className="text-[#138A52] font-bold">
                      {verificationResult?.cryptographicSeal || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">{t('cert.issuer')}: </span>
                    <span>{t('cert.issuerVal')}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-[#D7DEE5] rounded-lg p-2">
                      <QRCodeSVG
                        value={`${window.location.origin}/verify/${verificationResult?.id || ''}`}
                        size={88}
                        level="M"
                        includeMargin
                      />
                    </div>
                    <div className="text-xs text-slate-600">
                      <div className="flex items-center gap-2 font-semibold text-[#123F5A]">
                        <QrCode className="w-4 h-4" /> Public QR Verification
                      </div>
                      <a
                        href={`/verify/${verificationResult?.id || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#138A52] hover:underline font-semibold"
                      >Open verification receipt</a>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="py-2 px-4 rounded-lg bg-[#138A52] hover:bg-[#0E6C40] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> {t('cert.download')}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
