// server/src/llm/adapter.ts
import { env } from "../env";
import type { GenerateQuizResponse, QuizQuestion } from "../schema";
import { GenerateQuizResponseSchema } from "../schema";
import { OpenAIProvider } from "./providers/openai";

export type QuizGenInput = {
  topic: string;
  numQuestions: number;
  difficulty: "easy" | "mixed" | "hard";
};

export type QuizGenOutput = GenerateQuizResponse;

export interface LLMProvider {
  generateQuiz(input: QuizGenInput): Promise<QuizGenOutput>;
}

class LocalMockProvider implements LLMProvider {
  async generateQuiz(input: QuizGenInput): Promise<QuizGenOutput> {
    const { topic, numQuestions, difficulty } = input;
    const normalized = topic.trim().toLowerCase();

    const canned = getCannedQuestions(normalized);
    const questions: QuizQuestion[] =
      canned?.slice(0, numQuestions) ?? buildGeneric(topic, numQuestions);

    const payload: GenerateQuizResponse = {
      topic,
      difficulty,
      questions,
    };

    // Final guardrail: validate to keep parity with real provider
    return GenerateQuizResponseSchema.parse(payload);
  }
}

function getProvider(): LLMProvider {
  if (env.OPENAI_API_KEY) return new OpenAIProvider(env.OPENAI_API_KEY);
  return new LocalMockProvider();
}

export async function generateQuiz(
  input: QuizGenInput
): Promise<QuizGenOutput> {
  const provider = getProvider();
  return provider.generateQuiz(input);
}

/* -------------------- Helpers: Mock Data -------------------- */

function buildGeneric(topic: string, n: number): QuizQuestion[] {
  return Array.from({ length: n }).map((_, i) => {
    const correctIndex = i % 4;
    const base = i + 1;
    const opts = [
      `${topic} core idea ${base}`,
      `Common pitfall ${base}`,
      `Unrelated ${base}`,
      `Historical note ${base}`,
    ];
    // rotate so correctIndex is at `correctIndex`
    const correct = `${topic} core idea ${base}`;
    const rotated = rotateKeeping(correct, opts, correctIndex);
    return {
      id: `q${base}`,
      question: `Which option best matches the topic "${topic}" in item #${base}?`,
      options: rotated,
      correctIndex,
      explanation: `The correct choice aligns most directly with "${topic}" for this item.`,
    };
  });
}

function rotateKeeping(
  correct: string,
  options: string[],
  correctIndex: number
) {
  const dedup = Array.from(new Set(options));
  const without = dedup.filter((o) => o !== correct);
  const front = without.slice(0, correctIndex);
  const back = without.slice(correctIndex);
  return [...front, correct, ...back].slice(0, 4);
}

function getCannedQuestions(normalizedTopic: string): QuizQuestion[] | null {
  if (["frontend", "front-end"].includes(normalizedTopic)) {
    return cannedFrontend;
  }
  if (["react", "reactjs", "react.js"].includes(normalizedTopic)) {
    return cannedReact;
  }
  if (["javascript", "js", "node", "node.js"].includes(normalizedTopic)) {
    return cannedJavaScript;
  }
  return null;
}

const cannedFrontend: QuizQuestion[] = [
  {
    id: "q1",
    question: "Which HTML element is semantic for the main content of a page?",
    options: [
      "<main>",
      '<div id="main">',
      '<section class="main">',
      "<article>",
    ],
    correctIndex: 0,
    explanation: "<main> conveys intent to user agents and assistive tech.",
  },
  {
    id: "q2",
    question: "Which property triggers a new stacking context in CSS?",
    options: [
      "position: static",
      "z-index: auto",
      "position: relative",
      "position: fixed",
    ],
    correctIndex: 3,
    explanation: "position: fixed establishes a new stacking context.",
  },
  {
    id: "q3",
    question: "What does CSS Grid excel at compared to Flexbox?",
    options: [
      "One-dimensional layouts",
      "Two-dimensional layouts",
      "Animations",
      "Typography",
    ],
    correctIndex: 1,
    explanation: "Grid is designed for two-dimensional row/column layouts.",
  },
  {
    id: "q4",
    question: "Which HTTP status is best for client validation errors?",
    options: [
      "200 OK",
      "400 Bad Request",
      "401 Unauthorized",
      "500 Internal Server Error",
    ],
    correctIndex: 1,
    explanation: "400 indicates malformed input from the client.",
  },
  {
    id: "q5",
    question: "Which attribute improves image loading performance?",
    options: ['loading="lazy"', 'role="img"', "defer", "prefetch"],
    correctIndex: 0,
    explanation: 'loading="lazy" defers off-screen image loading.',
  },
  {
    id: "q6",
    question: "Which API is best for prefetching over HTTP/2?",
    options: [
      "<meta http-equiv>",
      '<link rel="preload">',
      '<link rel="prefetch">',
      "Service Worker",
    ],
    correctIndex: 2,
    explanation: "prefetch hints low-priority future navigation resources.",
  },
  {
    id: "q7",
    question: "Which header enables cross-origin resource sharing?",
    options: [
      "X-Frame-Options",
      "Content-Security-Policy",
      "Access-Control-Allow-Origin",
      "ETag",
    ],
    correctIndex: 2,
    explanation: "Access-Control-Allow-Origin controls CORS access.",
  },
  {
    id: "q8",
    question: "What improves perceived performance during route changes?",
    options: [
      "Blocking all JS",
      "Skeleton UIs",
      "Large GIFs",
      "Inline scripts",
    ],
    correctIndex: 1,
    explanation: "Skeleton UIs keep users engaged while content loads.",
  },
  {
    id: "q9",
    question: "Which tool analyzes Core Web Vitals locally?",
    options: ["curl", "Lighthouse", "Webpack", "tmux"],
    correctIndex: 1,
    explanation: "Lighthouse reports LCP, CLS, and other vitals.",
  },
  {
    id: "q10",
    question: "Which practice prevents XSS in client rendering?",
    options: [
      "eval()",
      "InnerHTML with user data",
      "Escaping/encoding output",
      "Disabling CSP",
    ],
    correctIndex: 2,
    explanation: "Proper escaping/encoding mitigates script injection.",
  },
];

const cannedReact: QuizQuestion[] = [
  {
    id: "q1",
    question: "What does React.memo optimize?",
    options: [
      "Avoids re-render if props unchanged",
      "Bundles code for production",
      "Manages server state",
      "Creates context providers",
    ],
    correctIndex: 0,
    explanation: "React.memo memoizes component output by props.",
  },
  {
    id: "q2",
    question: "Which hook is ideal for caching expensive calculations?",
    options: ["useRef", "useMemo", "useEffect", "useReducer"],
    correctIndex: 1,
    explanation: "useMemo memoizes derived values between renders.",
  },
  {
    id: "q3",
    question: "What should go in useEffect dependency array?",
    options: [
      "All variables in file",
      "Only props",
      "Values used inside effect",
      "Nothing ever",
    ],
    correctIndex: 2,
    explanation: "Include all values referenced inside the effect.",
  },
  {
    id: "q4",
    question: "Which library is mainstream for server state?",
    options: ["Redux Toolkit", "React Query", "MobX", "Recoil"],
    correctIndex: 1,
    explanation: "React Query (TanStack Query) manages server cache elegantly.",
  },
  {
    id: "q5",
    question: "Which pattern avoids prop drilling?",
    options: ["Context", "Refs", "Portals", "Fragments"],
    correctIndex: 0,
    explanation: "Context shares data without threading props.",
  },
  {
    id: "q6",
    question: "What does Suspense primarily handle?",
    options: [
      "Animations",
      "Error boundaries",
      "Data fetching fallback",
      "Routing",
    ],
    correctIndex: 2,
    explanation: "Suspense shows fallbacks while resources load.",
  },
  {
    id: "q7",
    question: "Key requirement for list rendering keys?",
    options: [
      "Index is always fine",
      "Keys must be unique and stable",
      "Strings only",
      "Numbers only",
    ],
    correctIndex: 1,
    explanation: "Stable unique keys help React reconcile efficiently.",
  },
  {
    id: "q8",
    question: "Which solves stale closures in event handlers?",
    options: [
      "useId",
      "useSyncExternalStore",
      "useRef to hold latest value",
      "memoizing JSX",
    ],
    correctIndex: 2,
    explanation: "Refs can hold mutable current values without rerenders.",
  },
  {
    id: "q9",
    question: "What causes unnecessary re-renders most commonly?",
    options: [
      "Pure components",
      "Inline object/array props",
      "Keys",
      "Fragments",
    ],
    correctIndex: 1,
    explanation: "New references each render trickle re-renders.",
  },
  {
    id: "q10",
    question: "How to derive state from props safely?",
    options: [
      "setState in render",
      "useEffect without deps",
      "useMemo + controlled props",
      "getDerivedStateFromProps",
    ],
    correctIndex: 2,
    explanation: "Prefer derived values via memoization, not duplicated state.",
  },
];

const cannedJavaScript: QuizQuestion[] = [
  {
    id: "q1",
    question: "Which is NOT a primitive?",
    options: ["Symbol", "Object", "BigInt", "Undefined"],
    correctIndex: 1,
    explanation: "Object is non-primitive; others are primitives.",
  },
  {
    id: "q2",
    question: "What does === check?",
    options: ["Value only", "Type only", "Value and type", "Reference only"],
    correctIndex: 2,
    explanation: "Strict equality compares value and type.",
  },
  {
    id: "q3",
    question: "What is a closure?",
    options: [
      "A function with default params",
      "A function capturing outer scope",
      "A class method",
      "An event loop tick",
    ],
    correctIndex: 1,
    explanation: "Closures preserve access to outer lexical scope.",
  },
  {
    id: "q4",
    question: "Which runs microtasks?",
    options: [
      "setTimeout",
      "Promise.then",
      "requestAnimationFrame",
      "setInterval",
    ],
    correctIndex: 1,
    explanation: "Promise callbacks queue in the microtask queue.",
  },
  {
    id: "q5",
    question: "How to clone an array shallowly?",
    options: ["arr.copy()", "[...arr]", "arr.clone()", "Array.copy(arr)"],
    correctIndex: 1,
    explanation: "Spread operator makes a shallow copy.",
  },
  {
    id: "q6",
    question: "What does Array.prototype.map return?",
    options: ["Mutated array", "Iterator", "New array", "Set"],
    correctIndex: 2,
    explanation: "map returns a new array with transformed values.",
  },
  {
    id: "q7",
    question: "What is NaN === NaN?",
    options: ["true", "false", "throws", "undefined"],
    correctIndex: 1,
    explanation: "NaN is not equal to itself by spec.",
  },
  {
    id: "q8",
    question: "Which keyword defines block scope?",
    options: ["var", "let", "function", "with"],
    correctIndex: 1,
    explanation: "let and const are block-scoped; here let is the best answer.",
  },
  {
    id: "q9",
    question: "How to prevent object mutation?",
    options: ["Object.assign", "Object.freeze", "delete obj", "Reflect.apply"],
    correctIndex: 1,
    explanation: "freeze makes an object immutable (shallow).",
  },
  {
    id: "q10",
    question: "Which converts string to number reliably?",
    options: ["parseInt(str, 10)", "Number()", "Unary +", "All of the above"],
    correctIndex: 3,
    explanation: "All can convert; parseInt needs radix for safety.",
  },
];
