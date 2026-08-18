import { Question, Option, QuestionType } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { SubmitAnswerItem } from './attempt.validation.js';

export interface QuestionWithOptions extends Question {
  options: Option[];
}

export interface ScoringConfig {
  passingPercentage: number;
  negativeMarking: boolean;
  correctMark: number;
  incorrectMark: number;
  unansweredMark: number;
}

export interface EvaluatedAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  marksAwarded: number;
}

export interface ScoringResult {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  evaluatedAnswers: EvaluatedAnswer[];
}

export class ScoringService {
  evaluateQuiz(
    questions: QuestionWithOptions[],
    submittedAnswers: SubmitAnswerItem[],
    config: ScoringConfig
  ): ScoringResult {
    const questionMap = new Map<string, QuestionWithOptions>();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    // Map submitted answers and eliminate duplicates (first answer wins or last answer wins, reject duplicate collisions)
    const answerMap = new Map<string, string | null>();
    const seenQuestions = new Set<string>();

    for (const item of submittedAnswers) {
      if (seenQuestions.has(item.questionId)) {
        throw new AppError(
          400,
          'DUPLICATE_ANSWER_SUBMISSION',
          `Duplicate answer submitted for question ${item.questionId}.`
        );
      }
      seenQuestions.add(item.questionId);

      if (!questionMap.has(item.questionId)) {
        throw new AppError(
          400,
          'INVALID_QUESTION',
          `Question ID ${item.questionId} does not belong to this quiz.`
        );
      }

      answerMap.set(item.questionId, item.selectedOptionId || null);
    }

    let answeredCount = 0;
    let unansweredCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;

    const evaluatedAnswers: EvaluatedAnswer[] = [];

    for (const question of questions) {
      const qMarks = question.marks || config.correctMark;
      totalMarks += qMarks;

      const selectedOptionId = answerMap.get(question.id);

      if (!selectedOptionId) {
        // Unanswered question
        unansweredCount++;
        const marksAwarded = config.unansweredMark || 0.0;
        obtainedMarks += marksAwarded;

        evaluatedAnswers.push({
          questionId: question.id,
          selectedOptionId: null,
          isCorrect: false,
          marksAwarded,
        });
        continue;
      }

      // Answer was provided
      answeredCount++;

      // Verify that selected option belongs to this question
      const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
      if (!selectedOption) {
        throw new AppError(
          400,
          'INVALID_OPTION',
          `Option ${selectedOptionId} does not belong to question ${question.id}.`
        );
      }

      if (
        question.questionType !== QuestionType.SINGLE_CHOICE &&
        question.questionType !== QuestionType.TRUE_FALSE
      ) {
        throw new AppError(
          501,
          'UNSUPPORTED_QUESTION_TYPE',
          `Scoring for question type ${question.questionType} is not supported in this phase.`
        );
      }

      if (selectedOption.isCorrect) {
        // Correct answer
        correctCount++;
        const marksAwarded = qMarks;
        obtainedMarks += marksAwarded;

        evaluatedAnswers.push({
          questionId: question.id,
          selectedOptionId,
          isCorrect: true,
          marksAwarded,
        });
      } else {
        // Incorrect answer
        incorrectCount++;
        const marksAwarded = config.negativeMarking ? -Math.abs(config.incorrectMark) : 0.0;
        obtainedMarks += marksAwarded;

        evaluatedAnswers.push({
          questionId: question.id,
          selectedOptionId,
          isCorrect: false,
          marksAwarded,
        });
      }
    }

    // Calculate percentage (rounded to 2 decimal places)
    let percentage = 0.0;
    if (totalMarks > 0) {
      percentage = Math.round((obtainedMarks / totalMarks) * 10000) / 100;
      // Allow percentage to reflect negative score if obtainedMarks is negative, or clamp if needed
    }

    const isPassed = percentage >= config.passingPercentage;

    return {
      totalQuestions: questions.length,
      answeredCount,
      unansweredCount,
      correctCount,
      incorrectCount,
      totalMarks: Math.round(totalMarks * 100) / 100,
      obtainedMarks: Math.round(obtainedMarks * 100) / 100,
      percentage,
      isPassed,
      evaluatedAnswers,
    };
  }
}

export const scoringService = new ScoringService();
