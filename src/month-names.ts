import { LOCALES } from "./locales.js";

/**
 * Other ways people write each month, Baisakh first. Every locale's full and short names are
 * accepted too, so whatever NepaliDate#format prints can be read back.
 */
const OTHER_SPELLINGS: readonly (readonly string[])[] = [
  ["Baishakh", "Baisakha", "Vaisakh", "Vaishakh", "Vaisakha", "Vaishakha", "वैशाख"],
  ["Jeth", "Jeshtha", "Jesth", "Jyestha", "Jyeshtha", "जेष्ठ", "ज्येष्ठ"],
  ["Ashadh", "Asadh", "Ashad", "Asad", "Ashar", "Asaar", "Aasar", "Ashadha", "आषाढ", "असाढ"],
  ["Shravan", "Srawan", "Sravan", "Saun", "Sawan", "Shrawn", "श्रावण"],
  ["Bhadau", "Bhado", "Bhadaw", "Bhadrapad", "भाद्र", "भाद्रपद"],
  ["Ashwin", "Asoj", "Ashoj", "Aswina", "Ashwina", "आश्विन", "अश्विन"],
  ["Kartika", "Kattik", "कात्तिक"],
  ["Mansir", "Mangshir", "Marga", "Margashirsha", "मङ्सिर", "मार्ग", "मार्गशीर्ष"],
  ["Push", "Paush", "Pus", "Pous", "Pausha", "Pousha", "पौष"],
  ["Magha", "माघ"],
  ["Phalgun", "Fagun", "Phagun", "Falgoon", "फाल्गुन", "फाल्गुण"],
  ["Chait", "Chaita", "चैत्र"],
];

/** Trimmed, lowercase and in standard Unicode form (NFC), so case and encoding don't matter. */
const normalize = (name: string) => name.trim().normalize("NFC").toLowerCase();

/** Every accepted spelling, normalized, to its month number. */
const MONTH_BY_NAME: ReadonlyMap<string, number> = (() => {
  const byName = new Map<string, number>();
  for (let index = 0; index < 12; index++) {
    const spellings = [
      ...Object.values(LOCALES).flatMap((locale) => [
        locale.months[index],
        locale.monthsShort[index],
      ]),
      ...OTHER_SPELLINGS[index],
    ];
    for (const spelling of spellings) {
      const key = normalize(spelling);
      const existing = byName.get(key);
      // A spelling shared by two months would make parsing ambiguous, so refuse to load.
      if (existing !== undefined && existing !== index + 1) {
        throw new Error(`Month spelling ${JSON.stringify(spelling)} is used for two months`);
      }
      byName.set(key, index + 1);
    }
  }
  return byName;
})();

/**
 * The month number (1–12) for a month name in any common spelling, English or Nepali, ignoring
 * case: "Asoj", "Ashwin" and "असोज" all give 6. Returns undefined for anything else.
 */
export function monthFromName(name: string): number | undefined {
  return MONTH_BY_NAME.get(normalize(name));
}
