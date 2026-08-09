# AI Usage Log — Intervu AI

## 1. Project Architecture

### Prompt
Act as a senior hackathon engineer and help design an adaptive AI technical interview platform...

### AI Contribution
- Designed the high-level architecture
- Suggested Next.js App Router structure
- Proposed separation between Interview Service and Gemini Service

---

## 2. Adaptive Interview Engine

### Prompt
Design an adaptive interview engine that:
- analyzes candidate profile and curriculum
- evaluates answers
- generates follow-up questions
- limits follow-ups per topic
- completes the interview after 8 main questions

### AI Contribution
- Suggested adaptive decision flow
- Helped structure session state
- Suggested follow-up limits and question tracking

---

## 3. Gemini Integration

### Prompt
Implement a Gemini service that evaluates candidate answers and returns structured JSON...

### AI Contribution
- Gemini API integration
- Structured evaluation schema
- JSON parsing and validation
- Model fallback handling

---

## 4. Error Handling

### Prompt
Debug Gemini RESOURCE_EXHAUSTED 429 errors and design graceful fallback behavior...

### AI Contribution
- Added model fallback
- Added local evaluation fallback
- Prevented interview failure when Gemini quota is exhausted

---

## 5. Recruiter Dashboard

### Prompt
Design a recruiter dashboard showing candidate learning progress, skills, interview status, and interview creation...

### AI Contribution
- Dashboard UI structure
- Candidate cards
- Progress indicators
- Interview status and report links

---

## 6. Interview Report

### Prompt
Design a recruiter-ready interview report containing overall score, confidence, strengths, improvements, missing concepts, topic performance, and question-level evaluations.

### AI Contribution
- Report structure
- Evaluation presentation
- Topic-level performance
- Question-level breakdown

---

## 7. Debugging

### Issue
Gemini API returned RESOURCE_EXHAUSTED (429).

### Resolution
Implemented graceful fallback evaluation so the interview can continue even when Gemini quota is temporarily unavailable.

### Issue
Next.js production build failed because app/api/interview/route.ts was not a valid module.

### Resolution
Fixed the route module and verified the production build successfully.