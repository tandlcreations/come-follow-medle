import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("scripture-data.js", "utf8").replace("const WEEKS =", "WEEKS =");
const context = {};
vm.runInNewContext(source, context);
const weeks = context.WEEKS;
const errors = [];
const ids = new Set();
for (const week of weeks) for (const chapter of week.chapters) {
  const id = `${chapter.book} ${chapter.ch}`;
  if (ids.has(id)) errors.push(`Duplicate ${id}`);
  ids.add(id);
  if (!chapter.bank.length) errors.push(`Empty bank: ${id}`);
  if (chapter.bank.some(w => !/^[A-Z]{5}$/.test(w))) errors.push(`Invalid bank word: ${id}`);
  if (new Set(chapter.bank).size !== chapter.bank.length) errors.push(`Duplicate bank word: ${id}`);
  if (!chapter.words.length || chapter.words.length > 5) errors.push(`Expected 1-5 answers: ${id}`);
  for (const answer of chapter.words) {
    if (!chapter.bank.includes(answer.word)) errors.push(`${id}: answer ${answer.word} missing from bank`);
    if (!answer.verseRef || !answer.verse || !answer.hint) errors.push(`${id}: incomplete ${answer.word}`);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Validated ${weeks.length} weeks, ${ids.size} chapters, and ${[...ids].length} unique chapter records.`);
