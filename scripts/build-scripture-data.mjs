import fs from "node:fs";

const source = fs.readFileSync("scripture-data.js", "utf8");
const existingWeeks = Function(`${source}\nreturn WEEKS;`)().slice(0, 2);

const books = {
  "2 Kings": ["2-kgs", 25], "2 Chronicles": ["2-chr", 36],
  Ezra: ["ezra", 10], Nehemiah: ["neh", 13], Esther: ["esth", 10], Job: ["job", 42],
  Psalms: ["ps", 150], Proverbs: ["prov", 31], Ecclesiastes: ["eccl", 12], Isaiah: ["isa", 66],
  Jeremiah: ["jer", 52], Lamentations: ["lam", 5], Ezekiel: ["ezek", 48], Daniel: ["dan", 12],
  Hosea: ["hosea", 14], Joel: ["joel", 3], Amos: ["amos", 9], Obadiah: ["obad", 1],
  Jonah: ["jonah", 4], Micah: ["micah", 7], Nahum: ["nahum", 3], Habakkuk: ["hab", 3],
  Zephaniah: ["zeph", 3], Haggai: ["hag", 2], Zechariah: ["zech", 14], Malachi: ["mal", 4],
};

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => i + start);
const all = (book) => range(1, books[book][1]);
const week = (label, readings) => ({ label, readings });
const remaining = [
  week("July 27–August 2 · Ezra 1; 3–7; Nehemiah 2; 4–6; 8", { Ezra: [1, ...range(3,7)], Nehemiah: [2, ...range(4,6), 8] }),
  week("August 3–9 · Esther", { Esther: all("Esther") }),
  week("August 10–16 · Job 1–3; 12–14; 19; 21–24; 38–40; 42", { Job: [...range(1,3), ...range(12,14), 19, ...range(21,24), ...range(38,40), 42] }),
  week("August 17–23 · Psalms 1–2; 8; 19–33; 40; 46", { Psalms: [1,2,8,...range(19,33),40,46] }),
  week("August 24–30 · Psalms 49–51; 61–66; 69–72; 77–78; 85–86", { Psalms: [...range(49,51),...range(61,66),...range(69,72),77,78,85,86] }),
  week("August 31–September 6 · Psalms 102–103; 110; 116–119; 127–128; 135–139; 146–150", { Psalms: [102,103,110,...range(116,119),127,128,...range(135,139),...range(146,150)] }),
  week("September 7–13 · Proverbs 1–4; 15–16; 22; 31; Ecclesiastes 1–3; 11–12", { Proverbs: [...range(1,4),15,16,22,31], Ecclesiastes: [...range(1,3),11,12] }),
  week("September 14–20 · Isaiah 1–12", { Isaiah: range(1,12) }),
  week("September 21–27 · Isaiah 13–14; 22; 24–30; 35", { Isaiah: [13,14,22,...range(24,30),35] }),
  week("September 28–October 4 · Isaiah 40–49", { Isaiah: range(40,49) }),
  week("October 5–11 · Isaiah 50–57", { Isaiah: range(50,57) }),
  week("October 12–18 · Isaiah 58–66", { Isaiah: range(58,66) }),
  week("October 19–25 · Jeremiah 1–3; 7; 16–18; 20", { Jeremiah: [1,2,3,7,16,17,18,20] }),
  week("October 26–November 1 · Jeremiah 31–33; 36–38; Lamentations 1; 3", { Jeremiah: [...range(31,33),...range(36,38)], Lamentations: [1,3] }),
  week("November 2–8 · Ezekiel 1–3; 33–34; 36–37; 47", { Ezekiel: [1,2,3,33,34,36,37,47] }),
  week("November 9–15 · Daniel 1–7", { Daniel: range(1,7) }),
  week("November 16–22 · Hosea 1–6; 10–14; Joel", { Hosea: [...range(1,6),...range(10,14)], Joel: all("Joel") }),
  week("November 23–29 · Amos; Obadiah; Jonah", { Amos: all("Amos"), Obadiah: all("Obadiah"), Jonah: all("Jonah") }),
  week("November 30–December 6 · Micah; Nahum; Habakkuk; Zephaniah", { Micah: all("Micah"), Nahum: all("Nahum"), Habakkuk: all("Habakkuk"), Zephaniah: all("Zephaniah") }),
  week("December 7–13 · Haggai 1–2; Zechariah 1–4; 7–14", { Haggai: all("Haggai"), Zechariah: [...range(1,4),...range(7,14)] }),
  week("December 14–20 · Malachi", { Malachi: all("Malachi") }),
];

const meaningful = [
  "FAITH","GRACE","MERCY","PEACE","TRUTH","LIGHT","GLORY","TRUST","HEART","SPIRIT","PRAYER","PRAISE",
  "BLESSED","BLESS","HOLY","CLEAN","RIGHT","JUSTICE","JUDGE","WISDOM","TEACH","LEARN","HEARKEN","WORDS",
  "SERVE","OFFER","GIVEN","GIVER","GIFTS","SAVED","SAVIOUR","REDEEM","HOPE","JOYFUL","REJOICE","SING",
  "STAND","STILL","STRENGTH","STRONG","POWER","COURAGE","BUILD","HOUSE","TEMPLE","ALTAR","COVENANT",
  "RETURN","RESTORE","HEALED","HEAL","WATER","BREAD","SHEPHERD","SHEEP","WATCH","AWAKE","ARISE","SEEK",
  "FOUND","CHOOSE","CHOSEN","OBEY","HUMBLE","MEEK","PURE","KIND","LOVED","LOVER","FRUIT","VINE",
  "ANGEL","VISION","DREAM","PROPHET","ANOINT","CROWN","EARTH","HEAVEN","ZION","ISRAEL","JUDAH","DAVID",
  "REPENT","FORGIVE","PARDON","SINCE","ANGER","WRATH","IDOLS","PRIDE","WICKED","EVIL","SWORD","FIRE",
];
const priority = new Map(meaningful.filter(w => w.length === 5).map((w, i) => [w, meaningful.length - i]));
const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
const decode = (text) => text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (_, e) => e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2),16) : parseInt(e.slice(1),10)) : (entities[e] ?? " "));
const strip = (html) => decode(html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
  .replace(/\s+([,.;:!?])/g, "$1");

async function fetchChapter(book, ch) {
  const slug = books[book][0];
  const url = `https://www.churchofjesuschrist.org/study/scriptures/ot/${slug}/${ch}?lang=eng`;
  const response = await fetch(url, {
    headers: { "user-agent": "ComeFollowMedleDataBuilder/1.0" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const html = await response.text();
  const verses = [...html.matchAll(/<p class="verse"[^>]*data-eng-ref="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)].map(m => ({ ref: m[1], text: strip(m[2]) }));
  if (!verses.length) throw new Error(`No verses extracted from ${url}`);
  const occurrences = new Map();
  for (const verse of verses) {
    for (const match of verse.text.matchAll(/\b[A-Za-z]{5}\b/g)) {
      const word = match[0].toUpperCase();
      if (!occurrences.has(word)) occurrences.set(word, verse);
    }
  }
  const bank = [...occurrences.keys()].sort();
  const candidates = bank.map(word => ({ word, verse: occurrences.get(word), score: priority.get(word) || 0 }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score || a.word.localeCompare(b.word));
  const fallback = bank.map(word => ({ word, verse: occurrences.get(word), score: 0 }))
    .filter(x => !candidates.some(c => c.word === x.word) && !["ABOUT","AFTER","AGAIN","AMONG","BEING","COULD","EVERY","FIRST","FORTH","OTHER","SHALL","THEIR","THERE","THESE","THING","THOSE","THREE","UNDER","UNTIL","WHERE","WHICH","WHILE","WHOLE","WHOSE","WOULD","YEARS"].includes(x.word));
  const picks = [...candidates, ...fallback].slice(0, 5);
  return {
    book, ch, url, bank,
    words: picks.map(({ word, verse }) => ({
      word,
      hint: `A meaningful word from ${book} ${verse.ref}`,
      verseRef: `${book} ${verse.ref}`,
      verse: verse.text.replace(/^\d+\s+/, ""),
    })),
  };
}

async function retryChapter(book, ch) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await fetchChapter(book, ch); }
    catch (error) {
      lastError = error;
      console.warn(`Retry ${attempt}/3 for ${book} ${ch}: ${error.message}`);
    }
  }
  throw lastError;
}

const initialTasks = existingWeeks.flatMap((item, weekIndex) => item.chapters
  .map(chapter => ({ weekIndex, book: chapter.book, ch: chapter.ch, original: chapter })));
const remainingTasks = remaining.flatMap((item, weekIndex) => Object.entries(item.readings)
  .flatMap(([book, chapterNumbers]) => chapterNumbers.map(ch => ({ weekIndex, book, ch }))));
const tasks = [...initialTasks, ...remainingTasks];
const results = [];
for (let offset = 0; offset < tasks.length; offset += 8) {
  const batch = tasks.slice(offset, offset + 8);
  const chapters = await Promise.all(batch.map(({ book, ch }) => retryChapter(book, ch)));
  results.push(...chapters);
  console.log(`Fetched ${results.length}/${tasks.length} chapters`);
}
const refreshedExisting = existingWeeks.map((item, weekIndex) => ({
  label: item.label,
  chapters: results.slice(0, initialTasks.length)
    .filter((_, resultIndex) => initialTasks[resultIndex].weekIndex === weekIndex)
    .map((chapter, chapterIndex) => ({
      ...chapter,
      words: item.chapters[chapterIndex].words,
    })),
}));
const remainingResults = results.slice(initialTasks.length);
const generated = remaining.map((item, weekIndex) => ({
  label: item.label,
  chapters: remainingResults.filter((_, resultIndex) => remainingTasks[resultIndex].weekIndex === weekIndex),
}));

const allWeeks = [
  ...refreshedExisting,
  ...generated,
];
const banner = `// Generated from verse text on ChurchofJesusChrist.org.\n// Rebuild with: node scripts/build-scripture-data.mjs\n`;
fs.writeFileSync("scripture-data.js", `${banner}const WEEKS = ${JSON.stringify(allWeeks, null, 2)};\n`);
console.log(`Wrote ${allWeeks.length} weeks and ${allWeeks.reduce((n,w) => n + w.chapters.length, 0)} chapters.`);
