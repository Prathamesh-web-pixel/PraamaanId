/**
 * Interactive Video Simulation Guide: "How People Login, Verify & Logout"
 * Displayed prominently at the footer.
 * Features:
 * - 16:9 HD Video Player Frame (#0B3A5B / #123F5A)
 * - Play/Pause, Timeline Scrubber, Speed Toggle (1x, 1.5x, 2x), Subtitles
 * - High-fidelity animated UI simulation demonstrating:
 *   1. How people Log In (Sovereign Credentials & Sign In with Google)
 *   2. Identity SSO Verification
 *   3. Document Ingestion & PII Masking
 *   4. Biometric Face Liveness Match
 *   5. How people Log Out (Session Revocation & Cookie Destruction)
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  KeyRound,
  FileCheck2,
  Camera,
  Download,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Subtitles,
  UserCheck
} from 'lucide-react';

interface Chapter {
  id: number;
  time: number; // in seconds
  titleKey: string;
  badge: string;
  description: string;
  subtitle: string;
  screenType: 'LOGIN' | 'GOOGLE_SSO' | 'DOCUMENT' | 'BIOMETRIC' | 'LOGOUT';
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    time: 0,
    titleKey: 'video.step1',
    badge: 'AUTHENTICATION',
    description: 'Applicant accesses the Sovereign Login Gate, enters registered sovereign email & password, and solves the security anti-bot captcha. The backend verifies credentials via Bcrypt-10 and issues an HttpOnly SameSite=Strict cookie.',
    subtitle: 'Step 1: User enters email, secure password & captcha. Bcrypt authentication verifies credentials and issues HttpOnly session.',
    screenType: 'LOGIN'
  },
  {
    id: 2,
    time: 20,
    titleKey: 'video.step1',
    badge: 'SIGN IN WITH GOOGLE',
    description: 'Applicant can authenticate directly using Sign In with Google. The sovereign enclave verifies the secure OAuth token and synchronizes the citizen identity profile.',
    subtitle: 'Step 2: Sign In with Google authenticates identity in 1 click, synchronizing citizen profile under zero-trust privacy.',
    screenType: 'GOOGLE_SSO'
  },
  {
    id: 3,
    time: 40,
    titleKey: 'video.step2',
    badge: 'PII MASKING & INGESTION',
    description: 'Applicant uploads their Aadhaar / PAN card. Client checks magic bytes, while the PII Redaction toggle ensures the first 8 digits (XXXX-XXXX-9021) are masked prior to AES-256 storage.',
    subtitle: 'Step 3: Identity proof uploaded. First 8 digits of Aadhaar redacted to prevent sensitive PII leakage.',
    screenType: 'DOCUMENT'
  },
  {
    id: 4,
    time: 65,
    titleKey: 'video.step3',
    badge: 'BIOMETRIC LIVENESS',
    description: 'Live webcam is activated to capture applicant selfie. Gemini AI correlates document facial landmarks with the live camera frame to prevent spoofing or printed photo presentation attacks.',
    subtitle: 'Step 4: Live selfie camera validates 3D facial landmarks and anti-spoofing vectors against document photograph.',
    screenType: 'BIOMETRIC'
  },
  {
    id: 5,
    time: 85,
    titleKey: 'video.step5',
    badge: 'SESSION REVOCATION & LOGOUT',
    description: 'To end the session, the user clicks "Sign Out". The server destroys the active token in memory, instructs browser to delete the HttpOnly cookie, and records an immutable logout audit trail entry.',
    subtitle: 'Step 5: User clicks Sign Out. Server revokes token, purges cookie, and records immutable audit log.',
    screenType: 'LOGOUT'
  }
];

const TOTAL_DURATION = 100; // 100 seconds simulation

export const AuthVideoWalkthrough: React.FC = () => {
  const { t, lang } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Playback timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Sync active chapter with current time
  useEffect(() => {
    let idx = 0;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (currentTime >= CHAPTERS[i].time) {
        idx = i;
        break;
      }
    }
    setActiveChapterIndex(idx);
  }, [currentTime]);

  const currentChapter = CHAPTERS[activeChapterIndex];

  const seekToChapter = (chap: Chapter) => {
    setCurrentTime(chap.time);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#D7DEE5] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D7DEE5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E87524]/10 text-[#E87524] border border-[#E87524]/30">
              OFFICIAL VIDEO TUTORIAL
            </span>
            <span className="text-xs text-slate-500 font-mono">1080p HD Sovereign Walkthrough</span>
          </div>
          <h2 className="text-xl font-bold text-[#17212B] tracking-tight mt-1">
            {t('video.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {t('video.subtitle')}
          </p>
        </div>

        {/* Master Play / Pause Button */}
        <button
          onClick={() => {
            setIsPlaying(!isPlaying);
            if (!isPlaying && currentTime >= TOTAL_DURATION) setCurrentTime(0);
          }}
          className="self-start sm:self-auto py-2.5 px-6 rounded-lg bg-[#123F5A] hover:bg-[#0B3A5B] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>{t('video.pause')}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{t('video.play')}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Video Screen Simulator */}
      <div className="relative rounded-xl overflow-hidden border-2 border-[#123F5A] bg-[#0B3A5B] text-white shadow-2xl">
        
        {/* Top Video Header HUD */}
        <div className="bg-[#0B3A5B]/90 backdrop-blur border-b border-[#123F5A] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E87524] animate-pulse" />
            <span className="text-slate-200 font-semibold">PRAMAAN-ID SOVEREIGN VIDEO PLAYER</span>
            <span className="text-slate-400">·</span>
            <span className="text-[#E87524] font-bold">STEP {currentChapter.id}/5: {currentChapter.badge}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="font-mono">{formatSeconds(currentTime)} / {formatSeconds(TOTAL_DURATION)}</span>
            <span className="bg-[#123F5A] px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold">HD 1080p</span>
          </div>
        </div>

        {/* Video Canvas Simulation Area */}
        <div className="min-h-[380px] p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#0B3A5B] via-[#0E283D] to-[#081B2B]">
          
          {/* Subtle Video Grid */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Big Center Play Icon when Paused */}
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute z-20 w-16 h-16 rounded-full bg-[#E87524]/90 hover:bg-[#E87524] text-white flex items-center justify-center shadow-2xl backdrop-blur transition-transform hover:scale-110 cursor-pointer"
              title="Click to Play"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          )}

          {/* Chapter 1: LOGIN SIMULATION */}
          {currentChapter.screenType === 'LOGIN' && (
            <div className="w-full max-w-md bg-[#FFFFFF] text-[#17212B] p-6 rounded-xl border border-[#D7DEE5] shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#D7DEE5] pb-2">
                <span className="text-xs font-bold text-[#123F5A] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#E87524]" /> 1. MeriPehchaan Sovereign Login Gate
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                  Bcrypt Cost 10
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Official Registered Email</span>
                  <div className="p-2.5 rounded bg-[#F4F6F8] border border-[#D7DEE5] font-mono text-slate-800 flex items-center justify-between">
                    <span>citizen@pramaan.gov.in</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#138A52]" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Secure Password</span>
                  <div className="p-2.5 rounded bg-[#F4F6F8] border border-[#D7DEE5] font-mono text-slate-700 flex items-center justify-between">
                    <span>••••••••••••••••</span>
                    <span className="text-[10px] text-[#138A52] font-semibold">Salted &amp; Hashed</span>
                  </div>
                </div>
              </div>
              <div className="py-2.5 px-3 rounded bg-[#123F5A] text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm">
                <KeyRound className="w-3.5 h-3.5" /> Authenticate &amp; Set HttpOnly Cookie
              </div>
            </div>
          )}

          {/* Chapter 2: GOOGLE SSO */}
          {currentChapter.screenType === 'GOOGLE_SSO' && (
            <div className="w-full max-w-md bg-[#FFFFFF] text-[#17212B] p-6 rounded-xl border border-[#D7DEE5] shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#D7DEE5] pb-2">
                <span className="text-xs font-bold text-[#123F5A] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#138A52]" /> 2. Sign In with Google
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                  AUTHENTICATED
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F4F6F8] border border-[#D7DEE5] text-xs space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#D7DEE5] flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-[#17212B] block">citizen.india@gmail.com</span>
                    <span className="text-[11px] text-[#138A52] font-semibold">Verified Identity Token</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono text-center">
                1-Click Sovereign Citizen Sign In
              </div>
            </div>
          )}

          {/* Chapter 3: DOCUMENT INGESTION & PII MASKING */}
          {currentChapter.screenType === 'DOCUMENT' && (
            <div className="w-full max-w-md bg-[#FFFFFF] text-[#17212B] p-6 rounded-xl border border-[#D7DEE5] shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#D7DEE5] pb-2">
                <span className="text-xs font-bold text-[#123F5A] flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#138A52]" /> 3. Document Ingestion &amp; PII Redaction
                </span>
                <span className="text-[10px] text-[#138A52] font-mono">Magic Bytes: Valid</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Aadhaar Card Ingested</span>
                  <span className="font-mono text-slate-600">XXXX-XXXX-9021</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#138A52] text-white text-[10px] font-bold font-mono">
                  PII MASKED
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#F4F6F8] border border-[#D7DEE5] text-[11px] text-slate-600">
                Payload encrypted with authenticated <strong>AES-256-GCM</strong>. Zero unmasked digits stored in cleartext.
              </div>
            </div>
          )}

          {/* Chapter 4: BIOMETRIC MATCH */}
          {currentChapter.screenType === 'BIOMETRIC' && (
            <div className="w-full max-w-md bg-[#FFFFFF] text-[#17212B] p-6 rounded-xl border border-[#D7DEE5] shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#D7DEE5] pb-2">
                <span className="text-xs font-bold text-[#123F5A] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#E87524]" /> 4. Biometric Face Liveness Verification
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">Active Webcam HUD</span>
              </div>
              <div className="h-32 rounded-lg bg-slate-900 border-2 border-[#138A52] relative flex items-center justify-center overflow-hidden">
                <div className="w-20 h-24 border-2 border-dashed border-[#E87524] rounded-full animate-pulse flex items-center justify-center">
                  <span className="text-[10px] text-amber-200 font-mono">Align Face</span>
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-emerald-400">
                  Liveness: 100% · Anti-Spoof: Passed
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#138A52]">
                <span>Biometric Landmark Distance: 0.12 (MATCH)</span>
                <span>Confidence: 96%</span>
              </div>
            </div>
          )}

          {/* Chapter 5: LOGOUT & SESSION REVOCATION */}
          {currentChapter.screenType === 'LOGOUT' && (
            <div className="w-full max-w-md bg-[#FFFFFF] text-[#17212B] p-6 rounded-xl border-2 border-[#B42318] shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#D7DEE5] pb-2">
                <span className="text-xs font-bold text-[#B42318] flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" /> 5. How People Sign Out (Session Purge)
                </span>
                <span className="text-[10px] font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                  TOKEN DESTROYED
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-red-50 text-xs text-[#B42318] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Session Token Purged From Server Memory
                </div>
                <p className="text-[11px] text-slate-600">
                  HttpOnly authentication cookie is explicitly invalidated. The user is returned to the login gate.
                </p>
              </div>
              <div className="text-center font-mono text-[11px] text-slate-500">
                Audit Event: <span className="text-[#17212B] font-bold">LOGOUT (Status: SUCCESS)</span>
              </div>
            </div>
          )}

        </div>

        {/* Subtitles Overlay Bar */}
        {showSubtitles && (
          <div className="bg-[#081B2B]/95 border-t border-[#123F5A] px-4 py-2 text-center text-xs text-amber-200 font-medium">
            <span className="opacity-75">[Audio Voiceover Transcript] </span>
            {currentChapter.subtitle}
          </div>
        )}

        {/* Timeline Scrubber & Player Controls */}
        <div className="bg-[#0B3A5B] p-4 border-t border-[#123F5A] space-y-3">
          
          {/* Scrubber Bar */}
          <div className="relative w-full">
            <input
              type="range"
              min={0}
              max={TOTAL_DURATION}
              value={currentTime}
              onChange={e => setCurrentTime(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#123F5A] rounded-lg appearance-none cursor-pointer accent-[#E87524]"
            />
          </div>

          {/* Control Strip & Chapter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (!isPlaying && currentTime >= TOTAL_DURATION) setCurrentTime(0);
                }}
                className="p-1.5 rounded-md bg-[#123F5A] hover:bg-[#1A5375] text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCurrentTime(0)}
                className="p-1.5 rounded-md bg-[#123F5A] hover:bg-[#1A5375] text-white transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-md bg-[#123F5A] hover:bg-[#1A5375] text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${showSubtitles ? 'bg-[#E87524] text-white' : 'bg-[#123F5A] text-slate-300'}`}
                title="Toggle Subtitles"
              >
                <Subtitles className="w-4 h-4" />
              </button>

              {/* Playback Speed selector */}
              <div className="flex items-center gap-1 bg-[#123F5A] rounded px-1.5 py-0.5 text-[11px] font-bold">
                {[1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${playbackSpeed === speed ? 'bg-[#E87524] text-white' : 'text-slate-300 hover:text-white'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Quick Jump Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              {CHAPTERS.map(chap => {
                const isActive = activeChapterIndex === chap.id - 1;
                return (
                  <button
                    key={chap.id}
                    onClick={() => seekToChapter(chap)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#E87524] text-white shadow-sm'
                        : 'bg-[#123F5A]/60 text-slate-300 hover:bg-[#123F5A]'
                    }`}
                  >
                    Step {chap.id}: {chap.badge.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Step Explanation Callout */}
      <div className="p-4 rounded-xl bg-[#F4F6F8] border border-[#D7DEE5] flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#123F5A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          {currentChapter.id}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#17212B]">
              Step {currentChapter.id}: {currentChapter.badge}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {currentChapter.description}
          </p>
        </div>
      </div>

    </div>
  );
};
