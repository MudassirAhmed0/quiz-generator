// server/test/generate.spec.ts
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "..";

// Ensure test env before importing app (env.ts reads at import-time)
process.env.NODE_ENV = "test";

describe("POST /api/generate-quiz", () => {
  it("200 happy path", async () => {
    const res = await request(app)
      .post("/api/generate-quiz")
      .set("x-forwarded-for", "1.1.1.1")
      .send({ topic: "frontend", numQuestions: 5, difficulty: "easy" })
      .expect(200);

    expect(res.body).toBeTruthy();
    expect(res.body.topic).toBe("frontend");
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBe(5);
    // spot check structure
    const q = res.body.questions[0];
    expect(typeof q.id).toBe("string");
    expect(typeof q.question).toBe("string");
    expect(Array.isArray(q.options)).toBe(true);
    expect(q.options.length).toBe(4);
    expect([0, 1, 2, 3]).toContain(q.correctIndex);
    expect(typeof q.explanation).toBe("string");
  });

  it("400 invalid payload (topic too short)", async () => {
    const res = await request(app)
      .post("/api/generate-quiz")
      .set("x-forwarded-for", "2.2.2.2")
      .send({ topic: "a", numQuestions: 3 })
      .expect(400);

    expect(res.body).toEqual({
      error: { code: "BAD_REQUEST", message: "Invalid request payload" },
    });
  });

  it("429 rate limit", async () => {
    const agent = request(app).set("x-forwarded-for", "3.3.3.3");

    await agent
      .post("/api/generate-quiz")
      .send({ topic: "frontend" })
      .expect(200);
    await agent
      .post("/api/generate-quiz")
      .send({ topic: "frontend" })
      .expect(200);

    const res = await agent
      .post("/api/generate-quiz")
      .send({ topic: "frontend" })
      .expect(429);
    expect(res.body).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
  });
});
