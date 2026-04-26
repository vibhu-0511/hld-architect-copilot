import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookText,
  Brain,
  CheckCircle2,
  ClipboardList,
  CalendarDays,
  FileText,
  Moon,
  Network,
  NotebookPen,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shuffle,
  Sparkles,
  Sun,
  Target,
  Trash2,
} from "lucide-react";
import { ALL_TERMS, CATEGORIES } from "./data/terms.js";
import { NOTE_TEMPLATES, REVIEW_CATEGORIES } from "./data/learning.js";
import { LEARNING_PHASES } from "./data/learning.js";
import { analyzeBrief, buildProposal } from "./lib/reviewEngine.js";
import { LibraryView } from "./components/LibraryView.jsx";
import { SkillsView } from "./components/SkillsView.jsx";
import { TodayView } from "./components/TodayView.jsx";
import { SourceNoteLink } from "./components/SourceNoteLink.jsx";
import { StarterPathToday } from "./components/StarterPathToday.jsx";
import { LevelPicker } from "./components/LevelPicker.jsx";

const tabs = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "skills", label: "Skills", icon: Target },
  { id: "library", label: "Library", icon: BookText },
  { id: "vocab", label: "Vocabulary", icon: Brain },
  { id: "review", label: "Review System", icon: ClipboardList },
  { id: "proposal", label: "Proposal", icon: FileText },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function stableShuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Header({ activeTab, onTabChange, theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">HLD Architect Co-pilot</p>
        <h1>Learn system design by reviewing real systems.</h1>
        <p className="header-copy">
          A beginner-first workbench for moving from notes to practical architecture decisions,
          risks, trade-offs, and founder-ready recommendations.
        </p>
      </div>
      <div className="header-actions">
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle dark mode">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <nav className="tabbar" aria-label="Primary">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={cx("tab-button", activeTab === tab.id && "is-active")}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function NotesView() {
  const [notes, setNotes] = useLocalStorage("hld-personal-notes", () => [
    {
      id: crypto.randomUUID(),
      title: "My first HLD note",
      body: NOTE_TEMPLATES["Learning Note"].body,
      tags: "learning, phase-0",
      attachment: "phase-0",
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [templateName, setTemplateName] = useState("Learning Note");
  const selectedNote = notes.find((note) => note.id === selectedId) ?? notes[0] ?? null;

  useEffect(() => {
    if (!selectedId && notes[0]) setSelectedId(notes[0].id);
  }, [notes, selectedId]);

  const filteredNotes = notes.filter((note) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [note.title, note.body, note.tags, note.attachment].some((value) =>
      (value ?? "").toLowerCase().includes(q),
    );
  });

  const updateSelectedNote = (patch) => {
    if (!selectedNote) return;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedNote.id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
      ),
    );
  };

  const createNote = () => {
    const template = NOTE_TEMPLATES[templateName];
    const note = {
      id: crypto.randomUUID(),
      title: template.title,
      body: template.body,
      tags: templateName.toLowerCase().replaceAll(" ", "-"),
      attachment: "general",
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
  };

  const deleteNote = () => {
    if (!selectedNote) return;
    const nextNote = notes.find((note) => note.id !== selectedNote.id);
    setNotes((prev) => prev.filter((note) => note.id !== selectedNote.id));
    setSelectedId(nextNote?.id ?? null);
  };

  return (
    <main className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Personal Notes</p>
            <h2>Capture your own HLD thinking while you practice.</h2>
          </div>
          <span className="pill">{notes.length} local notes</span>
        </div>
        <p className="muted">Notes are saved in this browser's localStorage. They stay local to this machine/browser profile.</p>
      </section>

      <section className="notes-layout">
        <aside className="panel notes-sidebar">
          <label className="searchbox">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." />
          </label>
          <div className="notes-create-row">
            <select value={templateName} onChange={(event) => setTemplateName(event.target.value)}>
              {Object.keys(NOTE_TEMPLATES).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <button onClick={createNote}>
              <Plus size={15} />
              New
            </button>
          </div>
          <div className="notes-list">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                className={selectedNote?.id === note.id ? "is-active" : ""}
                onClick={() => setSelectedId(note.id)}
              >
                <strong>{note.title || "Untitled note"}</strong>
                <span>{note.tags || "no tags"}</span>
              </button>
            ))}
            {filteredNotes.length === 0 && <div className="empty-state">No notes match your search.</div>}
          </div>
        </aside>

        <section className="panel note-editor">
          {selectedNote ? (
            <>
              <div className="note-editor-actions">
                <span>
                  <Save size={15} />
                  Saved locally
                </span>
                <button onClick={deleteNote}>
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
              <label className="field-label">
                Title
                <input
                  value={selectedNote.title}
                  onChange={(event) => updateSelectedNote({ title: event.target.value })}
                  placeholder="Note title"
                />
              </label>
              <div className="notes-meta-grid">
                <label className="field-label">
                  Tags
                  <input
                    value={selectedNote.tags}
                    onChange={(event) => updateSelectedNote({ tags: event.target.value })}
                    placeholder="phase-2, checkout, idempotency"
                  />
                </label>
                <label className="field-label">
                  Attach to
                  <select
                    value={selectedNote.attachment}
                    onChange={(event) => updateSelectedNote({ attachment: event.target.value })}
                  >
                    <option value="general">General</option>
                    {LEARNING_PHASES.map((phaseItem) => (
                      <option key={phaseItem.id} value={phaseItem.id}>
                        Phase {phaseItem.number}: {phaseItem.title}
                      </option>
                    ))}
                    <option value="case">Case exercise</option>
                    <option value="bug">Bug scenario</option>
                    <option value="proposal">Founder proposal</option>
                  </select>
                </label>
              </div>
              <label className="field-label">
                Body
                <textarea
                  className="note-body"
                  value={selectedNote.body}
                  onChange={(event) => updateSelectedNote({ body: event.target.value })}
                  placeholder="Write markdown-style notes here..."
                />
              </label>
              <div className="note-preview">
                <p className="eyebrow">Preview</p>
                <pre>{selectedNote.body}</pre>
              </div>
            </>
          ) : (
            <div className="empty-state">Create a note to start writing.</div>
          )}
        </section>
      </section>
    </main>
  );
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : typeof initialValue === "function" ? initialValue() : initialValue;
    } catch {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function TermCard({ term, expanded, onToggle, onOpenNote }) {
  return (
    <article className={cx("term-card", expanded && "is-expanded")} style={{ "--accent": term.color }}>
      <button className="term-card-button" onClick={onToggle}>
        <span className="term-category">{term.categoryLabel}</span>
        <strong>{term.term}</strong>
        <span className="expand-symbol">{expanded ? "Close" : "Open"}</span>
      </button>
      <p>{term.beginner}</p>
      {expanded && (
        <div className="term-details">
          {[
            ["What", term.what],
            ["When", term.when],
            ["Not when", term.notWhen],
            ["Cost / risk", term.cost],
            ["Example", term.example],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <p>{value}</p>
            </div>
          ))}
          <div>
            <span>Source notes</span>
            <div className="term-source-notes">
              {term.sourceNotes.map((note) => (
                <SourceNoteLink key={note} path={note} onOpenNote={onOpenNote} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Flashcards({ terms }) {
  const [cards, setCards] = useState(() => stableShuffle(terms));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCards(stableShuffle(terms));
    setIdx(0);
    setFlipped(false);
  }, [terms]);

  const card = cards[idx];

  if (!card) {
    return <div className="empty-state">No cards match this filter.</div>;
  }

  const next = () => {
    setFlipped(false);
    setIdx((current) => (current + 1) % cards.length);
  };

  const previous = () => {
    setFlipped(false);
    setIdx((current) => (current - 1 + cards.length) % cards.length);
  };

  const reshuffle = () => {
    setCards(stableShuffle(terms));
    setIdx(0);
    setFlipped(false);
  };

  return (
    <section className="flashcard-wrap">
      <p className="muted">
        {idx + 1} / {cards.length}
      </p>
      <button className="flashcard" onClick={() => setFlipped((value) => !value)} style={{ "--accent": card.color }}>
        {!flipped ? (
          <>
            <span className="term-category">{card.categoryLabel}</span>
            <strong>{card.term}</strong>
            <small>Tap to reveal the beginner explanation</small>
          </>
        ) : (
          <div>
            <strong>{card.term}</strong>
            <p>{card.beginner}</p>
            <p>{card.when}</p>
          </div>
        )}
      </button>
      <div className="button-row">
        <button onClick={previous}>Previous</button>
        <button onClick={next}>Next</button>
        <button onClick={reshuffle}>
          <Shuffle size={15} />
          Shuffle
        </button>
      </div>
    </section>
  );
}

function VocabView({ onOpenNote }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [mode, setMode] = useState("browse");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ALL_TERMS.filter((term) => {
      const categoryMatch = selectedCat === "All" || term.category === selectedCat;
      const searchMatch =
        !query ||
        [term.term, term.beginner, term.what, term.when, term.example].some((value) =>
          value.toLowerCase().includes(query),
        );
      return categoryMatch && searchMatch;
    });
  }, [search, selectedCat]);

  return (
    <main className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vocabulary</p>
            <h2>Terms that explain decisions, not just definitions.</h2>
          </div>
          <span className="pill">{ALL_TERMS.length} curated terms</span>
        </div>

        <div className="toolbar">
          <label className="searchbox">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cache, queue, idempotency..."
            />
          </label>
          <div className="segmented">
            {["browse", "flashcard"].map((item) => (
              <button
                key={item}
                className={mode === item ? "is-active" : ""}
                onClick={() => setMode(item)}
              >
                {item === "flashcard" ? <RefreshCw size={15} /> : <Network size={15} />}
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          {["All", ...Object.keys(CATEGORIES)].map((category) => (
            <button
              key={category}
              className={selectedCat === category ? "is-active" : ""}
              onClick={() => setSelectedCat(category)}
            >
              {category === "BuildingBlocks" ? "Building Blocks" : category}
            </button>
          ))}
        </div>
      </section>

      {mode === "flashcard" ? (
        <Flashcards terms={filtered} />
      ) : (
        <section className="term-grid">
          {filtered.map((term) => (
            <TermCard
              key={term.term}
              term={term}
              expanded={expanded === term.term}
              onToggle={() => setExpanded(expanded === term.term ? null : term.term)}
              onOpenNote={onOpenNote}
            />
          ))}
          {filtered.length === 0 && <div className="empty-state">No terms match your search.</div>}
        </section>
      )}
    </main>
  );
}

const sampleBrief = `System: Order checkout
Flow: Mobile app calls checkout API. API writes order to PostgreSQL, calls payment provider, sends email notification, updates analytics, and returns response.
Data: PostgreSQL stores orders and payments. Redis cache is used for product price lookup.
Traffic: 150 RPS today, sale events can spike to 1500 RPS. Target p95 latency under 300ms.
Pain points: Checkout sometimes times out when payment provider is slow. Duplicate orders happened during retry. We have basic logs but no tracing dashboard.`;

function ReviewView({ reviewText, setReviewText, systemName, setSystemName }) {
  const result = useMemo(() => analyzeBrief(reviewText), [reviewText]);

  return (
    <main className="stack">
      <section className="two-column review-layout">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Architecture Review</p>
              <h2>Paste a system brief. Get useful review points.</h2>
            </div>
          </div>
          <label className="field-label">
            System name
            <input
              value={systemName}
              onChange={(event) => setSystemName(event.target.value)}
              placeholder="Order checkout, notifications, search..."
            />
          </label>
          <label className="field-label">
            Architecture brief
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Describe request flow, services, data stores, scale, pain points, failures, and constraints."
            />
          </label>
          <div className="button-row">
            <button onClick={() => setReviewText(sampleBrief)}>
              <Sparkles size={15} />
              Load sample
            </button>
            <button onClick={() => setReviewText("")}>Clear</button>
          </div>
        </div>

        <aside className="panel score-panel">
          <p className="eyebrow">Review Score</p>
          <div className="score">{result.score}</div>
          <p>{result.summary}</p>
          <div className="checklist-column">
            {REVIEW_CATEGORIES.map((item) => (
              <span key={item}>
                <CheckCircle2 size={15} />
                {item}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="findings-list">
        {result.findings.map((finding) => (
          <article key={finding.id} className="finding-card">
            <div>
              <span className={cx("severity", finding.severity.toLowerCase())}>{finding.severity}</span>
              <span className="area">{finding.area}</span>
            </div>
            <h3>{finding.issue}</h3>
            <p>{finding.whyItMatters}</p>
            <div className="recommendation">
              <AlertTriangle size={17} />
              <span>{finding.suggestedFix}</span>
            </div>
            <div className="concept-row compact">
              {finding.relatedConcepts.map((concept) => (
                <span key={concept}>{concept}</span>
              ))}
            </div>
          </article>
        ))}
        {result.findings.length === 0 && reviewText && (
          <div className="empty-state">No obvious gaps found. Add failure cases and traffic details for deeper review.</div>
        )}
      </section>
    </main>
  );
}

function ProposalView({ reviewText, systemName }) {
  const result = useMemo(() => analyzeBrief(reviewText), [reviewText]);
  const proposal = useMemo(
    () => buildProposal(systemName || "current system", result.findings),
    [systemName, result.findings],
  );

  return (
    <main className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Founder Proposal Builder</p>
            <h2>Turn review findings into a crisp architecture recommendation.</h2>
          </div>
          <span className="pill">{result.findings.length} source findings</span>
        </div>
        <p className="muted">
          This is a draft. Use it to start the conversation, then refine numbers, rollout,
          ownership, and business impact before presenting.
        </p>
      </section>
      <article className="proposal-card">
        <h2>{proposal.title}</h2>
        <pre>{proposal.text}</pre>
      </article>
    </main>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage("hld-active-tab", "today");
  const [reviewText, setReviewText] = useState("");
  const [systemName, setSystemName] = useState("");
  const [activeNotePath, setActiveNotePath] = useLocalStorage(
    "hld-active-note",
    null,
  );
  const [activeSkillId, setActiveSkillId] = useLocalStorage(
    "hld-active-skill",
    null,
  );
  const [level, setLevel] = useLocalStorage("hld-level", null);
  const [starterProgress, setStarterProgress] = useLocalStorage(
    "hld-starter-progress",
    { completedLessons: [] },
  );
  const [theme, setTheme] = useLocalStorage("hld-theme", () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const openNote = (path) => {
    setActiveNotePath(path);
    setActiveTab("library");
  };

  const selectSkill = (id) => {
    setActiveSkillId(id);
  };

  const markLessonComplete = (lessonNumber) => {
    setStarterProgress((current) => {
      const completed = current?.completedLessons ?? [];
      if (completed.includes(lessonNumber)) return current;
      const next = { completedLessons: [...completed, lessonNumber].sort((a, b) => a - b) };
      // Auto-promote on lesson 14 graduation handled by StarterPathToday
      // surfacing the graduation screen; the user explicitly clicks
      // "Switch to Practicing mode" to set level.
      return next;
    });
  };

  const promoteToPracticing = () => {
    setLevel("practicing");
  };

  if (!level) {
    return <LevelPicker onPick={setLevel} />;
  }

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />
      {activeTab === "today" && (
        level === "beginner" ? (
          <StarterPathToday
            completedLessons={starterProgress?.completedLessons ?? []}
            onMarkComplete={markLessonComplete}
            onSkipToPracticing={promoteToPracticing}
            onOpenNote={openNote}
            theme={theme}
          />
        ) : (
          <TodayView
            onOpenNote={openNote}
            onJumpToTab={setActiveTab}
            onSelectSkill={selectSkill}
          />
        )
      )}
      {activeTab === "skills" && (
        <SkillsView
          activeSkillId={activeSkillId}
          onSelectSkill={setActiveSkillId}
          onOpenNote={openNote}
          level={level}
        />
      )}
      {activeTab === "library" && (
        <LibraryView
          activeNotePath={activeNotePath}
          onOpenNote={setActiveNotePath}
          theme={theme}
        />
      )}
      {activeTab === "vocab" && <VocabView onOpenNote={openNote} />}
      {activeTab === "review" && (
        <ReviewView
          reviewText={reviewText}
          setReviewText={setReviewText}
          systemName={systemName}
          setSystemName={setSystemName}
        />
      )}
      {activeTab === "proposal" && <ProposalView reviewText={reviewText} systemName={systemName} />}
      {activeTab === "notes" && <NotesView />}
    </div>
  );
}
