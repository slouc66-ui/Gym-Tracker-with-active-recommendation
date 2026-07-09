{import React, { useState, useEffect, useRef } from "react";
import { Dumbbell, Settings2, PersonStanding, Plus, X, TrendingUp, ChevronDown, ChevronUp, Flame, Timer, RotateCcw } from "lucide-react";

const REST_DURATION = 3 * 60; // 3 minutes in seconds

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const CATEGORY_META = {
  free: { label: "Free Weight", icon: Dumbbell, step: 2.5 },
  machine: { label: "Machine", icon: Settings2, step: 5 },
  cardio: { label: "Cardio", icon: PersonStanding, step: 0 },
};

const DEFAULT_EXERCISES = [
  { id: "bench", name: "Bench Press", category: "free" },
  { id: "squat", name: "Squat", category: "free" },
  { id: "legpress", name: "Leg Press", category: "machine" },
  { id: "lat", name: "Lat Pulldown", category: "machine" },
  { id: "run", name: "Treadmill", category: "cardio" },
  { id: "chest-fly", name: "Chest Fly", category: "machine" },
  { id: "bench-smith", name: "Bench Press (Smith Machine)", category: "machine" },
  { id: "incline-bench-smith", name: "Incline Bench Press (Smith Machine)", category: "machine" },
  { id: "incline-bench-dumbbell", name: "Incline Bench Press (Dumbbell)", category: "free" },
  { id: "preacher-curl", name: "Preacher Curl (Machine)", category: "machine" },
  { id: "triceps-ext-cable", name: "Triceps Extension (Cable)", category: "machine" },
  { id: "hammer-curl-cable", name: "Hammer Curl (Cable)", category: "machine" },
  { id: "triceps-ext", name: "Triceps Extension", category: "machine" },
  { id: "reverse-fly", name: "Reverse Fly (Machine)", category: "machine" },
  { id: "lateral-raise", name: "Lateral Raise (Machine)", category: "machine" },
  { id: "leg-extension", name: "Leg Extension (Machine)", category: "machine" },
  { id: "forearm-ext-pushdown", name: "Forearm Extensions/Pushdowns", category: "machine" },
  { id: "seated-row", name: "Seated Row (Cable)", category: "machine" },
  { id: "lat-pulldown", name: "Lat Pulldown (Cable)", category: "machine" },
  { id: "shrug-machine", name: "Shrug (Machine)", category: "machine" },
];

function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

function CategoryIcon({ category, size = 18 }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.free;
  const Icon = meta.icon;
  return <Icon size={size} strokeWidth={1.8} />;
}

export default function GymTracker() {
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [session, setSession] = useState({}); // exerciseId -> [{id, weight, reps, warmup}]
  const [bestEver, setBestEver] = useState({}); // exerciseId -> {weight, reps}
  const [suggestions, setSuggestions] = useState({}); // exerciseId -> string
  const [expanded, setExpanded] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("free");
  const [showPicker, setShowPicker] = useState(false);
  const [restTimers, setRestTimers] = useState({}); // exId -> secondsLeft
  const intervalsRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach((iv) => clearInterval(iv));
    };
  }, []);

  function startRest(exId) {
    clearInterval(intervalsRef.current[exId]);
    setRestTimers((r) => ({ ...r, [exId]: REST_DURATION }));
    intervalsRef.current[exId] = setInterval(() => {
      setRestTimers((r) => {
        const current = r[exId];
        if (current === undefined) return r;
        if (current <= 1) {
          clearInterval(intervalsRef.current[exId]);
          const { [exId]: _, ...rest } = r;
          return rest;
        }
      });
    }, 1000);
  }

  function stopRest(exId) {
    clearInterval(intervalsRef.current[exId]);
    setRestTimers((r) => {
      const { [exId]: _, ...rest } = r;
      return rest;
    });
  }

  const activeExerciseIds = Object.keys(session);

  function addExerciseToSession(id) {
    setSession((s) => (s[id] ? s : { ...s, [id]: [] }));
    setExpanded((e) => ({ ...e, [id]: true }));
    setShowPicker(false);

  function createExercise() {
    if (!newName.trim()) return;
    const id = newName.trim().toeLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setExercises((ex) => [...ex, { id, name: newName.trim(), category: newCategory }]);
    setNewName("");
    setShowAdd(false);
    addExerciseToSession(id);
  }

  function addSet(exId, warmup) {
    setSession((s) => ({
      ...s,
      [exId]: [...s[exId], { id: Date.now(), weight: "", reps: "", warmup }],
    }));
  }

  function updateSet(exId, setId, field, value) {
    setSession((s) => ({
      ...s,
      [exId]: s[exId].map((st) => (st.id === setId ? { ...st, [field]: value } : st)),
    }));
  }

  function removeSet(exId, setId) {
    setSession((s) => ({ ...s, [exId]: s[exId].filter((st) => st.id !== setId) }));
  }

  function confirmSet(exId, setId) {
    const st = session[exId].find((x) => x.id === setId);
    const weight = parseFloat(st.weight);
    const reps = parseInt(st.reps);
    if (!weight || !reps) return;

    startRest(exId);

    if (st.warmup) return;

    const prev = bestEver[exId];
    let gotPR = false;
    if (!prev || weight > prev.weight || (weight === prev.weight && reps > prev.reps)) {
      gotPR = true;
    }

    if (gotPR) {
      const meta = CATEGORY_META[exercises.find((e) => e.id === exId)?.category || "free"];
      setBestEver((b) => ({ ...b, [exId]: { weight, reps } }));
      if (meta.step > 0) {
        setSuggestions((sg) => ({
          ...sg,
          [exId]: `New personal best! Increase the weight next time by ${meta.step} kg to ${weight + meta.step} kg.`,
        }));
      }
    }
  }

  function exerciseStats(exId) {
    const sets = session[exId] || [];
    let volume = 0;
    let best1RM = 0;
    sets.forEach((st) => {
      const w = parseFloat(st.weight) || 0;
      const r = parseInt(st.reps) || 0;
      if (!st.warmup) {
        volume += w * r;
        const rm = epley1RM(w, r);
        if (rm > best1RM) best1RM = rm;
      }
    });
    return { volume, best1RM };
  }

  const categories = Object.keys(CATEGORY_META);
  const availableToAdd = exercises.filter((e) => !session[e.id]);

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>Workout</h1>
        <p style={styles.subtitle}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div style={styles.list}>
        {activeExerciseIds.length === 0 && (
          <div style={styles.emptyState}>
            <Dumbbell size={32} strokeWidth={1.5} color="#c7c7cc" />
            <p style={styles.emptyText}>No exercise added yet</p>
          </div>
        )}

        {activeExerciseIds.map((exId) => {
          const ex = exercises.find((e) => e.id === exId);
          const sets = session[exId];
          const { volume, best1RM } = exerciseStats(exId);
          const isOpen = expanded[exId] !== false;
          const suggestion = suggestions[exId];

          return (
            <div key={exId} style={styles.card}>
              <div style={styles.cardHeader} onClick={() => setExpanded((e) => ({ ...e, [exId]: !isOpen }))}>
                <div style={styles.cardHeaderLeft}>
                  <div style={styles.iconCircle}>
                    <CategoryIcon category={ex.category} />
                  </div>
                  <div>
                    <div style={styles.exName}>{ex.name}</div>
                    <div style={styles.exMeta}>{CATEGORY_META[ex.category].label}</div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} color="#8e8e93" /> : <ChevronDown size={18} color="#8e8e93" />}
              </div>

              {suggestion && (
                <div style={styles.suggestion}>
                  <Flame size={15} color="#ff9500" />
                  <span>{suggestion}</span>
                </div>
              )}

              {restTimers[exId] !== undefined && (
                <div style={styles.restBanner}>
                  <div style={styles.restLeft}>
                    <Timer size={16} color="#007aff" />
                    <span style={styles.restLabel}>Rest</span>
                    <span style={styles.restTime}>{formatTime(restTimers[exId])}</span>
                  </div>
                  <button style={styles.restSkipBtn} onClick={() => stopRest(exId)}>
                    Skip
                  </button>
                </div>
              )}

              {isOpen && (
                <>
                  <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>Volume</div>
                      <div style={styles.statValue}>{Math.round(volume)} kg</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>Estimated 1RM</div>
                      <div style={styles.statValue}>{best1RM ? Math.round(best1RM) : "–"} kg</div>
                    </div>
                  </div>

                  {sets.length > 0 && (
                    <div style={styles.setsTableHead}>
                      <span style={{ width: 28 }}>#</span>
                      <span style={{ flex: 1 }}>kg</span>
                      <span style={{ flex: 1 }}>Reps</span>
                      <span style={{ width: 60, textAlign: "center" }}>Warm-up</span>
                      <span style={{ width: 24 }} />
                    </div>
                  )}

                  {sets.map((st, i) => (
                    <div key={st.id} style={styles.setRow}>
                      <span style={{ width: 28, color: "#8e8e93", fontSize: 14 }}>{i + 1}</span>
                      <input
                        style={styles.input}
                        type="number"
                        placeholder="0"
                        value={st.weight}
                        onChange={(e) => updateSet(exId, st.id, "weight", e.target.value)}
                        onBlur={() => confirmSet(exId, st.id)}
                      />
                      <input
                        style={styles.input}
                        type="number"
                        placeholder="0"
                        value={st.reps}
                        onChange={(e) => updateSet(exId, st.id, "reps", e.target.value)}
                        onBlur={() => confirmSet(exId, st.id)}
                      />
                      <div style={{ width: 60, display: "flex", justifyContent: "center" }}>
                        <input
                          type="checkbox"
                          checked={st.warmup}
                          onChange={(e) => updateSet(exId, st.id, "warmup", e.target.checked)}
                        />
                      </div>
                      <button style={styles.removeBtn} onClick={() => removeSet(exId, st.id)}>
                        <X size={14} color="#8e8e93" />
                      </button>
                    </div>
                  ))}

                  <div style={styles.addSetRow}>
                    <button style={styles.smallBtnGhost} onClick={() => addSet(exId, true)}>
                      + Warm-up Set
                    </button>
                    <button style={styles.smallBtn} onClick={() => addSet(exId, false)}>
                      + Set
                    </button>
                  </div>

                  <button style={styles.restStartBtn} onClick={() => startRest(exId)}>
                    <Timer size={15} /> Start Rest (3:00)
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!showPicker && (
        <button style={styles.addExerciseBtn} onClick={() => setShowPicker(true)}>
          <Plus size={18} strokeWidth={2} />
          Add Exercise
        </button>
      )}

      {showPicker && (
        <div style={styles.pickerCard}>
          <div style={styles.pickerHeader}>
            <span style={styles.pickerTitle}>Choose Exercise</span>
            <button style={styles.iconBtn} onClick={() => setShowPicker(false)}>
              <X size={18} color="#8e8e93" />
            </button>
          </div>
          <div style={styles.pickerList}>
            {availableToAdd.map((ex) => (
              <button key={ex.id} style={styles.pickerItem} onClick={() => addExerciseToSession(ex.id)}>
                <div style={styles.iconCircleSm}>
                  <CategoryIcon category={ex.category} size={16} />
                </div>
                <span style={{ flex: 1, textAlign: "left" }}>{ex.name}</span>
                <span style={styles.pickerCat}>{CATEGORY_META[ex.category].label}</span>
              </button>
            ))}
          </div>

          {!showAdd ? (
            <button style={styles.newExerciseBtn} onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Create New Exercise
            </button>
          ) : (
            <div style={styles.newExerciseForm}>
              <input
                style={styles.textInput}
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div style={styles.categoryRow}>
                {categories.map((c) => {
                  const Icon = CATEGORY_META[c].icon;
                  const active = newCategory === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setNewCategory(c)}
                      style={{
                        ...styles.categoryChip,
                        ...(active ? styles.categoryChipActive : {}),
                      }}
                    >
                      <Icon size={15} />
                      {CATEGORY_META[c].label}
                    </button>
                  );
                })}
              </div>
              <button style={styles.confirmBtn} onClick={createExercise}>
                Create Exercise
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
    background: "#f2f2f7",
    minHeight: "100vh",
    padding: "24px 16px 60px",
    maxWidth: 480,
    margin: "0 auto",
    color: "#1c1c1e",
  },
  header: { padding: "8px 4px 20px" },
  title: { fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#8e8e93", margin: "4px 0 0" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "50px 0",
    color: "#c7c7cc",
  },
  emptyText: { fontSize: 15, color: "#8e8e93" },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  cardHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#f2f2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#007aff",
  },
  iconCircleSm: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#f2f2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#007aff",
  },
  exName: { fontSize: 16, fontWeight: 600 },
  exMeta: { fontSize: 13, color: "#8e8e93", marginTop: 1 },
  suggestion: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#fff4e5",
    color: "#b25c00",
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    marginTop: 10,
  },
  restBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#e8f2ff",
    borderRadius: 10,
    padding: "8px 10px",
    marginTop: 10,
  },
  restLeft: { display: "flex", alignItems: "center", gap: 6 },
  restLabel: { fontSize: 13, color: "#007aff", fontWeight: 500 },
  restTime: { fontSize: 15, color: "#007aff", fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  restSkipBtn: {
    border: "none",
    background: "transparent",
    color: "#007aff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  restStartBtn: {
    width: "100%",
    height: 34,
    marginTop: 8,
    borderRadius: 9,
    border: "1px solid #e5e5ea",
    background: "#fff",
    color: "#007aff",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
  statsRow: { display: "flex", gap: 10, marginTop: 14 },
  statBox: {
    flex: 1,
    background: "#f2f2f7",
    borderRadius: 12,
    padding: "8px 12px",
  },
  statLabel: { fontSize: 12, color: "#8e8e93" },
  statValue: { fontSize: 17, fontWeight: 700, marginTop: 2 },
  setsTableHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    fontSize: 12,
    color: "#8e8e93",
    padding: "0 2px",
  },
  setRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    border: "1px solid #e5e5ea",
    background: "#f9f9fb",
    textAlign: "center",
    fontSize: 15,
    outline: "none",
  },
  removeBtn: {
    width: 24,
    height: 24,
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  addSetRow: { display: "flex", gap: 8, marginTop: 12 },
  smallBtn: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    border: "none",
    background: "#007aff",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  smallBtnGhost: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    border: "1px solid #e5e5ea",
    background: "#fff",
    color: "#3a3a3c",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  addExerciseBtn: {
    width: "100%",
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    border: "none",
    background: "#007aff",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
  pickerCard: {
    marginTop: 16,
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  pickerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pickerTitle: { fontSize: 16, fontWeight: 600 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    background: "#f2f2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  pickerList: { display: "flex", flexDirection: "column", gap: 4 },
  pickerItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 8px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    fontSize: 15,
    color: "#1c1c1e",
    cursor: "pointer",
    textAlign: "left",
  },
  pickerCat: { fontSize: 12, color: "#8e8e93" },
  newExerciseBtn: {
    marginTop: 10,
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px dashed #c7c7cc",
    background: "transparent",
    color: "#007aff",
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
  newExerciseForm: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  textInput: {
    height: 38,
    borderRadius: 10,
    border: "1px solid #e5e5ea",
    background: "#f9f9fb",
    padding: "0 12px",
    fontSize: 15,
    outline: "none",
  },
  categoryRow: { display: "flex", gap: 8 },
  categoryChip: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    border: "1px solid #e5e5ea",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 13,
    color: "#3a3a3c",
    cursor: "pointer",
  },
  categoryChipActive: {
    background: "#007aff",
    borderColor: "#007aff",
    color: "#fff",
  },
  confirmBtn: {
    height: 40,
    borderRadius: 10,
    border: "none",
    background: "#34c759",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};
