import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'my';

interface Translations {
  [key: string]: {
    en: string;
    my: string;
  };
}

const translations: Translations = {
  // Login page
  'login.title': { en: 'Adcreative Myanmar AI', my: 'Adcreative မြန်မာ AI' },
  'login.subtitle': { en: 'AI-powered ad content generator', my: 'AI ဖြင့် ကြော်ငြာ အကြောင်းအရာ ဖန်တီးသူ' },
  'login.accessKey': { en: 'Access Key', my: 'Access Key' },
  'login.accessKeyPlaceholder': { en: 'Enter your access key', my: 'သင့် access key ထည့်ပါ' },
  'login.login': { en: 'Login', my: 'ဝင်ရောက်ရန်' },
  'login.orUseGemini': { en: 'Or start with your own Gemini API Key', my: 'သို့မဟုတ် သင့်ကိုယ်ပိုင် Gemini API Key ဖြင့် စတင်ပါ' },
  'login.geminiApiKey': { en: 'Gemini API Key', my: 'Gemini API Key' },
  'login.geminiPlaceholder': { en: 'Enter your Gemini API key', my: 'သင့် Gemini API key ထည့်ပါ' },
  'login.startWithGemini': { en: 'Start with Gemini', my: 'Gemini ဖြင့် စတင်ပါ' },
  'login.adminAccess': { en: 'Admin Access', my: 'Admin ဝင်ရောက်ရန်' },
  'login.invalidKey': { en: 'Invalid access key', my: 'မမှန်ကန်သော access key' },
  
  // Header
  'header.archives': { en: 'Archives', my: 'မှတ်တမ်းများ' },
  'header.logout': { en: 'Logout', my: 'ထွက်ရန်' },
  'header.theme': { en: 'Theme', my: 'အပြင်အဆင်' },
  'header.language': { en: 'Language', my: 'ဘာသာစကား' },
  
  // Generator
  'generator.title': { en: 'AI Ad Content Generator', my: 'AI ကြော်ငြာ အကြောင်းအရာ ဖန်တီးသူ' },
  'generator.topic': { en: 'Topic / Product Name', my: 'ခေါင်းစဉ် / ထုတ်ကုန်အမည်' },
  'generator.topicPlaceholder': { en: 'e.g., Organic Skincare Set', my: 'ဥပမာ - သဘာဝ အသားအရေ ထိန်းသိမ်းမှု အစုံ' },
  'generator.keywords': { en: 'Keywords', my: 'အဓိကစကားလုံးများ' },
  'generator.keywordsPlaceholder': { en: 'e.g., natural, glowing, hydrating', my: 'ဥပမာ - သဘာဝ၊ တောက်ပသော၊ အစိုဓာတ်' },
  'generator.context': { en: 'Additional Context', my: 'နောက်ထပ် အချက်အလက်' },
  'generator.contextPlaceholder': { en: 'Any specific details about the product or campaign...', my: 'ထုတ်ကုန် သို့မဟုတ် ကမ်ပိန်း အကြောင်း အသေးစိတ်...' },
  'generator.contentLength': { en: 'Content Length', my: 'အကြောင်းအရာ အရှည်' },
  'generator.short': { en: 'Short', my: 'တို' },
  'generator.medium': { en: 'Medium', my: 'အလယ်' },
  'generator.long': { en: 'Long', my: 'ရှည်' },
  'generator.visualRef': { en: 'Visual Reference (Optional)', my: 'ပုံရည်ညွှန်း (ရွေးချယ်နိုင်)' },
  'generator.uploadImage': { en: 'Upload Image', my: 'ပုံ တင်ရန်' },
  'generator.selectTone': { en: 'Select Tone', my: 'လေသံ ရွေးပါ' },
  'generator.generate': { en: 'Generate Content', my: 'အကြောင်းအရာ ဖန်တီးရန်' },
  'generator.generating': { en: 'Generating...', my: 'ဖန်တီးနေသည်...' },
  'generator.result': { en: 'Generated Content', my: 'ဖန်တီးထားသော အကြောင်းအရာ' },
  'generator.copy': { en: 'Copy', my: 'ကူးယူရန်' },
  'generator.copied': { en: 'Copied!', my: 'ကူးယူပြီး!' },
  'generator.save': { en: 'Save to Archives', my: 'မှတ်တမ်းတွင် သိမ်းရန်' },
  'generator.saved': { en: 'Saved!', my: 'သိမ်းပြီး!' },
  'generator.generateNew': { en: 'Generate New', my: 'အသစ်ဖန်တီးရန်' },
  
  // Tones
  'tone.friendly': { en: 'Friendly', my: 'ဖော်ရွေ' },
  'tone.friendlyDesc': { en: 'Casual, emojis, warm', my: 'ပေါ့ပေါ့ပါးပါး၊ emoji၊ နွေးထွေး' },
  'tone.informative': { en: 'Informative', my: 'အချက်အလက်' },
  'tone.informativeDesc': { en: 'Clear, factual, educational', my: 'ရှင်းလင်း၊ အချက်အလက်၊ ပညာပေး' },
  'tone.persuasive': { en: 'Persuasive', my: 'ဆွဲဆောင်' },
  'tone.persuasiveDesc': { en: 'Sales-oriented, CTA', my: 'အရောင်း၊ လုပ်ဆောင်မှုတောင်းဆို' },
  'tone.technical': { en: 'Technical', my: 'နည်းပညာ' },
  'tone.technicalDesc': { en: 'Professional, detailed', my: 'ပရော်ဖက်ရှင်နယ်၊ အသေးစိတ်' },
  'tone.storytelling': { en: 'Storytelling', my: 'ပုံပြင်' },
  'tone.storytellingDesc': { en: 'Narrative, engaging', my: 'ဇာတ်လမ်း၊ စိတ်ဝင်စား' },
  'tone.descriptive': { en: 'Descriptive', my: 'ဖော်ပြချက်' },
  'tone.descriptiveDesc': { en: 'Poetic, detailed', my: 'ကဗျာဆန်၊ အသေးစိတ်' },
  
  // Archives
  'archives.title': { en: 'Archives', my: 'မှတ်တမ်းများ' },
  'archives.empty': { en: 'No saved generations yet', my: 'သိမ်းထားသော ဖန်တီးမှုများ မရှိသေးပါ' },
  'archives.restore': { en: 'Restore', my: 'ပြန်လည်အသုံးပြုရန်' },
  'archives.delete': { en: 'Delete', my: 'ဖျက်ရန်' },
  'archives.back': { en: 'Back to Generator', my: 'Generator သို့ ပြန်သွားရန်' },
  
  // Admin
  'admin.title': { en: 'Admin Dashboard', my: 'Admin Dashboard' },
  'admin.password': { en: 'Admin Password', my: 'Admin စကားဝှက်' },
  'admin.passwordPlaceholder': { en: 'Enter admin password', my: 'Admin စကားဝှက် ထည့်ပါ' },
  'admin.enter': { en: 'Enter', my: 'ဝင်ရောက်ရန်' },
  'admin.users': { en: 'Users', my: 'အသုံးပြုသူများ' },
  'admin.systemKeys': { en: 'System Keys', my: 'System Keys' },
  'admin.userGeminiKeys': { en: 'User Keys', my: 'အသုံးပြုသူ Keys' },
  'admin.settings': { en: 'Settings', my: 'ဆက်တင်များ' },
  'admin.addUser': { en: 'Add User', my: 'အသုံးပြုသူ ထည့်ရန်' },
  'admin.userLabel': { en: 'User Label', my: 'အသုံးပြုသူ အမည်' },
  'admin.userLabelPlaceholder': { en: 'e.g., Client ABC', my: 'ဥပမာ - Client ABC' },
  'admin.geminiKey': { en: 'Gemini API Key (Optional)', my: 'Gemini API Key (ရွေးချယ်နိုင်)' },
  'admin.create': { en: 'Create', my: 'ဖန်တီးရန်' },
  'admin.copyKey': { en: 'Copy Key', my: 'Key ကူးယူရန်' },
  'admin.deleteUser': { en: 'Delete', my: 'ဖျက်ရန်' },
  'admin.addSystemKey': { en: 'Add System Key', my: 'System Key ထည့်ရန်' },
  'admin.keyLabel': { en: 'Key Label', my: 'Key အမည်' },
  'admin.apiKey': { en: 'API Key', my: 'API Key' },
  'admin.changePassword': { en: 'Change Admin Password', my: 'Admin စကားဝှက် ပြောင်းရန်' },
  'admin.newPassword': { en: 'New Password', my: 'စကားဝှက် အသစ်' },
  'admin.proxyUrl': { en: 'Proxy Base URL', my: 'Proxy Base URL' },
  'admin.back': { en: 'Back to Login', my: 'Login သို့ ပြန်သွားရန်' },
  'admin.logout': { en: 'Logout', my: 'ထွက်ရန်' },
  'admin.addToSystemKeys': { en: 'Add to System', my: 'System သို့ ထည့်ရန်' },
  'admin.noUserKeys': { en: 'No user Gemini keys yet', my: 'အသုံးပြုသူ Gemini keys မရှိသေးပါ' },
  'admin.lastUsed': { en: 'Last used', my: 'နောက်ဆုံး အသုံးပြု' },
  'admin.freeDailyLimit': { en: 'Free Tier Daily Limit', my: 'အခမဲ့ နေ့စဉ် ကန့်သတ်' },
  'admin.freeDailyLimitDesc': { en: 'Max generations per day for free users (default: 5)', my: 'အခမဲ့ အသုံးပြုသူများအတွက် တစ်နေ့လျှင် အများဆုံး ဖန်တီးမှု' },
  'admin.premiumDailyLimit': { en: 'Premium Tier Daily Limit', my: 'ပရီမီယံ နေ့စဉ် ကန့်သတ်' },
  'admin.premiumDailyLimitDesc': { en: 'Max generations per day for premium users (default: 100)', my: 'ပရီမီယံ အသုံးပြုသူများအတွက် တစ်နေ့လျှင် အများဆုံး ဖန်တီးမှု' },
  'admin.tierFree': { en: 'Free', my: 'အခမဲ့' },
  'admin.tierPremium': { en: 'Premium', my: 'ပရီမီယံ' },
  'admin.setAsPremium': { en: 'Set Premium', my: 'ပရီမီယံ သတ်မှတ်' },
  'admin.setAsFree': { en: 'Set Free', my: 'အခမဲ့ သတ်မှတ်' },
  'admin.rateLimited': { en: 'Daily limit reached', my: 'နေ့စဉ် ကန့်သတ်ချက် ပြည့်သွားပါပြီ' },
  
  // Common
  'common.loading': { en: 'Loading...', my: 'ခဏစောင့်ပါ...' },
  'common.error': { en: 'An error occurred', my: 'အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်' },
  'common.success': { en: 'Success!', my: 'အောင်မြင်ပါသည်!' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('adcreative-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('adcreative-language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
