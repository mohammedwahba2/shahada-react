import type { ShahadaStep } from "../types";

// Shahada steps used for speech matching flow
export const shahadaSteps: ShahadaStep[] = [
  {
    id: 1,
    arabic: "أَشْهَدُ أَن لَّا إِلَٰهَ",
    phonetic: "Ashhadu an la ilaha",
    promptLine: "Ashhadu an lā ilāha",
    keywords: ["ashhadu", "ashhadu an", "la ilaha", "لا اله"],
  },
  {
    id: 2,
    arabic: "إِلَّا ٱللَّٰهُ",
    phonetic: "Illa llahu",
    promptLine: "illā Allāh",
    keywords: [
      "illallah",
      "illa allah",
      "il allah", 
      "ilallah",
      "الا الله",
      "الاالله",
      "إلا الله",
      "لا الا الله",   
      "لا إلا الله",   
      "الا لا الا",     
      "لاالاالله",     
    ],
    compactHints: [
      "الله الله",
      "الا الله",
      "إلا الله",
      "لاالاالله",    
      "الالاالاالله",   
    ],
  },
  {
    id: 3,
    arabic: "وَأَشْهَدُ",
    phonetic: "Wa-ashhadu",
    promptLine: "wa-'ashhadu",
    keywords: ["wa ashhadu", "washhadu", "واشهد"],
  },
  {
    id: 4,
    arabic: "أَنَّ مُحَمَّدًا",
    phonetic: "anna Muhammadan",
    promptLine: "'anna Muḥammadan",
    keywords: ["muhammad", "muhammadan", "محمد"],
  },
  {
    id: 5,
    arabic: "رَسُولُ ٱللَّٰهِ",
    phonetic: "Rasūlu llah",
    promptLine: "Rasūlu 'llāh",
    keywords: ["rasul", "rasulullah", "رسول الله"],
  },
];