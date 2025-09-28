// server/src/llm/adapter.ts
import { env } from "../env";
import type {
  GenerateQuizRequest,
  GenerateQuizResponse,
  QuizQuestion,
} from "../schema";
import { OpenAIProvider } from "./providers/openai";

export interface LLMProvider {
  generateQuiz(input: GenerateQuizRequest): Promise<GenerateQuizResponse>;
}

class LocalMockProvider implements LLMProvider {
  async generateQuiz(
    input: GenerateQuizRequest
  ): Promise<GenerateQuizResponse> {
    const { topic, numQuestions, difficulty } = input;
    const questions: QuizQuestion[] = Array.from({ length: numQuestions }).map(
      (_, i) => {
        const idx = i % 4;
        return {
          id: `q${i + 1}`,
          question: `Which of the following is most closely associated with "${topic}"?`,
          options: [
            `${topic}`,
            `General concept ${i + 1}`,
            `Unrelated term ${i + 1}`,
            `Common misconception ${i + 1}`,
          ],
          correctIndex: 0,
          explanation: `“${topic}” is the most directly related option.`,
        };
      }
    );
    return { topic, difficulty, questions };
  }
}

export function getLLMProvider(): LLMProvider {
  if (env.OPENAI_API_KEY) return new OpenAIProvider(env.OPENAI_API_KEY);
  return new LocalMockProvider();
}
