/**
 * Multi-Lingual Sovereign Language Context
 * Supports: English, हिन्दी (Hindi), मराठी (Marathi), தமிழ் (Tamil), বাংলা (Bengali), ગુજરાતી (Gujarati)
 * Persists user preference to localStorage and updates all portal interfaces instantly.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'HI' | 'MR' | 'TA' | 'BN' | 'GU';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'EN', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'MR', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'TA', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'BN', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'GU', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' }
];

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  languages: LanguageInfo[];
  currentLangInfo: LanguageInfo;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  EN: {
    // Top Bar & Navigation
    'gov.title': 'PramaanID Hackathon Prototype',
    'gov.dept': 'AI Identity Trust Lab',
    'nav.verify': 'Verify Document',
    'nav.officer': 'Inspection Queue',
    'nav.admin': 'Administration',
    'nav.audit': 'Audit Trail',
    'nav.security': 'Security & Privacy',
    'nav.login': 'Portal Login',
    'nav.logout': 'Sign Out',
    'nav.myAccount': 'My Account',
    'nav.activePersona': 'Active Persona',
    'enclave.active': 'AES-256 Sovereign Enclave Active',
    'firebase.connected': 'Firebase Cloud Connected (pramaanid)',

    // Hero & Overview
    'hero.badge': 'SOVEREIGN AI CORE ACTIVE',
    'hero.standards': 'UIDAI & NSDL ENCLAVE COMPLIANT',
    'hero.title': 'Sovereign Identity Intelligence & Document Forensics',
    'hero.subtitle': 'National sovereign verification infrastructure powered by Gemini Vision OCR and tamper forensics. Validates micro-text alignment, holographic diffractions, and biometric liveness under zero-trust privacy.',
    'hero.encryption': 'Encryption at Rest',
    'hero.privacy': 'Privacy Guard',
    'hero.integrity': 'Integrity Seal',
    'hero.retention': 'Data Retention',

    // Document Ingestion
    'doc.step1': '1. Select Document & Proof',
    'doc.select': 'Supported Sovereign Documents',
    'doc.aadhaar': 'Aadhaar Smart Card',
    'doc.pan': 'PAN Card (Income Tax)',
    'doc.passport': 'Indian Passport',
    'doc.voter': 'Voter ID (EPIC)',
    'doc.quickTest': 'Quick Test Fictional Cards',
    'doc.quickTestSub': '1-Click Evaluation (Zero Real PII)',
    'doc.upload': 'Upload your official document or PDF',
    'doc.uploadDesc': 'JPEG, PNG, WEBP, PDF up to 5MB · Binary magic-byte inspection',
    'doc.maskPII': 'Sovereign PII Redaction',
    'doc.maskPIIDesc': 'Masks first 8 digits of Aadhaar (XXXX-XXXX-9021)',
    'doc.analyzeBtn': 'Run Sovereign AI OCR & Forensics',
    'doc.analyzing': 'Extracting OCR & Scanning Tamper Vectors...',

    // Document Replica & Forensics
    'replica.title': 'Live Sovereign Document Replica',
    'replica.showSpectrogram': 'Inspect Tamper Spectrogram',
    'replica.hideSpectrogram': 'Disable Tamper Spectrogram',
    'forensic.title': 'AI Forensic Optical & Algorithmic Analysis',
    'forensic.risk': 'Risk Level',
    'forensic.font': 'Font Kerning',
    'forensic.hologram': 'Optic Hologram',
    'forensic.photo': 'Photo Bounding',
    'forensic.examiner': 'Examiner Analysis',

    // Biometrics
    'bio.title': 'Biometric Face Liveness Verification',
    'bio.subtitle': 'Live camera anti-spoofing and 3D facial landmark comparison',
    'bio.startCam': 'Activate Live Camera',
    'bio.retakeCam': 'Retake Live Selfie',
    'bio.loadSample': 'Load Verified Selfie Frame',
    'bio.capture': 'Capture Biometric Frame',
    'bio.runMatch': 'Run Biometric Match',
    'bio.matching': 'Comparing Vectors...',
    'bio.confidence': 'Vector Confidence',
    'bio.liveness': 'Passive Liveness Anti-Spoofing',

    // Certificate
    'cert.badge': 'PRAMAAN PATRA · DIGITAL CERTIFICATE OF IDENTITY',
    'cert.title': 'Verifiable Sovereign Identity Receipt',
    'cert.seal': 'SHA-256 DIGITAL SEAL',
    'cert.issuer': 'ISSUER',
    'cert.issuerVal': 'PramaanID Hackathon Prototype Sovereign Verification Enclave (MeitY)',
    'cert.download': 'Download Official Certificate',

    // Auth Page
    'auth.title': 'Sovereign Portal Authentication',
    'auth.subtitle': 'Sign in with your registered email, Google account, or switch roles to test system access.',
    'auth.email': 'Official / Registered Email',
    'auth.password': 'Secure Password',
    'auth.signInBtn': 'Authenticate Session',
    'auth.registerBtn': 'Register New Citizen Profile',
    'auth.googleSignIn': 'Sign In with Google',
    'auth.quickFill': 'Quick-Fill Sovereign Evaluation Roles:',
    'auth.citizenRole': 'Citizen Applicant',
    'auth.verifierRole': 'Identity Verifier',
    'auth.officerRole': 'Gazetted Officer',
    'auth.adminRole': 'System Administrator',
    'auth.superAdminRole': 'Chief Security Officer',
    'auth.logoutConfirm': 'Are you sure you want to sign out? Your session token will be immediately revoked from the server.',
    'auth.logoutBtn': 'Confirm Sovereign Sign Out',
    'auth.loggedOutTitle': 'You Have Securely Signed Out',
    'auth.loggedOutDesc': 'HttpOnly cookie destroyed and server session invalidated. You may sign back in at any time.',
    'auth.signInAgain': 'Sign In Again',

    // Video Guide
    'video.title': 'How People Login, Verify & Logout — Official Video Guide',
    'video.subtitle': 'Interactive video simulation demonstrating authentication, Google sign-in, PII redaction, facial matching, and secure logout.',
    'video.step1': '01. Authentication',
    'video.step2': '02. Document Ingestion',
    'video.step3': '03. Biometric Match',
    'video.step4': '04. Verifiable Certificate',
    'video.step5': '05. Secure Sign Out',
    'video.play': 'Play Simulation',
    'video.pause': 'Pause Simulation',
    'video.restart': 'Restart Guide',
    'video.speed': 'Speed'
  },
  HI: {
    // Top Bar & Navigation
    'gov.title': 'प्रमाणID हैकाथॉन प्रोटोटाइप',
    'gov.dept': 'AI Identity Trust Lab',
    'nav.verify': 'दस्तावेज़ सत्यापन',
    'nav.officer': 'निरीक्षण कतार',
    'nav.admin': 'प्रशासन पोर्टल',
    'nav.audit': 'ऑडिट ट्रेल',
    'nav.security': 'सुरक्षा और गोपनीयता',
    'nav.login': 'पोर्टल लॉगिन',
    'nav.logout': 'लॉग आउट',
    'nav.myAccount': 'मेरा खाता',
    'nav.activePersona': 'सक्रिय भूमिका',
    'enclave.active': 'AES-256 संप्रभु एन्क्लेव सक्रिय',
    'firebase.connected': 'फायरबेस क्लाउड कनेक्टेड (pramaanid)',

    // Hero & Overview
    'hero.badge': 'संप्रभु एआई कोर सक्रिय',
    'hero.standards': 'UIDAI और NSDL एन्क्लेव मानक अनुपालित',
    'hero.title': 'संप्रभु पहचान बुद्धिमत्ता और दस्तावेज़ फोरेंसिक',
    'hero.subtitle': 'राष्ट्रीय संप्रभु सत्यापन अवसंरचना, जेमिनी विज़न ओसीआर और छेड़छाड़ फोरेंसिक द्वारा संचालित। शून्य-विश्वास गोपनीयता के तहत माइक्रो-टेक्स्ट संरेखण, होलोग्राम और बायोमेट्रिक सजीवता का सत्यापन करता है।',
    'hero.encryption': 'विश्राम पर एन्क्रिप्शन',
    'hero.privacy': 'गोपनीयता सुरक्षा',
    'hero.integrity': 'अखंडता मुहर',
    'hero.retention': 'डेटा प्रतिधारण',

    // Document Ingestion
    'doc.step1': '1. दस्तावेज़ और प्रमाण चुनें',
    'doc.select': 'समर्थित संप्रभु दस्तावेज़',
    'doc.aadhaar': 'आधार स्मार्ट कार्ड',
    'doc.pan': 'पैन कार्ड (आयकर विभाग)',
    'doc.passport': 'भारतीय पासपोर्ट',
    'doc.voter': 'मतदाता पहचान पत्र (EPIC)',
    'doc.quickTest': 'काल्पनिक परीक्षण कार्ड',
    'doc.quickTestSub': '1-क्लिक मूल्यांकन (शून्य वास्तविक डेटा)',
    'doc.upload': 'अपना आधिकारिक दस्तावेज़ या पीडीएफ अपलोड करें',
    'doc.uploadDesc': 'जेपीईजी, पीएनजी, वेबपी, पीडीएफ 5 एमबी तक · बाइनरी मैजिक-बाइट निरीक्षण',
    'doc.maskPII': 'संप्रभु डेटा मास्किंग',
    'doc.maskPIIDesc': 'आधार के पहले 8 अंक छुपाता है (XXXX-XXXX-9021)',
    'doc.analyzeBtn': 'संप्रभु एआई ओसीआर और फोरेंसिक चलाएं',
    'doc.analyzing': 'ओसीआर निकाला जा रहा है और विसंगतियों की जांच हो रही है...',

    // Document Replica & Forensics
    'replica.title': 'सजीव संप्रभु दस्तावेज़ प्रतिकृति',
    'replica.showSpectrogram': 'छेड़छाड़ स्पेक्ट्रोग्राम का निरीक्षण करें',
    'replica.hideSpectrogram': 'स्पेक्ट्रोग्राम बंद करें',
    'forensic.title': 'एआई फोरेंसिक ऑप्टिकल और एल्गोरिथम विश्लेषण',
    'forensic.risk': 'जोखिम स्तर',
    'forensic.font': 'फ़ॉन्ट कर्लिंग',
    'forensic.hologram': 'ऑप्टिक होलोग्राम',
    'forensic.photo': 'फ़ोटो बाउंडिंग',
    'forensic.examiner': 'परीक्षक विश्लेषण',

    // Biometrics
    'bio.title': 'बायोमेट्रिक चेहरा सजीवता सत्यापन',
    'bio.subtitle': 'लाइव कैमरा एंटी-स्पूफिंग और 3डी चेहरे के लैंडमार्क की तुलना',
    'bio.startCam': 'लाइव कैमरा सक्रिय करें',
    'bio.retakeCam': 'दोबारा सेल्फी लें',
    'bio.loadSample': 'सत्यापित सेल्फी फ्रेम लोड करें',
    'bio.capture': 'बायोमेट्रिक फ्रेम कैप्चर करें',
    'bio.runMatch': 'बायोमेट्रिक मिलान चलाएं',
    'bio.matching': 'वेक्टर की तुलना की जा रही है...',
    'bio.confidence': 'वेक्टर विश्वास स्कोर',
    'bio.liveness': 'निष्क्रिय सजीवता एंटी-स्पूफिंग',

    // Certificate
    'cert.badge': 'प्रमाण पत्र · डिजिटल पहचान सत्यापन प्रमाण',
    'cert.title': 'सत्यापन योग्य संप्रभु पहचान रसीद',
    'cert.seal': 'SHA-256 डिजिटल मुहर',
    'cert.issuer': 'जारीकर्ता',
    'cert.issuerVal': 'प्रमाणID हैकाथॉन प्रोटोटाइप संप्रभु सत्यापन एन्क्लेव (MeitY)',
    'cert.download': 'आधिकारिक प्रमाण पत्र डाउनलोड करें',

    // Auth Page
    'auth.title': 'संप्रभु पोर्टल प्रमाणीकरण',
    'auth.subtitle': 'अपने पंजीकृत ईमेल, फायरबेस क्लाउड खाते से साइन इन करें या भूमिकाएं बदलें।',
    'auth.email': 'आधिकारिक / पंजीकृत ईमेल',
    'auth.password': 'सुरक्षित पासवर्ड',
    'auth.signInBtn': 'सत्र प्रमाणित करें',
    'auth.registerBtn': 'नया नागरिक प्रोफ़ाइल पंजीकृत करें',
    'auth.googleSignIn': 'गूगल से साइन इन करें',
    'auth.quickFill': 'मूल्यांकन भूमिकाओं का त्वरित चयन:',
    'auth.citizenRole': 'नागरिक आवेदक',
    'auth.verifierRole': 'पहचान सत्यापनकर्ता',
    'auth.officerRole': 'राजपत्रित अधिकारी',
    'auth.adminRole': 'सिस्टम प्रशासक',
    'auth.superAdminRole': 'मुख्य सुरक्षा अधिकारी',
    'auth.logoutConfirm': 'क्या आप वाकई लॉग आउट करना चाहते हैं? आपका सत्र टोकन सर्वर से तुरंत रद्द कर दिया जाएगा।',
    'auth.logoutBtn': 'सुरक्षित लॉग आउट की पुष्टि करें',
    'auth.loggedOutTitle': 'आप सुरक्षित रूप से लॉग आउट हो चुके हैं',
    'auth.loggedOutDesc': 'HttpOnly कुकी नष्ट कर दी गई है और सर्वर सत्र अमान्य कर दिया गया है।',
    'auth.signInAgain': 'पुनः साइन इन करें',

    // Video Guide
    'video.title': 'लोग कैसे लॉगिन, सत्यापन और लॉगआउट करते हैं — आधिकारिक वीडियो गाइड',
    'video.subtitle': 'प्रमाणीकरण, गूगल साइन-इन, पीआईआई मास्किंग, बायोमेट्रिक मिलान और सुरक्षित सत्र निरसन का वीडियो सिमुलेशन।',
    'video.step1': '01. प्रमाणीकरण',
    'video.step2': '02. दस्तावेज़ अपलोड',
    'video.step3': '03. बायोमेट्रिक मिलान',
    'video.step4': '04. डिजिटल प्रमाण पत्र',
    'video.step5': '05. सुरक्षित लॉग आउट',
    'video.play': 'सिमुलेशन चलाएं',
    'video.pause': 'सिमुलेशन रोकें',
    'video.restart': 'गाइड पुनः प्रारंभ करें',
    'video.speed': 'गति'
  },
  MR: {
    'gov.title': 'प्रमाणID हैकाथॉन प्रोटोटाइप',
    'gov.dept': 'इलेक्ट्रॉनिक्स आणि माहिती तंत्रज्ञान मंत्रालय (MeitY)',
    'nav.verify': 'कागदपत्र पडताळणी',
    'nav.officer': 'तपासणी रांग',
    'nav.admin': 'प्रशासन पोर्टल',
    'nav.audit': 'ऑडिट ट्रेल',
    'nav.security': 'सुरक्षा आणि गोपनीयता',
    'nav.login': 'पोर्टल लॉगिन',
    'nav.logout': 'लॉग आउट',
    'nav.myAccount': 'माझे खाते',
    'nav.activePersona': 'सक्रिय भूमिका',
    'enclave.active': 'AES-256 सार्वभौम एन्क्लेव्ह सक्रिय',
    'firebase.connected': 'फायरबेस क्लाउड कनेक्टेड (pramaanid)',

    'hero.badge': 'सार्वभौम एआय सक्रिय',
    'hero.standards': 'UIDAI आणि NSDL मानके प्रमाणित',
    'hero.title': 'सार्वभौम ओळख बुद्धिमत्ता आणि दस्तऐवज फॉरेन्सिक्स',
    'hero.subtitle': 'राष्ट्रीय सार्वभौम पडताळणी पायाभूत सुविधा, जेमिनी व्हिजन ओसीआर आणि छेडछाड फॉरेन्सिक्स द्वारे संचलित.',
    'hero.encryption': 'विश्रांतीदरम्यान एन्क्रिप्शन',
    'hero.privacy': 'गोपनीयता रक्षक',
    'hero.integrity': 'अखंडता शिक्का',
    'hero.retention': 'डेटा धारणा',

    'doc.step1': '१. दस्तऐवज आणि पुरावा निवडा',
    'doc.select': 'समर्थित सार्वभौम कागदपत्रे',
    'doc.aadhaar': 'आधार स्मार्ट कार्ड',
    'doc.pan': 'पॅन कार्ड',
    'doc.passport': 'भारतीय पासपोर्ट',
    'doc.voter': 'मतदार ओळखपत्र',
    'doc.quickTest': 'चाचणी कार्डे',
    'doc.quickTestSub': '१-क्लिक मूल्यांकन (शून्य खरा डेटा)',
    'doc.upload': 'तुमचे अधिकृत दस्तऐवज किंवा पीडीएफ अपलोड करा',
    'doc.uploadDesc': 'JPEG, PNG, WEBP, PDF 5MB पर्यंत',
    'doc.maskPII': 'सार्वभौम डेटा मास्किंग',
    'doc.maskPIIDesc': 'आधारचे पहिले ८ अंक लपवा (XXXX-XXXX-9021)',
    'doc.analyzeBtn': 'सार्वभौम एआय फॉरेन्सिक्स चालवा',
    'doc.analyzing': 'विश्लेषण सुरू आहे...',

    'replica.title': 'थेट सार्वभौम दस्तऐवज प्रतिकृती',
    'replica.showSpectrogram': 'स्पेक्ट्रोग्राम तपासा',
    'replica.hideSpectrogram': 'स्पेक्ट्रोग्राम बंद करा',
    'forensic.title': 'एआय फॉरेन्सिक विश्लेषण',
    'forensic.risk': 'धोका पातळी',
    'forensic.font': 'फॉन्ट संरेखन',
    'forensic.hologram': 'होलोग्राम',
    'forensic.photo': 'फोटो विश्लेषण',
    'forensic.examiner': 'परीक्षक मत',

    'bio.title': 'बायोमेट्रिक चेहरा पडताळणी',
    'bio.subtitle': 'थेट कॅमेरा अँटी-स्पूफिंग आणि ३डी फेस लँडमार्क मॅचिंग',
    'bio.startCam': 'कॅमेरा सुरू करा',
    'bio.retakeCam': 'पुन्हा सेल्फी घ्या',
    'bio.loadSample': 'चाचणी सेल्फी लोड करा',
    'bio.capture': 'फोटो घ्या',
    'bio.runMatch': 'बायोमेट्रिक मॅच करा',
    'bio.matching': 'तुलना सुरू आहे...',
    'bio.confidence': 'विश्वास गुण',
    'bio.liveness': 'सजीवता पडताळणी',

    'cert.badge': 'प्रमाण पत्र · डिजिटल ओळख पडताळणी',
    'cert.title': 'सार्वभौम ओळख पावती',
    'cert.seal': 'SHA-256 डिजिटल शिक्का',
    'cert.issuer': 'जारीकर्ता',
    'cert.issuerVal': 'प्रमाणID हैकाथॉन प्रोटोटाइप (MeitY)',
    'cert.download': 'प्रमाणपत्र डाउनलोड करा',

    'auth.title': 'सार्वभौम पोर्टल प्रमाणीकरण',
    'auth.subtitle': 'तुमच्या नोंदणीकृत ईमेलने किंवा फायरबेस खात्याने साइन इन करा.',
    'auth.email': 'नोंदणीकृत ईमेल',
    'auth.password': 'सुरक्षित पासवर्ड',
    'auth.signInBtn': 'सत्र प्रमाणित करा',
    'auth.registerBtn': 'नवीन नागरिक नोंदणी',
    'auth.firebaseGoogle': 'फायरबेस गुगलने साइन इन करा',
    'auth.quickFill': 'मूल्यांकन भूमिका निवडा:',
    'auth.citizenRole': 'नागरिक अर्जदार',
    'auth.verifierRole': 'पडताळणी अधिकारी',
    'auth.officerRole': 'राजपत्रित अधिकारी',
    'auth.adminRole': 'सिस्टम प्रशासक',
    'auth.superAdminRole': 'मुख्य सुरक्षा अधिकारी',
    'auth.logoutConfirm': 'तुम्हाला नक्की लॉग आउट करायचे आहे का?',
    'auth.logoutBtn': 'लॉग आउटची पुष्टी करा',
    'auth.loggedOutTitle': 'तुम्ही सुरक्षितपणे लॉग आउट झाले आहात',
    'auth.loggedOutDesc': 'HttpOnly कुकी नष्ट केली गेली आहे.',
    'auth.signInAgain': 'पुन्हा साइन इन करा',

    'video.title': 'लोक कसे लॉगिन, पडताळणी आणि लॉगआउट करतात — व्हिडिओ मार्गदर्शक',
    'video.subtitle': 'प्रमाणीकरण, फायरबेस सिंक, डेटा मास्किंग आणि सुरक्षित लॉगआउटचे व्हिडिओ सादरीकरण.',
    'video.step1': '०१. प्रमाणीकरण',
    'video.step2': '०२. दस्तऐवज अपलोड',
    'video.step3': '०३. बायोमेट्रिक मॅच',
    'video.step4': '०४. डिजिटल प्रमाणपत्र',
    'video.step5': '०५. सुरक्षित लॉग आउट',
    'video.play': 'व्हिडिओ चालवा',
    'video.pause': 'व्हिडिओ थांबवा',
    'video.restart': 'पुन्हा सुरू करा',
    'video.speed': 'गती'
  },
  TA: {
    'gov.title': 'PramaanID Hackathon Prototype',
    'gov.dept': 'AI Identity Trust Lab',
    'nav.verify': 'ஆவண சரிபார்ப்பு',
    'nav.officer': 'ஆய்வு வரிசை',
    'nav.admin': 'நிர்வாக போர்டல்',
    'nav.audit': 'தணிக்கை பதிவு',
    'nav.security': 'பாதுகாப்பு & தனியுரிமை',
    'nav.login': 'போர்டல் உள்நுழைவு',
    'nav.logout': 'வெளியேறு',
    'nav.myAccount': 'எனது கணக்கு',
    'nav.activePersona': 'தற்போதைய பங்கு',
    'enclave.active': 'AES-256 அரசுப் பாதுகாப்பு செயல்படுகிறது',
    'firebase.connected': 'ஃபயர்பேஸ் கிளவுட் இணைக்கப்பட்டது (pramaanid)',

    'hero.badge': 'இறைமை AI இயங்குகிறது',
    'hero.standards': 'UIDAI & NSDL தரநிலைகள்',
    'hero.title': 'தேசிய அடையாள நுண்ணறிவு & ஆவண தடயவியல்',
    'hero.subtitle': 'ஜெமினி விஷன் OCR மற்றும் மோசடி கண்டறிதல் மூலம் இயக்கப்படும் தேசிய சரிபார்ப்பு தளம்.',
    'hero.encryption': 'குறியாக்கம்',
    'hero.privacy': 'தனியுரிமை பாதுகாப்பு',
    'hero.integrity': 'முத்திரை பாதுகாப்பு',
    'hero.retention': 'தரவு தக்கவைப்பு',

    'doc.step1': '1. ஆவணத்தை தேர்ந்தெடுக்கவும்',
    'doc.select': 'ஆதரிக்கப்படும் ஆவணங்கள்',
    'doc.aadhaar': 'ஆதார் ஸ்மார்ட் கார்டு',
    'doc.pan': 'பான் கார்டு',
    'doc.passport': 'இந்திய பாஸ்போர்ட்',
    'doc.voter': 'வாக்காளர் அட்டை',
    'doc.quickTest': 'மாதிரி அட்டைகள்',
    'doc.quickTestSub': '1-கிளிக் சோதனை',
    'doc.upload': 'ஆவணத்தை பதிவேற்றவும்',
    'doc.uploadDesc': 'JPEG, PNG, WEBP, PDF 5MB வரை',
    'doc.maskPII': 'பாதுகாப்பான மறைத்தல்',
    'doc.maskPIIDesc': 'ஆதார் முதல் 8 இலக்கங்களை மறைக்கவும் (XXXX-XXXX-9021)',
    'doc.analyzeBtn': 'AI சரிபார்ப்பை துவங்கு',
    'doc.analyzing': 'சரிபார்க்கிறது...',

    'replica.title': 'நேரடி ஆவண நகல்',
    'replica.showSpectrogram': 'ஸ்பெக்ட்ரோகிராம் காண்க',
    'replica.hideSpectrogram': 'ஸ்பெக்ட்ரோகிராம் மூடு',
    'forensic.title': 'AI தடயவியல் ஆய்வு',
    'forensic.risk': 'ஆபத்து நிலை',
    'forensic.font': 'எழுத்துரு சீரமைப்பு',
    'forensic.hologram': 'ஹாலோகிராம்',
    'forensic.photo': 'புகைப்பட ஆய்வு',
    'forensic.examiner': 'பரிசோதகர் முடிவு',

    'bio.title': 'முக சரிபார்ப்பு',
    'bio.subtitle': 'நேரடி கேமரா மற்றும் 3D முக அமைப்பு சரிபார்ப்பு',
    'bio.startCam': 'கேமரா இயக்கு',
    'bio.retakeCam': 'மீண்டும் படம் எடு',
    'bio.loadSample': 'மாதிரி படம் ஏற்று',
    'bio.capture': 'படம் எடு',
    'bio.runMatch': 'ஒப்பீடு செய்',
    'bio.matching': 'ஒப்பிடுகிறது...',
    'bio.confidence': 'நம்பகத்தன்மை',
    'bio.liveness': 'நேரடி சோதனை',

    'cert.badge': 'பிரமாண் பத்திரம் · டிஜிட்டல் சான்றிதழ்',
    'cert.title': 'சரிபார்க்கக்கூடிய தேசிய அடையாள ரசீது',
    'cert.seal': 'SHA-256 டிஜிட்டல் முத்திரை',
    'cert.issuer': 'வழங்குபவர்',
    'cert.issuerVal': 'PramaanID Hackathon Prototype (MeitY)',
    'cert.download': 'சான்றிதழைப் பதிவிறக்கு',

    'auth.title': 'போர்டல் உள்நுழைவு',
    'auth.subtitle': 'உங்கள் மின்னஞ்சல் அல்லது ஃபயர்பேஸ் கணக்கு மூலம் உள்நுழைக.',
    'auth.email': 'மின்னஞ்சல் முகவரி',
    'auth.password': 'கடவுச்சொல்',
    'auth.signInBtn': 'உள்நுழைக',
    'auth.registerBtn': 'புதிய பதிவு',
    'auth.firebaseGoogle': 'ஃபயர்பேஸ் கூகிள் உள்நுழைவு',
    'auth.quickFill': 'பரிசோதனை பாத்திரங்கள்:',
    'auth.citizenRole': 'குடிமகன்',
    'auth.verifierRole': 'சரிபார்ப்பாளர்',
    'auth.officerRole': 'அதிகாரி',
    'auth.adminRole': 'நிர்வாகி',
    'auth.superAdminRole': 'தலைமை பாதுகாப்பு அதிகாரி',
    'auth.logoutConfirm': 'நீங்கள் நிச்சயமாக வெளியேற விரும்புகிறீர்களா?',
    'auth.logoutBtn': 'வெளியேறுவதை உறுதிசெய்',
    'auth.loggedOutTitle': 'வெற்றிகரமாக வெளியேறிவிட்டீர்கள்',
    'auth.loggedOutDesc': 'பாதுகாப்பாக அமர்வு முடிக்கப்பட்டது.',
    'auth.signInAgain': 'மீண்டும் உள்நுழைக',

    'video.title': 'மக்கள் எவ்வாறு உள்நுழைந்து சரிபார்த்து வெளியேறுகிறார்கள் — வீடியோ வழிகாட்டி',
    'video.subtitle': 'உள்நுழைவு, ஃபயர்பேஸ், ஆவண மறைத்தல் மற்றும் வெளியேறுதல் செய்முறை விளக்கம்.',
    'video.step1': '01. உள்நுழைவு',
    'video.step2': '02. ஆவண பதிவேற்றம்',
    'video.step3': '03. முக சரிபார்ப்பு',
    'video.step4': '04. டிஜிட்டல் சான்றிதழ்',
    'video.step5': '05. பாதுகாப்பான வெளியேறுதல்',
    'video.play': 'இயக்கு',
    'video.pause': 'நிறுத்து',
    'video.restart': 'மீண்டும் தொடங்கு',
    'video.speed': 'வேகம்'
  },
  BN: {
    'gov.title': 'PramaanID Hackathon Prototype',
    'gov.dept': 'AI Identity Trust Lab (MeitY)',
    'nav.verify': 'নথি যাচাই',
    'nav.officer': 'পরিদর্শন সারি',
    'nav.admin': 'প্রশাসন পোর্টাল',
    'nav.audit': 'অডিট ট্রেইল',
    'nav.security': 'নিরাপত্তা ও গোপনীয়তা',
    'nav.login': 'পোর্টাল লগইন',
    'nav.logout': 'লগ আউট',
    'nav.myAccount': 'আমার অ্যাকাউন্ট',
    'nav.activePersona': 'বর্তমান ভূমিকা',
    'enclave.active': 'AES-256 রাষ্ট্রীয় এনক্লেভ সক্রিয়',
    'firebase.connected': 'ফায়ারবেস ক্লাউড সংযুক্ত (pramaanid)',

    'hero.badge': 'রাষ্ট্রীয় এআই সক্রিয়',
    'hero.standards': 'UIDAI ও NSDL মানসম্মত',
    'hero.title': 'জাতীয় পরিচয় বুদ্ধিমত্তা ও নথি ফরেনসিক',
    'hero.subtitle': 'জেমিনি ভিশন ওসিআর এবং জালিয়াতি শনাক্তকরণ দ্বারা পরিচালিত জাতীয় যাচাইকরণ ব্যবস্থা।',
    'hero.encryption': 'সংরক্ষিত এনক্রিপশন',
    'hero.privacy': 'গোপনীয়তা রক্ষা',
    'hero.integrity': 'অখণ্ডতা সীল',
    'hero.retention': 'ডেটা সংরক্ষণ',

    'doc.step1': '১. নথি এবং প্রমাণ নির্বাচন করুন',
    'doc.select': 'সমর্থিত জাতীয় নথি',
    'doc.aadhaar': 'আধার স্মার্ট কার্ড',
    'doc.pan': 'প্যান কার্ড',
    'doc.passport': 'ভারতীয় পাসপোর্ট',
    'doc.voter': 'ভোটার আইডি',
    'doc.quickTest': 'নমুনা কার্ড',
    'doc.quickTestSub': '১-ক্লিক পরীক্ষা',
    'doc.upload': 'আপনার অফিসিয়াল নথি বা পিডিএফ আপলোড করুন',
    'doc.uploadDesc': 'JPEG, PNG, WEBP, PDF ৫ মেগাবাইট পর্যন্ত',
    'doc.maskPII': 'তথ্য মাস্কিং',
    'doc.maskPIIDesc': 'আধারের প্রথম ৮টি সংখ্যা লুকান (XXXX-XXXX-9021)',
    'doc.analyzeBtn': 'এআই ফরেনসিক পরীক্ষা চালান',
    'doc.analyzing': 'বিশ্লেষণ চলছে...',

    'replica.title': 'লাইভ নথি প্রতিকৃতি',
    'replica.showSpectrogram': 'স্পেকট্রোগ্রাম দেখুন',
    'replica.hideSpectrogram': 'স্পেকট্রোগ্রাম বন্ধ করুন',
    'forensic.title': 'এআই ফরেনসিক বিশ্লেষণ',
    'forensic.risk': 'ঝুঁকির মাত্রা',
    'forensic.font': 'ফন্ট বিন্যাস',
    'forensic.hologram': 'হলোগ্রাম',
    'forensic.photo': 'ছবি বিশ্লেষণ',
    'forensic.examiner': 'পরীক্ষকের মতামত',

    'bio.title': 'বায়োমেট্রিক মুখমণ্ডল যাচাই',
    'bio.subtitle': 'লাইভ ক্যামেরা অ্যান্টি-স্পুফিং এবং ৩ডি ফেসিয়াল ল্যান্ডমার্ক মিল',
    'bio.startCam': 'ক্যামেরা চালু করুন',
    'bio.retakeCam': 'আবার সেলফি তুলুন',
    'bio.loadSample': 'নমুনা ছবি লোড করুন',
    'bio.capture': 'ছবি তুলুন',
    'bio.runMatch': 'বায়োমেট্রিক মিলান',
    'bio.matching': 'তুলনা করা হচ্ছে...',
    'bio.confidence': 'নির্ভরযোগ্যতা স্কোর',
    'bio.liveness': 'সজীবতা পরীক্ষা',

    'cert.badge': 'প্রমাণ পত্র · ডিজিটাল পরিচয় সনদ',
    'cert.title': 'যাচাইযোগ্য পরিচয়পত্র প্রাপ্তি',
    'cert.seal': 'SHA-256 ডিজিটাল সীল',
    'cert.issuer': 'ইস্যুকারী',
    'cert.issuerVal': 'PramaanID Hackathon Prototype (MeitY)',
    'cert.download': 'সনদ ডাউনলোড করুন',

    'auth.title': 'পোর্টাল প্রমাণীকরণ',
    'auth.subtitle': 'আপনার নিবন্ধিত ইমেল বা ফায়ারবেস ক্লাউড অ্যাকাউন্ট দিয়ে সাইন ইন করুন।',
    'auth.email': 'নিবন্ধিত ইমেল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.signInBtn': 'সাইন ইন করুন',
    'auth.registerBtn': 'নতুন নাগরিক নিবন্ধন',
    'auth.firebaseGoogle': 'ফায়ারবেস গুগল সাইন ইন',
    'auth.quickFill': 'মূল্যায়ন ভূমিকা নির্বাচন:',
    'auth.citizenRole': 'নাগরিক আবেদনকারী',
    'auth.verifierRole': 'পরিচয় যাচাইকারী',
    'auth.officerRole': 'গেজেটেড অফিসার',
    'auth.adminRole': 'সিস্টেম প্রশাসক',
    'auth.superAdminRole': 'প্রধান নিরাপত্তা কর্মকর্তা',
    'auth.logoutConfirm': 'আপনি কি সত্যিই লগ আউট করতে চান?',
    'auth.logoutBtn': 'লগ আউট নিশ্চিত করুন',
    'auth.loggedOutTitle': 'আপনি নিরাপদে লগ আউট হয়েছেন',
    'auth.loggedOutDesc': 'সার্ভার সেশন বাতিল করা হয়েছে।',
    'auth.signInAgain': 'আবার সাইন ইন করুন',

    'video.title': 'মানুষ কীভাবে লগইন, যাচাই এবং লগআউট করে — ভিডিও গাইড',
    'video.subtitle': 'লগইন, ফায়ারবেস ক্লাউড, নথি মাস্কিং এবং লগআউটের ধাপে ধাপে ভিডিও ডেমো।',
    'video.step1': '০১. প্রমাণীকরণ',
    'video.step2': '০২. নথি আপলোড',
    'video.step3': '০৩. বায়োমেট্রিক মিল',
    'video.step4': '০৪. ডিজিটাল সনদ',
    'video.step5': '০৫. নিরাপদ লগ আউট',
    'video.play': 'ভিডিও চালান',
    'video.pause': 'ভিডিও থামান',
    'video.restart': 'আবার শুরু করুন',
    'video.speed': 'গতি'
  },
  GU: {
    'gov.title': 'PramaanID Hackathon Prototype',
    'gov.dept': 'AI Identity Trust Lab (MeitY)',
    'nav.verify': 'દસ્તાવેજ ચકાસણી',
    'nav.officer': 'તપાસ કતાર',
    'nav.admin': 'વહીવટ પોર્ટલ',
    'nav.audit': 'ઓડિટ ટ્રેઇલ',
    'nav.security': 'સુરક્ષા અને ગોપનીયતા',
    'nav.login': 'પોર્ટલ લૉગિન',
    'nav.logout': 'લૉગ આઉટ',
    'nav.myAccount': 'મારું એકાઉન્ટ',
    'nav.activePersona': 'સક્રિય ભૂમિકા',
    'enclave.active': 'AES-256 સુરક્ષિત એન્ક્લેવ સક્રિય',
    'firebase.connected': 'ફાયરબેઝ ક્લાઉડ કનેક્ટેડ (pramaanid)',

    'hero.badge': 'સાર્વભૌમ એઆઈ સક્રિય',
    'hero.standards': 'UIDAI અને NSDL ધોરણો સુસંગત',
    'hero.title': 'સાર્વભૌમ ઓળખ બુદ્ધિ અને દસ્તાવેજ ફોરેન્સિક્સ',
    'hero.subtitle': 'જેમિની વિઝન OCR અને છેડછાડ ફોરેન્સિક્સ દ્વારા સંચાલિત રાષ્ટ્રીય ચકાસણી પ્લેટફોર્મ.',
    'hero.encryption': 'એન્ક્રિપ્શન',
    'hero.privacy': 'ગોપનીયતા સુરક્ષા',
    'hero.integrity': 'અખંડિતતા સીલ',
    'hero.retention': 'ડેટા જાળવણી',

    'doc.step1': '૧. દસ્તાવેજ પસંદ કરો',
    'doc.select': 'સમર્થિત દસ્તાવેજો',
    'doc.aadhaar': 'આધાર સ્માર્ટ કાર્ડ',
    'doc.pan': 'પાન કાર્ડ',
    'doc.passport': 'ભારતીય પાસપોર્ટ',
    'doc.voter': 'ચૂંટણી કાર્ડ',
    'doc.quickTest': 'નમૂના કાર્ડ',
    'doc.quickTestSub': '૧-ક્લિક પરીક્ષણ',
    'doc.upload': 'દસ્તાવેજ અપલોડ કરો',
    'doc.uploadDesc': 'JPEG, PNG, WEBP, PDF 5MB સુધી',
    'doc.maskPII': 'માહિતી માસ્કિંગ',
    'doc.maskPIIDesc': 'આધારના પ્રથમ ૮ અંક છુપાવો (XXXX-XXXX-9021)',
    'doc.analyzeBtn': 'AI ચકાસણી શરૂ કરો',
    'doc.analyzing': 'ચકાસણી ચાલુ છે...',

    'replica.title': 'લાઇવ દસ્તાવેજ પ્રતિકૃતિ',
    'replica.showSpectrogram': 'સ્પેક્ટ્રોગ્રામ જુઓ',
    'replica.hideSpectrogram': 'સ્પેક્ટ્રોગ્રામ બંધ કરો',
    'forensic.title': 'AI ફોરેન્સિક વિશ્લેષણ',
    'forensic.risk': 'જોખમ સ્તર',
    'forensic.font': 'ફોન્ટ સંરેખણ',
    'forensic.hologram': 'હોલોગ્રામ',
    'forensic.photo': 'ફોટો વિશ્લેષણ',
    'forensic.examiner': 'પરીક્ષક વિશ્લેષણ',

    'bio.title': 'બાયોમેટ્રિક ફેસ ચકાસણી',
    'bio.subtitle': 'લાઇવ કેમેરા એન્ટિ-સ્પૂફિંગ અને ૩ડી ચહેરાની સરખામણી',
    'bio.startCam': 'કેમેરો ચાલુ કરો',
    'bio.retakeCam': 'ફરીથી સેલ્ફી લો',
    'bio.loadSample': 'સેલ્ફી લોડ કરો',
    'bio.capture': 'ફોટો લો',
    'bio.runMatch': 'મેચ કરો',
    'bio.matching': 'સરખામણી ચાલુ છે...',
    'bio.confidence': 'વિશ્વાસ સ્કોર',
    'bio.liveness': 'જીવંતતા ચકાસણી',

    'cert.badge': 'પ્રમાણ પત્ર · ડિજિટલ ઓળખ પ્રમાણપત્ર',
    'cert.title': 'ચકાસાયેલ ઓળખ રસીદ',
    'cert.seal': 'SHA-256 ડિજિટલ સીલ',
    'cert.issuer': 'જારીકર્તા',
    'cert.issuerVal': 'PramaanID Hackathon Prototype (MeitY)',
    'cert.download': 'પ્રમાણપત્ર ડાઉનલોડ કરો',

    'auth.title': 'પોર્ટલ પ્રમાણીકરણ',
    'auth.subtitle': 'તમારા ઇમેઇલ અથવા ફાયરબેઝ ક્લાઉડ એકાઉન્ટથી લૉગિન કરો.',
    'auth.email': 'ઇમેઇલ એડ્રેસ',
    'auth.password': 'પાસવર્ડ',
    'auth.signInBtn': 'લૉગિન કરો',
    'auth.registerBtn': 'નવી નાગરિક નોંધણી',
    'auth.firebaseGoogle': 'ફાયરબેઝ ગુગલ લૉગિન',
    'auth.quickFill': 'મૂલ્યાંકન ભૂમિકાઓ:',
    'auth.citizenRole': 'નાગરિક અરજદાર',
    'auth.verifierRole': 'ચકાસણીકર્તા',
    'auth.officerRole': 'ગેઝેટેડ ઓફિસર',
    'auth.adminRole': 'સિસ્ટમ એડમિનિસ્ટ્રેટર',
    'auth.superAdminRole': 'મુખ્ય સુરક્ષા અધિકારી',
    'auth.logoutConfirm': 'શું તમે ખરેખર લૉગ આઉટ કરવા માંગો છો?',
    'auth.logoutBtn': 'લૉગ આઉટની પુષ્ટિ કરો',
    'auth.loggedOutTitle': 'તમે સુરક્ષિત રીતે લૉગ આઉટ થયા છો',
    'auth.loggedOutDesc': 'સર્વર સત્ર સમાપ્ત કરવામાં આવ્યું છે.',
    'auth.signInAgain': 'ફરી લૉગિન કરો',

    'video.title': 'લોકો કેવી રીતે લૉગિન, ચકાસણી અને લૉગઆઉટ કરે છે — વિડીયો માર્ગદર્શિકા',
    'video.subtitle': 'લૉગિન, ફાયરબેઝ ક્લાઉડ, દસ્તાવેજ માસ્કિંગ અને લૉગઆઉટનું વિડીયો નિદર્શન.',
    'video.step1': '૦૧. પ્રમાણીકરણ',
    'video.step2': '૦૨. દસ્તાવેજ અપલોડ',
    'video.step3': '૦૩. બાયોમેટ્રિક મેચ',
    'video.step4': '૦૪. ડિજિટલ પ્રમાણપત્ર',
    'video.step5': '૦૫. સુરક્ષિત લૉગ આઉટ',
    'video.play': 'વિડીયો ચલાવો',
    'video.pause': 'વિડીયો થોભાવો',
    'video.restart': 'ફરી શરૂ કરો',
    'video.speed': 'ઝડપ'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pramaan_portal_lang') as Language;
      if (saved && ['EN', 'HI', 'MR', 'TA', 'BN', 'GU'].includes(saved)) {
        return saved;
      }
    } catch {
      // localStorage may fail in sandboxes
    }
    return 'EN';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('pramaan_portal_lang', newLang);
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    const langDict = DICTIONARY[lang] || DICTIONARY['EN'];
    return langDict[key] || DICTIONARY['EN'][key] || key;
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: SUPPORTED_LANGUAGES, currentLangInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
