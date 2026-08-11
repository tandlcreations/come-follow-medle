// Flatten into a single lookup list, each entry tagged with its week index
const CHAPTERS = [];
WEEKS.forEach((week, wi) => {
  week.chapters.forEach(c => CHAPTERS.push({ ...c, weekIndex: wi }));
});

const MAX_GUESSES = 6;
const WORD_LEN = 5;

let current = CHAPTERS[0];
let currentChapterIndex = 0;
let guesses = [];
let currentGuess = "";
let gameOver = false;
let keyStatus = {}; // letter -> best status
let currentWordIndex = 0;
const STORAGE_KEY = "come-follow-medle-progress-v1";
const completedWordsByChapter = {}; // stable chapter key -> completed word indexes

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const chapterSelect = document.getElementById("chapterSelect");
const scriptureLink = document.getElementById("scriptureLink");
const weekLabelEl = document.getElementById("weekLabel");
const roundStatusEl = document.getElementById("roundStatus");
const helpButton = document.getElementById("helpButton");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalAction = document.getElementById("modalAction");
let modalReturnFocus = null;

function populateChapterSelect(){
  chapterSelect.innerHTML = "";
  let flatIndex = 0;
  WEEKS.forEach((week) => {
    const group = document.createElement("optgroup");
    group.label = week.label;
    week.chapters.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = flatIndex;
      opt.textContent = `${c.book} ${c.ch}`;
      group.appendChild(opt);
      flatIndex++;
    });
    chapterSelect.appendChild(group);
  });
}

function currentWord(){
  return current.words[currentWordIndex];
}

function chapterKey(chapter = current){
  return `${chapter.book}:${chapter.ch}`;
}

function completedWords(){
  return completedWordsByChapter[chapterKey()] || [];
}

function loadProgress(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (saved.completed && typeof saved.completed === "object") Object.assign(completedWordsByChapter, saved.completed);
    return typeof saved.selectedChapter === "string" ? saved.selectedChapter : "";
  } catch {
    return "";
  }
}

function saveProgress(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: completedWordsByChapter, selectedChapter: chapterKey() }));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function updateRoundStatus(){
  const total = current.words.length;
  const completed = completedWords().length;
  const remainingAfterRound = total - completed - (gameOver ? 0 : 1);

  if (gameOver) {
    roundStatusEl.textContent = completed < total
      ? `Round ${completed} of ${total} complete · ${total - completed} new word puzzle${total - completed === 1 ? "" : "s"} remaining`
      : `All ${total} meaningful word puzzles in this chapter are complete.`;
  } else {
    roundStatusEl.textContent = `Round ${completed + 1} of ${total} · ${Math.max(remainingAfterRound, 0)} new word puzzle${remainingAfterRound === 1 ? "" : "s"} after this round`;
  }
}

function loadChapter(index){
  currentChapterIndex = index;
  current = CHAPTERS[index];
  const completed = completedWords();
  currentWordIndex = current.words.findIndex((_, wordIndex) => !completed.includes(wordIndex));
  const chapterComplete = currentWordIndex === -1;
  if (chapterComplete) currentWordIndex = 0;
  scriptureLink.href = current.url;
  scriptureLink.textContent = `Read ${current.book} ${current.ch} on ChurchofJesusChrist.org →`;
  weekLabelEl.textContent = WEEKS[current.weekIndex].label;
  chapterSelect.value = index;
  saveProgress();
  guesses = [];
  currentGuess = "";
  gameOver = chapterComplete;
  keyStatus = {};
  if (chapterComplete) showMessage("Chapter complete", "Every meaningful word puzzle in this chapter has been played. Choose another chapter to continue.");
  renderBoard();
  renderKeyboard();
  updateRoundStatus();
}

function playAgain(){
  const completed = completedWords();
  currentWordIndex = current.words.findIndex((_, wordIndex) => !completed.includes(wordIndex));
  if (currentWordIndex === -1) return;
  guesses = [];
  currentGuess = "";
  gameOver = false;
  keyStatus = {};
  closeModal();
  renderBoard();
  renderKeyboard();
  updateRoundStatus();
}

function openModal(title, content, actionText = ""){
  modalReturnFocus = document.activeElement;
  modalTitle.textContent = title;
  modalBody.innerHTML = "";
  if (typeof content === "string") {
    const copy = document.createElement("p");
    copy.className = "modal-copy";
    copy.textContent = content;
    modalBody.appendChild(copy);
  } else {
    modalBody.appendChild(content);
  }
  modalAction.hidden = !actionText;
  modalAction.textContent = actionText;
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => modalClose.focus());
}

function closeModal(){
  const wasOpen = modalBackdrop.classList.contains("open");
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  if (wasOpen && modalReturnFocus instanceof HTMLElement) modalReturnFocus.focus();
  modalReturnFocus = null;
}

function showMessage(title, text){
  openModal(title, text);
}

function showResultModal(answer, won){
  const completed = completedWords().length;
  const remaining = current.words.length - completed;
  const content = document.createDocumentFragment();
  const copy = document.createElement("p");
  copy.className = "modal-copy";
  copy.textContent = `${answer.word} — ${answer.hint}\n${answer.verseRef}`;
  content.appendChild(copy);
  const verse = document.createElement("p");
  verse.className = "verse";
  verse.textContent = `“${answer.verse}”`;
  content.appendChild(verse);
  const title = won ? "Solved!" : "Round complete";
  const actionText = remaining ? `Play Again · ${remaining} New Word${remaining === 1 ? "" : "s"} Left` : "";
  openModal(title, content, actionText);
}

function showHowToPlay(){
  const content = document.createElement("div");
  const copy = document.createElement("p");
  copy.className = "modal-copy";
  copy.textContent = "Find the five-letter word connected to the selected scripture chapter.";
  content.appendChild(copy);
  const list = document.createElement("ul");
  list.className = "how-to-list";
  list.innerHTML = "<li>Guesses must appear in the chapter, so invalid words do not cost a turn.</li><li>Green letters are in the correct spot. Gold letters are in the word but in a different spot. Dark letters are not in the word.</li><li>Complete a round to reveal its verse and play a new word from the same chapter.</li>";
  content.appendChild(list);
  const example = document.createElement("div");
  example.className = "example-row";
  example.innerHTML = '<span class="example-tile correct">T</span><span class="example-tile present">R</span><span class="example-tile absent">Y</span>';
  content.appendChild(example);
  openModal("How to play", content);
}

function evaluateGuess(guess, answer){
  const result = Array(WORD_LEN).fill("absent");
  const answerLetters = answer.split("");
  const used = Array(WORD_LEN).fill(false);

  for (let i = 0; i < WORD_LEN; i++){
    if (guess[i] === answer[i]){
      result[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LEN; i++){
    if (result[i] === "correct") continue;
    const idx = answerLetters.findIndex((l, j) => l === guess[i] && !used[j]);
    if (idx !== -1){
      result[i] = "present";
      used[idx] = true;
    }
  }
  return result;
}

function updateKeyStatus(guess, result){
  const rank = { absent: 0, present: 1, correct: 2 };
  guess.split("").forEach((letter, i) => {
    const status = result[i];
    if (!keyStatus[letter] || rank[status] > rank[keyStatus[letter]]){
      keyStatus[letter] = status;
    }
  });
}

function renderBoard(){
  boardEl.innerHTML = "";
  for (let r = 0; r < MAX_GUESSES; r++){
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    rowEl.setAttribute("role", "row");
    const guessWord = guesses[r];
    const isCurrentRow = r === guesses.length && !gameOver;
    const letters = guessWord ? guessWord.word.split("") :
      (isCurrentRow ? currentGuess.split("") : []);

    for (let c = 0; c < WORD_LEN; c++){
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "gridcell");
      const letter = letters[c] || "";
      if (letter) tile.classList.add("filled");
      tile.textContent = letter;
      if (guessWord){
        tile.classList.add(guessWord.result[c]);
        tile.setAttribute("aria-label", `${letter}, ${guessWord.result[c]}`);
      } else {
        tile.setAttribute("aria-label", letter || "empty");
      }
      rowEl.appendChild(tile);
    }
    boardEl.appendChild(rowEl);
  }
}

function renderKeyboard(){
  const rows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER", ..."ZXCVBNM".split(""), "DEL"],
  ];
  keyboardEl.innerHTML = "";
  rows.forEach(rowKeys => {
    const rowEl = document.createElement("div");
    rowEl.className = "krow";
    rowKeys.forEach(k => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.textContent = k === "DEL" ? "⌫" : (k === "ENTER" ? "Enter" : k);
      if (k === "ENTER" || k === "DEL") btn.classList.add("wide");
      if (k === "DEL") btn.setAttribute("aria-label", "Delete letter");
      if (keyStatus[k]) btn.classList.add(keyStatus[k]);
      btn.addEventListener("click", () => handleKey(k));
      rowEl.appendChild(btn);
    });
    keyboardEl.appendChild(rowEl);
  });
}

function handleKey(key){
  if (gameOver) return;
  if (key === "ENTER"){
    submitGuess();
  } else if (key === "DEL"){
    currentGuess = currentGuess.slice(0, -1);
    renderBoard();
  } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LEN){
    currentGuess += key;
    renderBoard();
  }
}

function submitGuess(){
  if (currentGuess.length < WORD_LEN){
    showMessage("Not enough letters", "Enter all five letters before submitting your guess.");
    shakeCurrentRow();
    return;
  }
  if (!current.bank.includes(currentGuess)){
    showMessage("Try another word", `${currentGuess} does not appear in ${current.book} ${current.ch}, so it will not cost a try.`);
    shakeCurrentRow();
    return;
  }
  const answer = currentWord();
  const result = evaluateGuess(currentGuess, answer.word);
  guesses.push({ word: currentGuess, result });
  updateKeyStatus(currentGuess, result);

  const won = currentGuess === answer.word;
  currentGuess = "";
  renderBoard();
  renderKeyboard();

  if (won){
    gameOver = true;
    completedWordsByChapter[chapterKey()] = [...completedWords(), currentWordIndex];
    saveProgress();
    showResultModal(answer, true);
  } else if (guesses.length >= MAX_GUESSES){
    gameOver = true;
    completedWordsByChapter[chapterKey()] = [...completedWords(), currentWordIndex];
    saveProgress();
    showResultModal(answer, false);
  }
  updateRoundStatus();
}

function shakeCurrentRow(){
  const rowEl = boardEl.children[guesses.length];
  if (!rowEl) return;
  rowEl.style.transform = "translateX(-4px)";
  setTimeout(() => { rowEl.style.transform = "translateX(4px)"; }, 60);
  setTimeout(() => { rowEl.style.transform = ""; }, 120);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeModal();
    return;
  }
  if (modalBackdrop.classList.contains("open")) {
    if (e.key === "Tab") {
      const focusable = [...modalBackdrop.querySelectorAll('button:not([hidden]), [href], select, [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first && last && (e.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
    return;
  }
  const k = e.key.toUpperCase();
  if (k === "ENTER") {
    e.preventDefault();
    handleKey("ENTER");
  } else if (k === "BACKSPACE") {
    e.preventDefault();
    handleKey("DEL");
  } else if (/^[A-Z]$/.test(k)) handleKey(k);
});

chapterSelect.addEventListener("change", (e) => {
  loadChapter(parseInt(e.target.value, 10));
});

helpButton.addEventListener("click", showHowToPlay);
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
modalAction.addEventListener("click", playAgain);

populateChapterSelect();
const savedChapter = loadProgress();
const savedIndex = CHAPTERS.findIndex(c => chapterKey(c) === savedChapter);

function currentWeekIndex(){
  const today = new Date();
  if (today.getFullYear() !== 2026) return 0;
  const months = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  let match = 0;
  WEEKS.forEach((week, index) => {
    const start = week.label.match(/^([A-Za-z]+)\s+(\d+)/);
    if (!start) return;
    if (new Date(2026, months[start[1]], Number(start[2])) <= today) match = index;
  });
  return match;
}

const defaultIndex = CHAPTERS.findIndex(c => c.weekIndex === currentWeekIndex());
loadChapter(savedIndex >= 0 ? savedIndex : (defaultIndex >= 0 ? defaultIndex : 0));
