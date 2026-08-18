export const GAMIFICATION_CONFIG = {
  XP_REWARDS: {
    CORRECT_ANSWER: 10,
    QUIZ_COMPLETION: 50,
    PERFECT_SCORE: 100,
    TOPIC_COMPLETION: 150,
    UNIT_COMPLETION: 300,
    STREAK_BONUS: 25,
    BADGE_UNLOCKED: 50,
  },
  DEFAULT_BADGES: [
    {
      code: 'FIRST_QUIZ',
      name: 'First Quest',
      description: 'Completed your first quiz assessment',
      criteria: { type: 'FIRST_QUIZ_COMPLETED' },
    },
    {
      code: 'PERFECT_SCORE',
      name: 'Flawless Genomicist',
      description: 'Achieved a 100% score on a quiz',
      criteria: { type: 'PERFECT_SCORE' },
    },
    {
      code: 'TOPIC_MASTER',
      name: 'Topic Explorer',
      description: 'Completed 100% of quizzes in a topic',
      criteria: { type: 'TOPIC_COMPLETION' },
    },
    {
      code: 'UNIT_MASTER',
      name: 'Unit Champion',
      description: 'Completed 100% of quizzes in a unit',
      criteria: { type: 'UNIT_COMPLETION' },
    },
    {
      code: 'STREAK',
      name: 'Consistent Scholar',
      description: 'Maintained an active quiz streak on consecutive days',
      criteria: { type: 'STREAK', days: 2 },
    },
    {
      code: 'OMICS_MASTER',
      name: 'Omics Pioneer',
      description: 'Completed 100% of the OMICS curriculum',
      criteria: { type: 'SUBJECT_COMPLETION' },
    },
  ],
};
