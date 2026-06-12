import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  COMPONENT_PALETTE,
  COMPONENT_CATEGORIES,
  DRILL_RUBRIC,
  PALETTE_BY_ID,
  getCase,
} from "../data/drillCases.js";
import { lintDrill, diffComponents } from "../lib/drillLinter.js";
import { scoreDrill } from "../lib/drillScore.js";
import { KATA_TWISTS } from "../data/kataTwists.js";
import {
  ensureDrillWorkspace,
  updateWorkspace,
  deleteWorkspace,
  findDrillWorkspace,
} from "../data/workspaces.js";
import { SourceNoteLink } from "./SourceNoteLink.jsx";
import { NoteReader } from "./NoteReader.jsx";

const STEP_LABELS = ["Constraints", "Components", "Review"];

const CONSISTENCY_OPTIONS = [
  { value: "strong", label: "Strong (linearizable, ACID)" },
  { value: "eventual", label: "Eventual (BASE-OK, lag tolerated)" },
];

const DURABILITY_OPTIONS = [
  { value: "high", label: "High (no data loss; replicated, durable)" },
  { value: "medium", label: "Medium (single-AZ replication is OK)" },
  { value: "low", label: "Low (cache/throwaway data)" },
];

const COST_OPTIONS = [
  { value: "low", label: "Low (startup, free tier)" },
  { value: "medium", label: "Medium (early stage)" },
  { value: "high", label: "High (enterprise)" },
];

const GROWTH_OPTIONS = [
  { value: "stable", label: "Stable (no growth assumed)" },
  { value: "2x", label: "2× over 12 months" },
  { value: "10x", label: "10× over 12 months" },
  { value: "100x", label: "100× over 12 months" },
];

const SEVERITY_LABEL = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const EMPTY_DRILL = {
  constraints: {
    qpsRead: "",
    qpsWrite: "",
    latencyP95: "",
    consistency: "",
    durability: "",
    cost: "",
    team: "",
    growth: "",
  },
  components: [],
  rubric: {},
  step: 0,
};

export function DrillWizard({ caseId, onExit, onOpenNote, theme }) {
  const drillCase = getCase(caseId);
  const [workspace, setWorkspace] = useState(() => {
    if (!drillCase) return null;
    return ensureDrillWorkspace(caseId);
  });

  // If the workspace was deleted elsewhere (e.g., by a Reset), refresh.
  useEffect(() => {
    if (!drillCase) return;
    if (!workspace || workspace.kind !== "drill" || workspace.caseId !== caseId) {
      const existing = findDrillWorkspace(caseId);
      setWorkspace(existing ?? ensureDrillWorkspace(caseId));
    }
  }, [caseId, drillCase, workspace]);

  const drill = { ...EMPTY_DRILL, ...(workspace?.drill || {}) };
  const completedAt = workspace?.completedAt || null;
  const step = drill.step ?? 0;

  const persist = (drillPatch, extra = {}) => {
    if (!workspace) return;
    const updated = updateWorkspace(workspace.id, {
      drill: { ...drill, ...drillPatch },
      ...extra,
    });
    if (updated) setWorkspace(updated);
  };

  // Maintain the same "state-shaped" view for downstream components.
  const state = {
    constraints: drill.constraints,
    components: drill.components,
    rubric: drill.rubric,
    step,
    completedAt,
  };

  if (!drillCase) {
    return (
      <main className="stack">
        <section className="panel">
          <p className="eyebrow">Case not found</p>
          <h2>Unknown drill case: {caseId}</h2>
          <button className="link-button" onClick={onExit}>
            ← Back to drill cases
          </button>
        </section>
      </main>
    );
  }

  const setStep = (next) => persist({ step: next });

  const updateConstraints = (patch) =>
    persist({ constraints: { ...drill.constraints, ...patch } });

  const addComponent = (paletteId) => {
    const palette = PALETTE_BY_ID[paletteId];
    if (!palette) return;
    const id = `${paletteId}-${Date.now().toString(36)}`;
    persist({
      components: [
        ...drill.components,
        { id, paletteId, name: palette.name, justification: "" },
      ],
    });
  };

  const removeComponent = (id) =>
    persist({ components: drill.components.filter((c) => c.id !== id) });

  const updateComponent = (id, patch) =>
    persist({
      components: drill.components.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });

  const toggleRubric = (rubricId) =>
    persist({
      rubric: { ...drill.rubric, [rubricId]: !drill.rubric?.[rubricId] },
    });

  const kataTwist = drill.kata?.twistId
    ? KATA_TWISTS.find((t) => t.id === drill.kata.twistId) || null
    : null;

  const toggleKata = () => {
    if (kataTwist) {
      persist({ kata: null });
    } else {
      const twist = KATA_TWISTS[Math.floor(Math.random() * KATA_TWISTS.length)];
      persist({ kata: { twistId: twist.id, adr: "" } });
    }
  };

  const useSuggestedConstraints = () => {
    let c = { ...drillCase.suggestedConstraints };
    if (kataTwist) c = kataTwist.mutate(c);
    persist({ constraints: c });
  };

  const markComplete = () => {
    if (!workspace) return;
    const updated = updateWorkspace(workspace.id, {
      completedAt: new Date().toISOString(),
    });
    if (updated) setWorkspace(updated);
  };

  const resetCase = () => {
    if (!confirm("Reset this drill? Constraints, components, and rubric will be cleared. The workspace will be deleted.")) return;
    if (workspace) deleteWorkspace(workspace.id);
    onExit?.();
  };

  return (
    <main className="stack drill-wizard">
      <section className="panel drill-wizard-header">
        <button className="lesson-back" onClick={onExit}>
          <ArrowLeft size={14} />
          Back to drill cases
        </button>
        <p className="eyebrow">
          Greenfield Drill · {drillCase.difficulty}
        </p>
        <h1>{drillCase.title}</h1>
        <p>{drillCase.prompt}</p>
        <div className="button-row">
          <button className={kataTwist ? "is-active" : ""} onClick={toggleKata}>
            <Zap size={14} /> {kataTwist ? "Kata ON" : "Kata mode"}
          </button>
        </div>
        {kataTwist && (
          <div className="kata-banner">
            <Zap size={14} />
            <div>
              <strong>Kata twist: {kataTwist.label}</strong>
              <p>{kataTwist.description}</p>
            </div>
          </div>
        )}
        <Stepper step={step} onJump={setStep} />
      </section>

      {step === 0 && (
        <ConstraintsStep
          drillCase={drillCase}
          constraints={state.constraints}
          onChange={updateConstraints}
          onUseSuggested={useSuggestedConstraints}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <ComponentsStep
          drillCase={drillCase}
          components={state.components || []}
          onAdd={addComponent}
          onRemove={removeComponent}
          onUpdate={updateComponent}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ReviewStep
          drillCase={drillCase}
          state={state}
          onToggleRubric={toggleRubric}
          onMarkComplete={markComplete}
          onBack={() => setStep(1)}
          onReset={resetCase}
          onOpenNote={onOpenNote}
          theme={theme}
          kata={drill.kata || null}
          onUpdateKataAdr={(adr) => persist({ kata: { ...drill.kata, adr } })}
        />
      )}
    </main>
  );
}

function Stepper({ step, onJump }) {
  return (
    <div className="drill-stepper">
      {STEP_LABELS.map((label, i) => (
        <button
          key={label}
          className={`drill-stepper-item ${step === i ? "is-active" : ""} ${step > i ? "is-done" : ""}`}
          onClick={() => onJump(i)}
        >
          <span className="drill-stepper-num">
            {step > i ? <Check size={14} /> : i + 1}
          </span>
          <span>{label}</span>
          {i < STEP_LABELS.length - 1 && <ChevronRight size={14} className="drill-stepper-chev" />}
        </button>
      ))}
    </div>
  );
}

function ConstraintsStep({
  drillCase,
  constraints,
  onChange,
  onUseSuggested,
  onNext,
}) {
  const allFilled = [
    "qpsRead",
    "qpsWrite",
    "latencyP95",
    "consistency",
    "durability",
    "cost",
    "team",
    "growth",
  ].every((key) => constraints[key] && String(constraints[key]).trim());

  return (
    <section className="panel drill-step">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>State the constraints first.</h2>
        </div>
        <button className="link-button" onClick={onUseSuggested}>
          Use suggested values for this case →
        </button>
      </div>
      <p className="muted">
        Even guessed numbers beat blanks. Real architects refuse to draw boxes
        before this step.
      </p>

      <div className="constraints-grid">
        <NumberField
          label="Read QPS (peak)"
          value={constraints.qpsRead}
          onChange={(v) => onChange({ qpsRead: v })}
          hint="Estimate. Peak ~3× average for diurnal traffic."
        />
        <NumberField
          label="Write QPS (peak)"
          value={constraints.qpsWrite}
          onChange={(v) => onChange({ qpsWrite: v })}
          hint="Often 10–100× lower than reads."
        />
        <NumberField
          label="p95 latency target (ms)"
          value={constraints.latencyP95}
          onChange={(v) => onChange({ latencyP95: v })}
          hint="What users tolerate. Web < 300ms typical."
        />
        <NumberField
          label="Team size (engineers)"
          value={constraints.team}
          onChange={(v) => onChange({ team: v })}
          hint="Includes on-call rotation."
        />
        <SelectField
          label="Consistency tier"
          value={constraints.consistency}
          onChange={(v) => onChange({ consistency: v })}
          options={CONSISTENCY_OPTIONS}
        />
        <SelectField
          label="Durability tier"
          value={constraints.durability}
          onChange={(v) => onChange({ durability: v })}
          options={DURABILITY_OPTIONS}
        />
        <SelectField
          label="Cost ceiling"
          value={constraints.cost}
          onChange={(v) => onChange({ cost: v })}
          options={COST_OPTIONS}
        />
        <SelectField
          label="Growth (12 months)"
          value={constraints.growth}
          onChange={(v) => onChange({ growth: v })}
          options={GROWTH_OPTIONS}
        />
      </div>

      <div className="drill-step-footer">
        <span className={`muted ${allFilled ? "is-ok" : ""}`}>
          {allFilled
            ? "All constraints stated. Ready for components."
            : "Fill all eight fields to continue."}
        </span>
        <button
          className="primary-cta"
          disabled={!allFilled}
          onClick={onNext}
        >
          Continue to Components <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function NumberField({ label, value, onChange, hint }) {
  return (
    <label className="field-label">
      {label}
      <input
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. 1000"
      />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field-label">
      {label}
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">— pick one —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComponentsStep({
  drillCase,
  components,
  onAdd,
  onRemove,
  onUpdate,
  onBack,
  onNext,
}) {
  const allJustified =
    components.length > 0 &&
    components.every((c) => (c.justification || "").trim().length >= 12);

  return (
    <section className="panel drill-step">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Pick components. Defend each one.</h2>
        </div>
      </div>
      <p className="muted">
        Click to add. For every component, write one sentence: what bottleneck
        or risk does this remove? Empty justification = wrong box.
      </p>

      <div className="components-layout">
        <aside className="component-palette">
          <p className="eyebrow">Palette</p>
          {COMPONENT_CATEGORIES.map((category) => (
            <div key={category} className="palette-category">
              <h4>{category}</h4>
              {COMPONENT_PALETTE.filter((c) => c.category === category).map(
                (c) => (
                  <button
                    key={c.id}
                    className="palette-item"
                    onClick={() => onAdd(c.id)}
                    title={c.what}
                  >
                    <Plus size={12} />
                    <span>{c.name}</span>
                  </button>
                ),
              )}
            </div>
          ))}
        </aside>

        <div className="chosen-components">
          <p className="eyebrow">Your design ({components.length})</p>
          {components.length === 0 ? (
            <div className="empty-state">
              <p>No components yet. Pick from the palette on the left.</p>
            </div>
          ) : (
            <div className="chosen-list">
              {components.map((c) => {
                const palette = PALETTE_BY_ID[c.paletteId];
                const justLength = (c.justification || "").trim().length;
                return (
                  <article
                    key={c.id}
                    className={`chosen-item ${justLength < 12 ? "needs-justification" : ""}`}
                  >
                    <header>
                      <div>
                        <strong>{c.name}</strong>
                        {palette && <small>{palette.what}</small>}
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => onRemove(c.id)}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </header>
                    <textarea
                      value={c.justification}
                      onChange={(event) =>
                        onUpdate(c.id, { justification: event.target.value })
                      }
                      placeholder="What bottleneck or risk does this remove? Reference a constraint."
                    />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}>
          <ArrowLeft size={14} /> Back to constraints
        </button>
        <span className={`muted ${allJustified ? "is-ok" : ""}`}>
          {components.length === 0
            ? "Add at least one component."
            : allJustified
              ? "All components justified. Ready for review."
              : "Each component needs at least a 12-char justification."}
        </span>
        <button
          className="primary-cta"
          disabled={!allJustified}
          onClick={onNext}
        >
          Continue to Review <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function ReviewStep({
  drillCase,
  state,
  onToggleRubric,
  onMarkComplete,
  onBack,
  onReset,
  onOpenNote,
  theme,
  kata,
  onUpdateKataAdr,
}) {
  const score = useMemo(
    () => scoreDrill(state, drillCase.expectedComponents || []),
    [state, drillCase.expectedComponents],
  );
  const findings = useMemo(() => lintDrill(state), [state]);
  const componentDiff = useMemo(
    () =>
      diffComponents(
        (state.components || []).map((c) => c.paletteId),
        drillCase.expectedComponents || [],
      ),
    [state.components, drillCase.expectedComponents],
  );

  const findingsBySeverity = {
    high: findings.filter((f) => f.severity === "high"),
    medium: findings.filter((f) => f.severity === "medium"),
    low: findings.filter((f) => f.severity === "low"),
  };

  const rubricChecked = DRILL_RUBRIC.filter(
    (item) => state.rubric?.[item.id],
  ).length;

  return (
    <section className="drill-step drill-review-grid">
      <div className="panel drill-score-panel">
        <div className="drill-score-total">
          <span className="eyebrow">Design score</span>
          <strong>{score.total}</strong>
          <span className={`verdict-pill verdict-${score.verdict.replace(/\s+/g, "-").toLowerCase()}`}>
            {score.verdict}
          </span>
        </div>
        <div className="drill-score-axes">
          {Object.entries(score.axes).map(([axis, value]) => (
            <div key={axis} className="drill-score-axis">
              <span>{axis === "tradeoffs" ? "trade-offs" : axis}</span>
              <div className="axis-bar"><i style={{ width: `${value}%` }} /></div>
              <small>{value}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 3 · Review</p>
            <h2>Lint findings ({findings.length})</h2>
          </div>
          {findings.length === 0 && (
            <span className="status-pill completed">Clean</span>
          )}
        </div>
        {findings.length === 0 ? (
          <p className="muted">
            No lint findings. That's rare — go back through and stress-test.
            What about failure modes? Trade-offs you didn't pick?
          </p>
        ) : (
          <div className="findings-list">
            {findings.map((f) => (
              <article key={f.id} className={`finding-card severity-${f.severity}`}>
                <header>
                  <span className={`severity-pill ${f.severity}`}>
                    {SEVERITY_LABEL[f.severity]}
                  </span>
                  <h3>{f.title}</h3>
                </header>
                <p>{f.detail}</p>
                <div className="finding-fix">
                  <strong>Fix:</strong> {f.suggestedFix}
                </div>
                {f.citations?.length > 0 && (
                  <div className="finding-citations">
                    <small>From your vault:</small>
                    {f.citations.map((path) => (
                      <SourceNoteLink
                        key={path}
                        path={path}
                        onOpenNote={onOpenNote}
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Component diff</p>
            <h2>vs. case-study reference</h2>
          </div>
        </div>
        <div className="component-diff">
          <DiffSection
            label="You covered"
            ids={componentDiff.covered}
            tone="ok"
            empty="None of the expected components matched."
          />
          <DiffSection
            label="You missed"
            ids={componentDiff.missed}
            tone="warn"
            empty="No misses — every expected component is in your design."
          />
          <DiffSection
            label="You added (not in reference)"
            ids={componentDiff.extra}
            tone="info"
            empty="No extras."
          />
        </div>
        <p className="muted">
          The reference is one valid design, not the only one. Extras may be
          right; misses may be intentional. Use this as a discussion prompt.
        </p>
        {drillCase.keyInsights?.length > 0 && (
          <div className="key-insights">
            <p className="eyebrow">Key insights from the reference</p>
            <ul>
              {drillCase.keyInsights.map((insight) => (
                <li key={insight}>
                  <Eye size={13} /> {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Self-rubric ({rubricChecked} / {DRILL_RUBRIC.length})</p>
            <h2>Honest check.</h2>
          </div>
        </div>
        <p className="muted">
          Tick only the ones you actually did, not the ones that sound good.
          Skipped checkboxes are signals for what to practice next.
        </p>
        <ul className="rubric-list">
          {DRILL_RUBRIC.map((item) => {
            const checked = !!state.rubric?.[item.id];
            return (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRubric(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            );
          })}
        </ul>

        {kata && (
          <label className="field-label">
            ADR — defend how your design absorbs the twist (min 200 chars)
            <textarea
              rows={8}
              value={kata.adr || ""}
              onChange={(e) => onUpdateKataAdr(e.target.value)}
              placeholder={"Context:\nDecision:\nAlternatives considered:\nConsequences / what we give up:\nRevisit when:"}
            />
          </label>
        )}

        <div className="drill-step-footer">
          <button className="link-button" onClick={onBack}>
            <ArrowLeft size={14} /> Back to components
          </button>
          <button className="link-button" onClick={onReset}>
            <X size={14} /> Reset drill
          </button>
          <button
            className="primary-cta"
            onClick={onMarkComplete}
            disabled={!!state.completedAt || (kata && (kata.adr || "").length < 200)}
          >
            <CheckCircle2 size={14} />
            {state.completedAt ? "Drill marked complete" : "Mark drill complete"}
          </button>
        </div>
      </div>

      <div className="panel reference-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reference case study</p>
            <h2>How your vault answers this case</h2>
          </div>
        </div>
        <NoteReader
          notePath={drillCase.refCasePath}
          theme={theme}
          onOpenNote={onOpenNote}
        />
      </div>
    </section>
  );
}

function DiffSection({ label, ids, tone, empty }) {
  return (
    <div className={`diff-section diff-${tone}`}>
      <strong>{label}</strong>
      {ids.length === 0 ? (
        <span className="muted">{empty}</span>
      ) : (
        <ul>
          {ids.map((id) => {
            const palette = PALETTE_BY_ID[id];
            return (
              <li key={id}>
                {tone === "ok" && <Check size={12} />}
                {tone === "warn" && <AlertTriangle size={12} />}
                {tone === "info" && <Plus size={12} />}
                {palette ? palette.name : id}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
