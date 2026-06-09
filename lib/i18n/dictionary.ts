/**
 * i18n scaffold (Stage C). English is complete; Hindi demonstrates the wiring.
 * The other locales fall back to English until their catalogues are filled —
 * the locale switch and persistence work for all of them today.
 */

export const LOCALES = ["en", "hi", "ta", "te", "mr", "kn", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

/** Aligned 1:1 with LANGUAGES in lib/mock/ecosystem.ts (same order). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  mr: "मराठी (Marathi)",
  kn: "ಕನ್ನಡ (Kannada)",
  bn: "বাংলা (Bengali)",
};

type Dict = Record<string, string>;

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.savings": "Savings",
  "nav.executive": "Executive",
  "nav.bills": "Bills",
  "nav.payments": "Payments",
  "nav.collections": "Collections",
  "nav.accuracy": "Accuracy",
  "nav.buildings": "Buildings",
  "nav.tasks": "Tasks",
  "nav.alerts": "Alerts",
  "nav.analytics": "Analytics",
  "nav.roi": "ROI",
  "nav.approvals": "Approvals",
  "nav.compliance": "Compliance",
  "nav.carbon": "Carbon",
  "nav.efficiency": "Efficiency",
  "nav.markets": "Markets",
  "nav.assets": "Assets",
  "nav.marketplace": "Marketplace",
  "nav.training": "Training",
  "nav.rewards": "Rewards",
  "nav.settings": "Settings",
  "org.demo": "Demo Org",
};

const hi: Dict = {
  "nav.dashboard": "डैशबोर्ड",
  "nav.savings": "बचत",
  "nav.executive": "कार्यकारी",
  "nav.bills": "बिल",
  "nav.payments": "भुगतान",
  "nav.collections": "वसूली",
  "nav.accuracy": "सटीकता",
  "nav.buildings": "इमारतें",
  "nav.tasks": "कार्य",
  "nav.alerts": "अलर्ट",
  "nav.analytics": "विश्लेषण",
  "nav.roi": "आरओआई",
  "nav.approvals": "स्वीकृतियाँ",
  "nav.compliance": "अनुपालन",
  "nav.carbon": "कार्बन",
  "nav.efficiency": "दक्षता",
  "nav.markets": "बाज़ार",
  "nav.assets": "संपत्तियाँ",
  "nav.marketplace": "मार्केटप्लेस",
  "nav.training": "प्रशिक्षण",
  "nav.rewards": "पुरस्कार",
  "nav.settings": "सेटिंग्स",
  "org.demo": "डेमो संगठन",
};

const DICTS: Partial<Record<Locale, Dict>> = { en, hi };

/** Translate a key for a locale, falling back to English, then the key itself. */
export function translate(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? en[key] ?? key;
}
