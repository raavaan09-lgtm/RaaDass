
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [passage, setPassage] = useState(
    "Typing regularly improves accuracy, speed, concentration, and confidence. Practice every day to develop consistent typing skills."
  );
  const [typed, setTyped] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [strict, setStrict] = useState(false);
  const [finished, setFinished] = useState(false);
  const [library, setLibrary] = useState<string[]>([]);
  const [mode, setMode] = useState("timed");


  const [genre, setGenre] = useState("science");
  const [wordTarget, setWordTarget] = useState(480);

  const passageTopics: Record<string, string[]> = {
    science: [
      "Scientific discovery begins with curiosity. Researchers observe the natural world, formulate questions, and design experiments to test possible explanations. Evidence helps distinguish reliable conclusions from attractive assumptions. Progress often depends on patience, collaboration, and a willingness to revise established ideas.",
      "Modern laboratories investigate complex systems ranging from microscopic cells to distant galaxies. Instruments reveal patterns that human senses cannot detect directly. Scientists compare measurements, evaluate uncertainty, and publish methods so other researchers can verify their findings. Each carefully tested explanation creates opportunities for further discovery."
    ],
    history: [
      "History is more than a collection of dates and famous personalities. It examines how ordinary people, institutions, technologies, and ideas shape societies across generations. Letters, buildings, inscriptions, and official records provide clues, but every source requires careful interpretation and comparison.",
      "Civilizations develop through exchange, conflict, migration, and cooperation. Trade routes carry inventions and beliefs between distant communities, while political changes reshape borders and institutions. Studying these transformations helps explain how contemporary societies inherited their languages, traditions, laws, and collective memories."
    ],
    technology: [
      "Digital technology has transformed communication, education, transportation, and scientific research. Networks allow information to travel rapidly across continents, while software automates repetitive tasks and helps people analyse enormous collections of data. These advantages also introduce questions about privacy, security, reliability, and responsible design.",
      "Engineers build useful systems by combining creativity with disciplined testing. A successful application must do more than function under ideal conditions; it should remain understandable, accessible, and dependable for different users. Thoughtful design anticipates errors, protects information, and makes complicated processes easier to manage."
    ],
    adventure: [
      "At dawn, the expedition left the sheltered valley and followed a narrow trail towards the mountains. Mist concealed the distant ridges, and loose stones shifted beneath every careful step. The travellers checked their compass, conserved their water, and watched the changing weather before choosing each crossing.",
      "Beyond the forest, a forgotten bridge stretched across a deep gorge. Wind moved through the wooden supports, producing a low and uneasy rhythm. The guide examined the ropes, tested the first plank, and explained the safest route. Courage mattered, but preparation and cooperation mattered even more."
    ],
    philosophy: [
      "Philosophy invites people to examine assumptions that everyday routines often leave unquestioned. What makes an action fair, a belief justified, or a life meaningful? These questions rarely have effortless answers, because thoughtful reasoning must consider competing values, incomplete information, and different human experiences.",
      "Critical thinking requires more than defending a preferred conclusion. It involves listening carefully, identifying hidden assumptions, evaluating evidence, and admitting when an argument is weak. Intellectual humility does not prevent conviction; instead, it makes conviction more responsible by keeping the mind open to correction."
    ],
    nature: [
      "A thriving ecosystem depends on relationships among organisms, water, soil, sunlight, and climate. Plants transform solar energy into chemical energy, herbivores consume vegetation, and decomposers return nutrients to the environment. Changes in one population can influence many others through interconnected ecological relationships.",
      "Forests regulate local temperatures, store carbon, protect soil, and provide habitats for countless species. Rivers transport nutrients across landscapes, while wetlands absorb excess water and support diverse communities. Conservation therefore requires understanding entire systems rather than protecting isolated plants or animals alone."
    ]
  };

  function makePassage(topic: string, count: number) {
    const source = passageTopics[topic].join(" ");
    const words = source.split(/\s+/);
    return Array.from(
      { length: count },
      (_, i) => words[i % words.length]
    ).join(" ");
  }


  useEffect(() => {
    try {
      setLibrary(
        JSON.parse(localStorage.getItem("typing-library") || "[]")
      );
    } catch {
      setLibrary([]);
    }
  }, []);

  useEffect(() => {
    if (!running || finished || mode === "passage") return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, finished, mode]);

  const target = passage;
  const targetWords = target.match(/\S+/g) || [];
  const typedWords = typed.match(/\S+/g) || [];

  function splitWord(word: string) {
    const match = word.match(/^(\p{L}|\p{N}|_)+(.*)$/u);
    if (!match) return { core: word, punctuation: "" };

    const trailing = match[2].match(/([,.;:!?'"…)\]}]+)$/);
    if (!trailing) return { core: word, punctuation: "" };

    return {
      core: word.slice(0, word.length - trailing[1].length),
      punctuation: trailing[1],
    };
  }

  function wordErrorCount(expected: string, actual: string) {
    const a = splitWord(expected);
    const b = splitWord(actual);

    let errors = 0;
    const length = Math.max(a.core.length, b.core.length);

    for (let i = 0; i < length; i++) {
      if (a.core[i] !== b.core[i]) errors++;
    }

    const punctuationLength = Math.max(
      a.punctuation.length,
      b.punctuation.length
    );

    for (let i = 0; i < punctuationLength; i++) {
      if (a.punctuation[i] !== b.punctuation[i]) errors++;
    }

    return errors;
  }

  const errors = targetWords.reduce(
    (sum, word, i) =>
      sum + wordErrorCount(word, typedWords[i] || ""),
    0
  ) + Math.max(0, typedWords.length - targetWords.length);

  const correctCharacters = Math.max(0, typed.length - errors);
  const accuracy = typed.length
    ? Math.round((correctCharacters / typed.length) * 100)
    : 100;

  const elapsed = seconds - timeLeft;
  const wpm = elapsed > 0
    ? Math.round((typed.length / 5) / (elapsed / 60))
    : 0;

  function start() {
    setTyped("");
    setTimeLeft(seconds);
    setFinished(false);
    setRunning(true);
  }

  function savePassage() {
    const updated = [...library, passage];
    setLibrary(updated);
    localStorage.setItem("typing-library", JSON.stringify(updated));
  }

  function typeText(value: string) {
    if (!running || finished) return;

    const next = value.slice(0, target.length);

    if (strict) {
      const expected = target[typed.length];
      const entered = next[typed.length];

      if (entered !== undefined && entered !== expected) return;
    }

    setTyped(next);

    if (mode === "passage" && next.length >= target.length) {
      setRunning(false);
      setFinished(true);
    }
  }

  function renderReference() {
    let characterIndex = 0;

    return target.split(/(\s+)/).map((token, tokenIndex) => {
      if (/^\s+$/.test(token)) {
        characterIndex += token.length;
        return <span key={tokenIndex}>{token}</span>;
      }

      const wordIndex = target
        .slice(0, characterIndex)
        .trim()
        .split(/\s+/).filter(Boolean).length;

      const actual = typedWords[wordIndex] || "";
      const expectedParts = splitWord(token);
      const actualParts = splitWord(actual);
      const wordMatches = expectedParts.core === actualParts.core;
      const punctuationMatches =
        expectedParts.punctuation === actualParts.punctuation;

      characterIndex += token.length;

      return (
        <span key={tokenIndex}>
          <span className={
            actual
              ? wordMatches ? "correct" : "wrong"
              : "pending"
          }>
            {expectedParts.core}
          </span>
          <span className={
            actual
              ? punctuationMatches ? "correct" : "wrong"
              : "pending"
          }>
            {expectedParts.punctuation}
          </span>
        </span>
      );
    });
  }

  return (
    <main className="page">
      <header className="header">
        <div className="logo">⌨</div>
        <div>
          <h1>TypeFlow</h1>
          <p>Your personal typing practice studio</p>
        </div>
      </header>

      <section className="panel">
        <h2>Create your practice</h2>

        <label htmlFor="passage">Your passage</label>
        <textarea
          id="passage"
          value={passage}
          onChange={(e) => setPassage(e.target.value)}
          disabled={running}
          rows={5}
        />

        <p className="muted">
          {(passage.trim().match(/\S+/g) || []).length} words ·{" "}
          {passage.length} characters
        </p>

        <div className="settings">
          <div>
            <label htmlFor="mode">Practice mode</label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              disabled={running}
            >
              <option value="timed">Timed test</option>
              <option value="passage">Complete passage</option>
            </select>
          </div>

          <div>
            <label htmlFor="duration">Test duration</label>
            <select
              id="duration"
              value={seconds}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSeconds(n);
                setTimeLeft(n);
              }}
              disabled={running || mode === "passage"}
            >
              <option value={60}>1 minute</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
          </div>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={strict}
            onChange={(e) => setStrict(e.target.checked)}
            disabled={running}
          />
          Strict mode — require the correct character
        </label>

        <div className="buttons">
          <button onClick={start} disabled={!passage.trim()}>
            {running ? "Restart practice" : "Start practice"}
          </button>
          <button className="secondary" onClick={savePassage}>
            Save passage
          </button>
        </div>
      </section>

      <section className="stats">
        <div><span>Time left</span><strong>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </strong></div>
        <div><span>Speed</span><strong>{wpm} WPM</strong></div>
        <div><span>Accuracy</span><strong>{accuracy}%</strong></div>
        <div><span>Errors</span><strong>{errors}</strong></div>
      </section>

      <section className="panel practice">
        <h2>Typing practice</h2>

        <p className="reference">{renderReference()}</p>

        <label htmlFor="typing">Type the passage here</label>
        <textarea
          id="typing"
          value={typed}
          onChange={(e) => typeText(e.target.value)}
          disabled={!running || finished}
          placeholder="Press Start practice, then type here..."
          rows={5}
          spellCheck={false}
        />

        <div className="buttons">
          <button
            className="secondary"
            onClick={() => {
              setRunning(false);
              setFinished(false);
              setTyped("");
              setTimeLeft(seconds);
            }}
          >
            Reset
          </button>
        </div>

        {finished && (
          <div className="result">
            <h3>Practice complete!</h3>
            <p>
              Speed: {wpm} WPM · Accuracy: {accuracy}% · Errors: {errors}
            </p>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Saved passages</h2>

        {library.length === 0 ? (
          <p className="muted">Your saved passages will appear here.</p>
        ) : (
          library.map((item, i) => (
            <div className="saved" key={`${i}-${item.slice(0, 12)}`}>
              <p>{item.slice(0, 100)}{item.length > 100 ? "…" : ""}</p>
              <button
                className="secondary"
                onClick={() => {
                  setPassage(item);
                  setTyped("");
                  setFinished(false);
                  setRunning(false);
                  setTimeLeft(seconds);
                }}
              >
                Load passage
              </button>
              <button
                className="secondary"
                onClick={() => {
                  const updated = library.filter((_, index) => index !== i);
                  setLibrary(updated);
                  localStorage.setItem("typing-library", JSON.stringify(updated));
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>

      <footer>TypeFlow · Practice consistently. Improve every day.</footer>
    </main>
  );
}
