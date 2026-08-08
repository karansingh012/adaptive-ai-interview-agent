const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function post(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

async function get(path) {
  const response = await fetch(`${BASE}${path}`);
  const data = await response.json();
  return { response, data };
}

const answers = [
  "Prompt engineering structures LLM inputs with clear instructions, context, constraints, examples, and output formats. I would test it with representative cases, compare failure modes, and iterate prompts using versioned evaluations so the behavior is reliable rather than anecdotal.",
  "Embeddings represent text as dense vectors, so semantically similar content lands near each other. I would normalize content, choose an embedding model, store vectors with metadata, and validate retrieval using similarity search metrics and human checks.",
  "Vector databases store embeddings and metadata, then support efficient nearest-neighbor retrieval. I would tune chunking, indexes, filters, and similarity thresholds while monitoring recall, latency, and stale content.",
  "RAG retrieves relevant documents before generation so the model can answer with grounded context. I would evaluate retrieval quality, citation faithfulness, prompt assembly, and fallback behavior when no reliable context is found.",
  "AI agents choose tools by reasoning over task state, tool descriptions, inputs, and prior results. I would constrain tools, validate arguments, log traces, and add guardrails for loops or unsafe actions.",
  "MCP standardizes how applications expose tools and context to AI clients. I would design typed tool contracts, permission boundaries, observable calls, and tests for malformed input or unavailable servers.",
  "AI deployment needs offline evaluation, staged rollout, monitoring, rollback, cost controls, and incident response. I would track latency, quality, safety, and user feedback against baseline prompts and models.",
  "Production AI systems need reliability controls: eval suites, human review paths, rate-limit handling, observability, rollback plans, and clear ownership. I would measure quality over time and treat prompts, models, and retrieval data as versioned production dependencies.",
];

console.log("1. Create interview");
const { data: created } = await post("/api/interview/create", { candidateId: "cand-001" });
console.log("  totalQuestions in create payload:", created.link ? "via session" : created);

console.log("2. Start via token");
const { data: started } = await post("/api/interview/start", { token: created.token });
console.log("  totalQuestions:", started.totalQuestions, "current:", started.currentQuestionNumber);

let session = started;
let question = session.currentQuestion ?? session.firstQuestion;
let maxMainQuestionNumber = started.currentQuestionNumber ?? 1;
let submissions = 0;

console.log("3. Submit empty answer (fallback path)");
const empty = await post("/api/interview/answer", {
  sessionId: session.sessionId,
  questionId: question.id,
  answer: "",
  currentQuestion: question,
  questionHistory: session.questionHistory ?? [],
  sessionState: session.sessionState,
  interviewToken: created.token,
  evaluations: [],
  candidate: session.candidate,
});
console.log("  empty score:", empty.data.evaluation?.score, "hasNext:", Boolean(empty.data.nextQuestion));

session = { ...session, ...empty.data };
question = empty.data.nextQuestion ?? question;
submissions += 1;
if (empty.data.nextQuestion) {
  maxMainQuestionNumber = Math.max(maxMainQuestionNumber, empty.data.currentQuestionNumber ?? maxMainQuestionNumber);
}

console.log("4. Refresh/resume via token");
const resumed = await post("/api/interview/start", { token: created.token });
console.log("  resumed status:", resumed.response.status, "question:", resumed.data.currentQuestion?.id ?? resumed.data.firstQuestion?.id);
if (resumed.response.status !== 200 || !resumed.data.currentQuestion) {
  console.error("FAIL: could not resume active session");
  process.exit(1);
}
session = resumed.data;
question = session.currentQuestion;

console.log("5. Invalid session");
const invalidSession = await get("/api/interview/session?sessionId=not-a-session");
console.log("  invalid session status:", invalidSession.response.status);
if (invalidSession.response.status !== 404) {
  console.error("FAIL: invalid session should return 404");
  process.exit(1);
}

console.log("6. Answer loop");
for (let index = 0; index < 40; index += 1) {
  const answer = answers[index % answers.length];
  const payload = {
    sessionId: session.sessionId,
    questionId: question.id,
    answer,
    currentQuestion: question,
    previousQuestions: (session.questionHistory ?? [])
      .map((record) => record.question)
      .filter(Boolean),
    questionHistory: session.questionHistory ?? [],
    sessionState: session.sessionState,
    interviewToken: created.token,
    evaluations: session.evaluations ?? [],
    candidate: session.candidate,
  };

  const { data } = await post("/api/interview/answer", payload);
  submissions += 1;
  maxMainQuestionNumber = Math.max(maxMainQuestionNumber, data.currentQuestionNumber ?? maxMainQuestionNumber);
  console.log(
    `  #${submissions} status=${data.status} qnum=${data.currentQuestionNumber} total=${data.totalQuestions} type=${data.nextQuestion?.questionType ?? "none"} source=${data.evaluation?.source} score=${data.evaluation?.score}`,
  );

  session = { ...session, ...data };

  if (data.status === "completed") {
    console.log("  Completed after", index + 1, "submissions in loop");
    break;
  }

  if (!data.nextQuestion) {
    console.error("  ERROR: missing next question");
    process.exit(1);
  }

  question = data.nextQuestion;
}

console.log("7. Verify report by token");
const { data: reportData, response: reportResponse } = await get(
  `/api/interview/report-by-token?token=${encodeURIComponent(created.token)}`,
);
const report = reportData.report;
console.log(
  "  report status:",
  reportResponse.status,
  "overall:",
  report?.overallScore,
  "questions:",
  report?.questionsAnswered,
  "fallback:",
  report?.fallbackCount,
);

console.log("8. Assertions");
if (started.totalQuestions !== 8) {
  console.error("FAIL: totalQuestions should be 8, got", started.totalQuestions);
  process.exit(1);
}
if (maxMainQuestionNumber > 8) {
  console.error("FAIL: main question number exceeded 8");
  process.exit(1);
}
if (reportResponse.status !== 200) {
  console.error("FAIL: report not available");
  process.exit(1);
}
if (typeof report?.overallScore !== "number") {
  console.error("FAIL: report should include an overall score");
  process.exit(1);
}
if (typeof report.questionsAnswered !== "number" || report.questionsAnswered < 8) {
  console.error("FAIL: report should contain the completed main questions and any follow-ups");
  process.exit(1);
}
if (typeof report.fallbackCount !== "number" || report.fallbackCount < 1) {
  console.error("FAIL: fallback evaluation was not exercised");
  process.exit(1);
}

console.log("PASS: flow completed successfully");
