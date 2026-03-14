import { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'homily-workshop-session'

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function mergeWithInitial(saved, initial) {
  // Deep merge: ensure any new fields added to initialState are present
  // even if the saved session predates them
  const merged = { ...initial }
  for (const key of Object.keys(saved)) {
    if (key in initial && typeof initial[key] === 'object' && !Array.isArray(initial[key]) && initial[key] !== null) {
      merged[key] = { ...initial[key], ...saved[key] }
    } else if (key in initial) {
      merged[key] = saved[key]
    }
  }
  return merged
}

const initialState = {
  // Step 1
  date: '',
  tradition: 'Catholic',
  occasion: 'Sunday Mass',
  liturgicalSeason: '',
  sundayName: '',
  liturgicalYear: '',
  feastName: '',         // for Holy Day / Feast occasions

  // Step 2 reading mode
  translationDefault: 'NABRE',   // 'NABRE' | 'CEV' | 'GNT'
  pickerMode: 'standard',        // 'standard' | 'wedding' | 'funeral'

  // Step 2
  readings: [],
  selectedReadings: {
    first: true,
    psalm: true,
    second: false,
    gospel: true,
  },

  // Step 3 - Lectio
  lectioNotes: {
    lectio: '',
    meditatio: '',
    oratio: '',
    contemplatio: '',
    theTurn: '',   // What surprised you — the homiletical hinge
  },

  // Step 4 - Story
  personalStory: '',
  storyConnection: '',
  congregationMoment: '',   // Who specifically are you preaching to this week

  // Step 5 - Synthesis
  synthesis: {
    selectedTheme: '',           // confirmed theme
    themeStatement: '',          // one-sentence "this homily is really about..."
    coreInsight: '',             // the key Gospel insight to preach
    congregationNeed: '',        // what the people need to hear
    gospelFirstConnection: '',   // connection between Gospel and First Reading
    verbumClips: [],             // [{ headline, keyword, body, source, type }]
  },

  // Step 5 - The Plan
  homilyAim: {
    action: '',    // "I want my congregation to ___"
    because: '',   // "___ because ___"
  },

  // Step 6 - Direction (kept for backward compat, planning fields)
  tone: '',
  theme: '',
  audience: 'parish',
  currentEvents: '',
  missionFocus: '',

  // Step 7 - Workshop
  framework: {
    openingStory: '',
    preview: '',
    gospelAnchor: '',    // one-sentence Gospel truth
    gospelInsight: '',   // language/context insight
    gospelBridge: '',    // bridge to mission/current moment
    mission: '',
    closeLoop: '',
  },

  // Step 8 - Homily
  finalHomily: '',
  homilyPath: '',        // 'self' | 'frame' | 'draft'
  notes: '',

  // Navigation
  currentStep: 1,
  completedSteps: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATE_INFO':
      return { ...state, ...action.payload }
    case 'SET_READINGS':
      return { ...state, readings: action.payload }
    case 'TOGGLE_READING':
      return {
        ...state,
        selectedReadings: {
          ...state.selectedReadings,
          [action.id]: !state.selectedReadings[action.id],
        },
      }
    case 'SET_LECTIO_NOTE':
      return {
        ...state,
        lectioNotes: { ...state.lectioNotes, [action.phase]: action.value },
      }
    case 'SET_STORY':
      return { ...state, personalStory: action.value }
    case 'SET_STORY_CONNECTION':
      return { ...state, storyConnection: action.value }
    case 'SET_CONGREGATION_MOMENT':
      return { ...state, congregationMoment: action.value }
    case 'SET_HOMILY_AIM':
      return { ...state, homilyAim: { ...state.homilyAim, ...action.payload } }
    case 'SET_SYNTHESIS':
      return {
        ...state,
        synthesis: { ...state.synthesis, ...action.payload },
      }
    case 'ADD_VERBUM_CLIP':
      return {
        ...state,
        synthesis: {
          ...state.synthesis,
          verbumClips: [...state.synthesis.verbumClips, action.clip],
        },
      }
    case 'REMOVE_VERBUM_CLIP':
      return {
        ...state,
        synthesis: {
          ...state.synthesis,
          verbumClips: state.synthesis.verbumClips.filter((_, i) => i !== action.index),
        },
      }
    case 'PATCH_READING_TEXT':
      return {
        ...state,
        readings: state.readings.map(r =>
          r.id === action.id ? { ...r, text: action.text } : r
        ),
      }
    case 'SET_TRANSLATION':
      return { ...state, translationDefault: action.value }
    case 'SET_PICKER_MODE':
      return { ...state, pickerMode: action.value }
    case 'SET_DIRECTION':
      return { ...state, ...action.payload }
    case 'SET_FRAMEWORK_SECTION':
      return {
        ...state,
        framework: { ...state.framework, [action.section]: action.value },
      }
    case 'SET_FINAL_HOMILY':
      return { ...state, finalHomily: action.value }
    case 'SET_HOMILY_PATH':
      return { ...state, homilyPath: action.value }
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.step }
    case 'COMPLETE_STEP': {
      const completed = state.completedSteps.includes(action.step)
        ? state.completedSteps
        : [...state.completedSteps, action.step]
      return {
        ...state,
        completedSteps: completed,
        currentStep: action.nextStep ?? state.currentStep,
      }
    }
    case 'LOAD_SEED':
      return { ...initialState, ...action.payload }
    case 'RESET':
      return { ...initialState }
    case 'CLEAR_SESSION':
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      return { ...initialState }
    default:
      return state
  }
}

const HomilyContext = createContext(null)

export function HomilyProvider({ children }) {
  const saved = loadSavedState()
  const startState = saved ? mergeWithInitial(saved, initialState) : initialState

  const [state, dispatch] = useReducer(reducer, startState)

  // Auto-save to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage quota exceeded or unavailable — fail silently
    }
  }, [state])

  return (
    <HomilyContext.Provider value={{ state, dispatch }}>
      {children}
    </HomilyContext.Provider>
  )
}

export function useHomily() {
  const ctx = useContext(HomilyContext)
  if (!ctx) throw new Error('useHomily must be used within HomilyProvider')
  return ctx
}
