import type { CurriculumTopic, PillarMetadata } from "./types";

export const PILLAR_METADATA: PillarMetadata[] = [
  {
    pillar: "concepts",
    title: "1. Core Frontend Concepts",
    shortDesc: "In-depth theoretical foundations, browser runtime, CSS layout engines, DOM APIs, and rendering paradigms.",
    iconName: "Layers",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    topicsCount: 10,
  },
  {
    pillar: "javascript",
    title: "2. JavaScript Coding Drills",
    shortDesc: "Algorithmic utility implementations, async control flow, closures, polyfills, and higher-order functions.",
    iconName: "FileCode",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    topicsCount: 11,
  },
  {
    pillar: "react",
    title: "3. React Component Challenges",
    shortDesc: "Production-grade UI components, accessible patterns (WAI-ARIA), state modeling, and keyboard interactions.",
    iconName: "Component",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    topicsCount: 9,
  },
  {
    pillar: "system_design",
    title: "4. Frontend System Design",
    shortDesc: "Staff-level architecture: large-scale client design, caching, virtualization, SSR/streaming, and real-time collaboration.",
    iconName: "Network",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    topicsCount: 6,
  },
];

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  // ==========================================
  // PILLAR 1: CORE FRONTEND CONCEPTS
  // ==========================================
  {
    id: "concept-data-structures",
    pillar: "concepts",
    title: "Data Structures in Frontend",
    category: "Computer Science",
    description: "Arrays, Maps, Sets, Stacks, Queues, and Trees in JavaScript engines (V8 hidden classes, Hash Maps vs Objects, WeakMap memory management).",
    difficulty: "senior",
    keyConcepts: ["V8 hidden classes", "Map vs Object performance", "WeakMap & WeakSet GC", "Tree traversal in DOM"],
    bigTechContext: "Tested at Google & Meta to assess memory efficiency and optimal lookup choices for complex state and cache stores.",
  },
  {
    id: "concept-html-semantics-forms",
    pillar: "concepts",
    title: "HTML Semantics & Form Architecture",
    category: "HTML",
    description: "Accessible landmark tags, form serialization, Constraint Validation API, multipart data handling, and native browser form submission.",
    difficulty: "mid",
    keyConcepts: ["Semantic landmarks (<main>, <nav>, <article>)", "Constraint Validation API", "FormData & multipart/form-data", "Preventing double-submission"],
    bigTechContext: "Critical at Airbnb & Dropbox where forms handle sensitive transactions and checkout flows with zero tolerance for validation bugs.",
  },
  {
    id: "concept-css-box-flex-grid",
    pillar: "concepts",
    title: "Modern CSS: Box Model, Flexbox & Grid",
    category: "CSS",
    description: "Content-box vs border-box, specificity hierarchy (:where, :is, cascade layers @layer), stacking context, Flexbox alignment, and CSS Grid layout algorithms.",
    difficulty: "senior",
    keyConcepts: ["Stacking contexts & z-index isolation", "Cascade layers (@layer)", "Subgrid & Grid template areas", "CSS Custom Properties (design tokens)"],
    bigTechContext: "Interviewers at OpenAI and Meta expect pixel-perfect responsiveness without bloated utility classes or accidental layout shifts (CLS).",
  },
  {
    id: "concept-js-closures-event-loop",
    pillar: "concepts",
    title: "JavaScript Runtime: Closures & Event Loop",
    category: "JavaScript",
    description: "Lexical scoping, memory retention via closures, Call Stack, Microtask queue (Promises/queueMicrotask), Macrotask queue (setTimeout), and execution order.",
    difficulty: "senior",
    keyConcepts: ["Execution context & Lexical environment", "Microtask vs Macrotask prioritization", "Memory leaks through uncollected closures", "this binding (implicit, explicit, arrow)"],
    bigTechContext: "The #1 filter at OpenAI & Meta: testing whether you truly understand why high-frequency updates tank rendering or trigger UI freezing.",
  },
  {
    id: "concept-dom-manipulation-delegation",
    pillar: "concepts",
    title: "DOM Internals & Event Delegation",
    category: "Browser DOM",
    description: "DOM tree traversal, layout thrashing (forced synchronous reflow), DocumentFragment batching, and event bubbling/capturing phases for delegation.",
    difficulty: "senior",
    keyConcepts: ["Event bubbling vs capturing", "Event delegation (e.target vs e.currentTarget)", "Layout thrashing & read/write batching", "Passive event listeners"],
    bigTechContext: "Essential at Google and Airbnb for infinite scroll feeds and virtualized tables where thousands of listeners would exhaust device RAM.",
  },
  {
    id: "concept-runtime-apis-fetch",
    pillar: "concepts",
    title: "Browser Runtime APIs: Timer & Fetch",
    category: "Web APIs",
    description: "setTimeout/setInterval drift, requestAnimationFrame vs timers, Fetch API streaming, AbortController timeout and cancellation mechanics.",
    difficulty: "senior",
    keyConcepts: ["requestAnimationFrame (rAF) sync", "Timer clamping in background tabs", "AbortSignal.timeout() and manual abort", "ReadableStream body consumption"],
    bigTechContext: "Tested heavily at OpenAI and xAI when implementing live LLM streaming token readers with real-time abort capabilities.",
  },
  {
    id: "concept-accessibility-a11y",
    pillar: "concepts",
    title: "Web Accessibility (a11y) & Focus Trapping",
    category: "Accessibility",
    description: "WAI-ARIA roles, live regions (aria-live), keyboard navigation standards, screen reader testing, and accessible modal focus trapping.",
    difficulty: "staff",
    keyConcepts: ["WAI-ARIA 1.2 specifications", "Focus trapping & restoring focus", "aria-expanded, aria-controls, aria-haspopup", "WCAG 2.2 AAA color contrast"],
    bigTechContext: "Mandatory at Google, Meta, and Palantir where enterprise compliance and public lawsuits mandate strict WCAG AA/AAA compliance.",
  },
  {
    id: "concept-react-internals-state",
    pillar: "concepts",
    title: "React Architecture: Hooks & State Design",
    category: "React",
    description: "Fiber reconciliation tree, concurrent rendering, batching in React 18/19, hook closure traps, controlled vs uncontrolled inputs, and useActionState.",
    difficulty: "senior",
    keyConcepts: ["Fiber node structure & dual buffering", "Automatic batching", "Stale closures in useEffect/useCallback", "Derived state vs synchronized state"],
    bigTechContext: "Meta created React — expect deep-dive questions into how reconciliation works and how to eliminate unnecessary re-renders.",
  },
  {
    id: "concept-rendering-ssr-ssg-hydration",
    pillar: "concepts",
    title: "Rendering Paradigms: SSR, CSR, SSG & Hydration",
    category: "Architecture",
    description: "Client-side rendering vs Server-side rendering vs Static generation vs Incremental Static Regeneration (ISR), selective hydration, and React Server Components.",
    difficulty: "staff",
    keyConcepts: ["Hydration mismatch causes & fixes", "Streaming SSR with Suspense", "React Server Components (RSC) boundary", "Core Web Vitals impact (TTFB, LCP, INP)"],
    bigTechContext: "Airbnb & Next.js/Vercel standard: deciding exact rendering strategies to balance SEO, Time-to-Interactive, and edge hosting costs.",
  },
  {
    id: "concept-state-management",
    pillar: "concepts",
    title: "State Management & Server Cache Architecture",
    category: "Architecture",
    description: "State taxonomy (Server state, URL state, Form state, Ephemeral UI state, Global app state). Context vs Zustand vs TanStack Query.",
    difficulty: "senior",
    keyConcepts: ["State colocation principle", "Context re-render pitfalls", "Optimistic mutation rollback", "Cache invalidation & stale-while-revalidate"],
    bigTechContext: "Dropbox & Palantir look for senior engineers who avoid putting everything in global stores, leveraging URL params and TanStack Query properly.",
  },

  // ==========================================
  // PILLAR 2: JAVASCRIPT CODING QUESTIONS
  // ==========================================
  {
    id: "js-debounce",
    pillar: "javascript",
    title: "Implement Debounce",
    category: "Utilities & Async",
    description: "Write a debounce function that delays invoking func until after wait milliseconds have elapsed. Support leading/trailing options and cancel/flush methods.",
    difficulty: "mid",
    keyConcepts: ["Timer management", "Preserving this context & arguments", "Leading vs Trailing execution", "Cancellation token"],
    bigTechContext: "The most classic frontend coding question, asked at Meta, Google, OpenAI, and Airbnb.",
    starterCode: `/**
 * @param {Function} func
 * @param {number} wait
 * @param {Object} [options]
 * @param {boolean} [options.leading=false]
 * @param {boolean} [options.trailing=true]
 * @returns {Function}
 */
export function debounce(func, wait, options = {}) {
  // Your code here
}
`,
  },
  {
    id: "js-throttle",
    pillar: "javascript",
    title: "Implement Throttle",
    category: "Utilities & Async",
    description: "Create a throttle function that restricts calling a function to at most once per wait interval. Support leading and trailing invocations.",
    difficulty: "senior",
    keyConcepts: ["Timestamp comparison vs setTimeout", "Trailing call queuing", "Context & argument retention", "Cancellation"],
    bigTechContext: "Crucial for scroll and resize handlers in performance-sensitive apps like Airbnb and Pinterest.",
    starterCode: `/**
 * @param {Function} func
 * @param {number} wait
 * @param {Object} [options]
 * @param {boolean} [options.leading=true]
 * @param {boolean} [options.trailing=true]
 * @returns {Function}
 */
export function throttle(func, wait, options = {}) {
  // Your code here
}
`,
  },
  {
    id: "js-promise-all",
    pillar: "javascript",
    title: "Implement Promise.all Polyfill",
    category: "Async & Promises",
    description: "Implement a custom version of Promise.all from scratch. Handle non-promise items, maintain input order in the resolved array, and reject on first error.",
    difficulty: "senior",
    keyConcepts: ["Promise constructor mechanics", "Order preservation vs resolution timing", "Counting resolved values", "Early rejection"],
    bigTechContext: "Standard interview question at Meta, Google, and Dropbox for async JavaScript proficiency.",
    starterCode: `/**
 * @param {Array<any>} iterable
 * @returns {Promise<Array<any>>}
 */
export function promiseAll(iterable) {
  // Your code here
}
`,
  },
  {
    id: "js-flatten",
    pillar: "javascript",
    title: "Flatten Array / Nested Object",
    category: "Data Structures",
    description: "Implement a deep flatten utility for arrays with depth control, and optionally handle arbitrary nested object structures into dot-notation paths.",
    difficulty: "mid",
    keyConcepts: ["Recursion vs iterative stack", "Depth decrement", "Array.isArray detection", "Object path flattening"],
    bigTechContext: "Asked at Google & Palantir to evaluate recursive vs iterative data manipulation skills.",
    starterCode: `/**
 * @param {Array<any>} arr
 * @param {number} [depth=1]
 * @returns {Array<any>}
 */
export function flatten(arr, depth = 1) {
  // Your code here
}
`,
  },
  {
    id: "js-classnames",
    pillar: "javascript",
    title: "Implement classnames (clsx)",
    category: "Utilities",
    description: "Implement the utility function `classnames` that joins classes conditionally from strings, arrays, numbers, and key-value objects.",
    difficulty: "mid",
    keyConcepts: ["Argument spread & typeof checks", "Handling truthy/falsy values", "Recursion for nested arrays", "Performance string concatenation"],
    bigTechContext: "Standard UI foundation utility used across every React and modern web codebase.",
    starterCode: `/**
 * @param {...any} args
 * @returns {string}
 */
export function classnames(...args) {
  // Your code here
}
`,
  },
  {
    id: "js-deep-clone",
    pillar: "javascript",
    title: "Implement Deep Clone",
    category: "Data Structures",
    description: "Deeply clone a JavaScript value supporting nested objects, arrays, Dates, RegExps, Maps, Sets, and handling circular references with WeakMap.",
    difficulty: "senior",
    keyConcepts: ["WeakMap for circular reference detection", "Type discrimination (Date, RegExp, Map, Set)", "Object.getOwnPropertySymbols", "Prototype retention"],
    bigTechContext: "Frequently asked at Meta and OpenAI to test advanced JavaScript type and memory handling.",
    starterCode: `/**
 * @param {*} value
 * @returns {*}
 */
export function deepClone(value, map = new WeakMap()) {
  // Your code here
}
`,
  },
  {
    id: "js-event-emitter",
    pillar: "javascript",
    title: "Implement Event Emitter",
    category: "Design Patterns",
    description: "Create an EventEmitter class with `on`, `off`, `emit`, and `once` methods. Ensure unsubscribe functions return cleanly without memory leaks.",
    difficulty: "senior",
    keyConcepts: ["Observer pattern", "Subscription cleanup closures", "Handling multiple handlers per event", "Exception isolation"],
    bigTechContext: "Essential at OpenAI and Dropbox for decoupled component communication and custom streaming protocols.",
    starterCode: `export class EventEmitter {
  constructor() {
    // Your code here
  }

  on(eventName, listener) {
    // Return { unsubscribe: () => void }
  }

  off(eventName, listener) {
    // Your code here
  }

  emit(eventName, ...args) {
    // Your code here
  }

  once(eventName, listener) {
    // Your code here
  }
}
`,
  },
  {
    id: "js-map-async-limit",
    pillar: "javascript",
    title: "Map Async with Concurrency Limit",
    category: "Async & Concurrency",
    description: "Implement `mapAsyncLimit(items, limit, asyncFn)` that executes an async mapper across an array with an exact max concurrency pool constraint.",
    difficulty: "staff",
    keyConcepts: ["Concurrency pool architecture", "Worker queue / promise chaining", "Preserving output order", "Graceful error aggregation"],
    bigTechContext: "Tested at OpenAI and Palantir for high-throughput batching, API rate-limiting, and asset preloading.",
    starterCode: `/**
 * @template T, R
 * @param {Array<T>} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} asyncFn
 * @returns {Promise<Array<R>>}
 */
export function mapAsyncLimit(items, limit, asyncFn) {
  // Your code here
}
`,
  },
  {
    id: "js-deep-equal",
    pillar: "javascript",
    title: "Implement Deep Equal",
    category: "Data Structures",
    description: "Compare two values to determine if they are deeply equivalent. Handle primitives, NaN, Dates, RegExps, Arrays, and Plain Objects with cyclic protection.",
    difficulty: "senior",
    keyConcepts: ["Object.is equality (NaN === NaN)", "Key length check & recursive inspection", "Type checking edge cases", "Avoiding prototype pollution"],
    bigTechContext: "Used in test libraries, React memo comparison selectors, and state stores at Google and Meta.",
    starterCode: `/**
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function deepEqual(a, b) {
  // Your code here
}
`,
  },
  {
    id: "js-memoize",
    pillar: "javascript",
    title: "Implement Memoize",
    category: "Functional Programming",
    description: "Create a function `memoize(fn, resolver)` that caches the results of function calls based on custom serialization or argument keys.",
    difficulty: "mid",
    keyConcepts: ["Closures for cache storage", "Custom cache resolver", "Primitive vs Object argument keys", "LRU cache extension"],
    bigTechContext: "Standard at Airbnb and Meta for selector optimization and expensive computed state.",
    starterCode: `/**
 * @param {Function} fn
 * @param {Function} [resolver]
 * @returns {Function}
 */
export function memoize(fn, resolver) {
  // Your code here
}
`,
  },
  {
    id: "js-curry",
    pillar: "javascript",
    title: "Implement Curry",
    category: "Functional Programming",
    description: "Write a `curry` function that transforms a function with multiple arguments into a chain of functions with arity matching fn.length.",
    difficulty: "mid",
    keyConcepts: ["Function.prototype.length (arity)", "Higher-order functions", "Argument accumulation via closure", "Partial application"],
    bigTechContext: "Asked at Dropbox and Meta to verify pure functional JavaScript mastery.",
    starterCode: `/**
 * @param {Function} fn
 * @returns {Function}
 */
export function curry(fn) {
  // Your code here
}
`,
  },

  // ==========================================
  // PILLAR 3: REACT COMPONENT QUESTIONS
  // ==========================================
  {
    id: "react-todo-list",
    pillar: "react",
    title: "Todo List with Filters & Keyboard a11y",
    category: "UI Components",
    description: "Build an accessible Todo List supporting adding, toggling, editing, deleting, active/completed filters, and full keyboard navigation with focus management.",
    difficulty: "mid",
    keyConcepts: ["State normalization", "Optimistic state updates", "a11y aria-label on actions", "Enter/Escape keyboard shortcuts"],
    bigTechContext: "Common junior/mid frontend interview challenge that reveals clean state modeling vs messy code.",
  },
  {
    id: "react-contact-form",
    pillar: "react",
    title: "Contact Form with Real-time Validation",
    category: "Forms & a11y",
    description: "Build a robust contact form with email, subject, message, real-time touched validation, accessible error announcements (`aria-describedby`), and disabled submit.",
    difficulty: "mid",
    keyConcepts: ["Controlled inputs & touched state", "aria-invalid & aria-errormessage", "Preventing multi-click submission", "Loading feedback"],
    bigTechContext: "Tested at Dropbox and Airbnb for bulletproof form UX.",
  },
  {
    id: "react-job-board",
    pillar: "react",
    title: "Job Board with Infinite Pagination",
    category: "API & Async UI",
    description: "Build a Hacker News / GitHub style Job Board that fetches job postings, displays metadata, and supports 'Load More' or Infinite Scroll with skeleton states.",
    difficulty: "senior",
    keyConcepts: ["IntersectionObserver or scroll sentinel", "AbortController on component unmount", "Deduplicating incoming items", "Empty and error boundary recovery"],
    bigTechContext: "Standard interview question at Meta and OpenAI for async data orchestration.",
  },
  {
    id: "react-accordion",
    pillar: "react",
    title: "WAI-ARIA Accessible Accordion",
    category: "Design System & a11y",
    description: "Create an accessible Accordion component supporting single-expand or multi-expand modes, smooth CSS height transition, and keyboard ArrowUp/ArrowDown/Home/End navigation.",
    difficulty: "senior",
    keyConcepts: ["aria-expanded & aria-controls linkage", "Keyboard focus roving index", "Height 0 to auto CSS animation", "Compound component API"],
    bigTechContext: "Tested at Airbnb, Apple, and Google design system teams.",
  },
  {
    id: "react-image-carousel",
    pillar: "react",
    title: "Image Carousel with Touch Swiping & Autoplay",
    category: "Interactive UI",
    description: "Create a carousel with forward/backward buttons, dot indicators, touch drag gestures, keyboard arrow control, and autoplay that pauses on hover/focus.",
    difficulty: "senior",
    keyConcepts: ["Touch events (touchstart, touchmove, touchend)", "requestAnimationFrame smooth slide", "Pause-on-hover & focus-within", "Image preloading & alt text"],
    bigTechContext: "Very popular at Airbnb and Pinterest for hero visual components.",
  },
  {
    id: "react-data-table",
    pillar: "react",
    title: "Data Table with Sorting, Search & Virtualization",
    category: "Data UI",
    description: "Implement a high-performance data table that can render 10,000+ rows with column sorting (asc/desc), global search, and window virtualization.",
    difficulty: "staff",
    keyConcepts: ["Virtual windowing (DOM node recycling)", "Layout thrashing elimination", "Stable multi-column sort comparator", "ARIA table role semantics"],
    bigTechContext: "Palantir and Meta standard: testing whether you can render massive datasets without dropping below 60fps.",
  },
  {
    id: "react-file-explorer",
    pillar: "react",
    title: "Recursive File Explorer Tree",
    category: "Tree Data & UI",
    description: "Build a VS Code style file tree with nested folders, expand/collapse, add file/folder in specific directory, and keyboard tree navigation.",
    difficulty: "senior",
    keyConcepts: ["Recursive component rendering", "Tree data structure immutability", "aria-expanded on treeitem nodes", "Active node selection highlight"],
    bigTechContext: "Asked at Dropbox, OpenAI, and GitHub for hierarchal navigation components.",
  },
  {
    id: "react-tic-tac-toe",
    pillar: "react",
    title: "Tic-Tac-Toe with Time Travel Undo",
    category: "State & Algorithms",
    description: "Build Tic-Tac-Toe with dynamic grid size (NxN), winner calculation, draw detection, and time-travel move history with undo/redo.",
    difficulty: "mid",
    keyConcepts: ["O(1) win condition check with row/col sums", "Immutable state history stack", "Turn alternations", "Accessible game status announce"],
    bigTechContext: "Classic React documentation challenge expanded to test senior state modeling and algorithmic efficiency.",
  },
  {
    id: "react-nested-checkboxes",
    pillar: "react",
    title: "Nested Checkboxes (Tri-state Indeterminate)",
    category: "Complex State & DOM",
    description: "Create a hierarchical permission checkbox tree where checking a parent checks all children, unchecking children toggles the parent to indeterminate state.",
    difficulty: "senior",
    keyConcepts: ["HTMLInputElement indeterminate DOM property", "Bottom-up and top-down tree state synchronization", "Handling deep multi-level hierarchies", "Accessible keyboard checkbox groups"],
    bigTechContext: "Common at enterprise companies like Palantir, Google Cloud, and Salesforce.",
  },

  // ==========================================
  // PILLAR 4: FRONTEND SYSTEM DESIGN
  // ==========================================
  {
    id: "sd-news-feed",
    pillar: "system_design",
    title: "Design a News Feed (Facebook / Twitter)",
    category: "High-Scale Feed",
    description: "Design a high-scale infinite scrolling social feed. Architect data fetching, DOM virtualization, image lazy-loading, caching, and optimistic like/comment interactions.",
    difficulty: "staff",
    keyConcepts: ["Infinite scroll windowing", "Client-side feed cache (Normalized cache)", "Optimistic UI mutations & rollback", "Image decoding off-main-thread"],
    bigTechContext: "The archetypal Meta front-end system design question.",
  },
  {
    id: "sd-autocomplete",
    pillar: "system_design",
    title: "Design Autocomplete / Search Typeahead",
    category: "Search & Caching",
    description: "Design a global search box with instant dropdown suggestions. Solve debounce timing, stale request race conditions, client-side trie/LRU caching, and accessibility.",
    difficulty: "staff",
    keyConcepts: ["Race condition prevention (AbortController / timestamp tokens)", "Client-side LRU cache + Prefetching", "Keyboard ARIA combobox pattern", "Analytics beacon batching"],
    bigTechContext: "Universal question asked at Google, OpenAI, Amazon, and Meta.",
  },
  {
    id: "sd-airbnb-search",
    pillar: "system_design",
    title: "Design Airbnb Search & Interactive Map",
    category: "Maps & Spatial UI",
    description: "Design a property search page with dynamic multi-filter sidebar, two-way sync between listing cards and map markers, and URL query persistence.",
    difficulty: "staff",
    keyConcepts: ["URL state synchronization", "Map viewport bounding box query debouncing", "Hover state synchronization without re-rendering the whole map", "Mobile bottom sheet responsiveness"],
    bigTechContext: "Directly mirrors Airbnb's flagship interview question for Senior/Staff roles.",
  },
  {
    id: "sd-ecommerce-amazon",
    pillar: "system_design",
    title: "Design E-commerce Product Page (Amazon)",
    category: "E-Commerce",
    description: "Design a high-converting product detail page with image zoom gallery, SKU variant selector (color/size/inventory), real-time stock indicators, and instant cart drawer.",
    difficulty: "staff",
    keyConcepts: ["SKU matrix combinatorics & disabled variant graph", "SSR for SEO + selective hydration for buy box", "Optimistic cart mutations with server reconciliation", "Image zoom canvas vs CSS translate"],
    bigTechContext: "Standard at Amazon, Shopify, and modern e-commerce leaders.",
  },
  {
    id: "sd-pinterest-masonry",
    pillar: "system_design",
    title: "Design Pinterest Infinite Masonry Grid",
    category: "Layout Engine & Virtualization",
    description: "Design a waterfall/masonry layout where cards have dynamic heights. Solve column height balancing, infinite scroll without layout shifts (CLS), and memory recycling.",
    difficulty: "staff",
    keyConcepts: ["Greedy column placement algorithm", "Pre-calculating aspect ratios from backend", "2D Virtualization (recycling out-of-viewport cards)", "Fast smooth scroll 120Hz preservation"],
    bigTechContext: "Flagship question at Pinterest and Instagram for advanced layout performance.",
  },
  {
    id: "sd-google-docs",
    pillar: "system_design",
    title: "Design Google Docs (Collaborative Rich Text)",
    category: "Real-time Collaboration",
    description: "Design a browser-based collaborative rich text editor. Architect document data models, conflict resolution (OT vs CRDT), real-time multi-user cursor sync, and undo/redo stacks.",
    difficulty: "staff",
    keyConcepts: ["Operational Transformation (OT) vs CRDTs (Yjs/Automerge)", "Custom canvas/DOM rendering engine", "Presence protocol (WebSockets / WebRTC)", "Decoupled undo/redo per client session"],
    bigTechContext: "The pinnacle Staff Frontend design interview question at Google, Notion, and Figma.",
  },
];
