import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { quizApi } from '../../api';
import confetti from 'canvas-confetti';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { ProgressBar } from '../ui/ProgressBar';
import { CheckCircle2, XCircle, Clock, RotateCcw, ArrowLeft, Home, Sparkles, BookOpen } from 'lucide-react';

export const ResultScreen: React.FC = () => {
  const {
    lastQuizResult,
    activeQuiz,
    setActiveQuizStartData,
    setScreen,
    xpData,
  } = useGame();
  const { playSFX } = useAudio();

  const [showReview, setShowReview] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const isPassed = lastQuizResult?.isPassed ?? false;
  const score = lastQuizResult?.obtainedMarks ?? 0;
  const totalMarks = lastQuizResult?.totalMarks ?? 0;
  const percentage = lastQuizResult?.percentage ?? 0;
  const correctCount = lastQuizResult?.correctCount ?? 0;
  const incorrectCount = lastQuizResult?.incorrectCount ?? 0;
  const timeTakenSec = lastQuizResult?.timeTakenSec ?? 0;
  const reviewQuestions = (lastQuizResult as any)?.reviewQuestions || [];

  // Confetti burst on pass
  useEffect(() => {
    if (isPassed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e5ff', '#ffb300', '#4caf50', '#ffffff'],
      });
    }
  }, [isPassed]);

  const handleRetryQuiz = async () => {
    if (!activeQuiz) {
      setScreen('LAB');
      return;
    }

    try {
      setRetrying(true);
      playSFX('unlock');
      const startData = await quizApi.startQuiz(activeQuiz.id);
      setActiveQuizStartData(startData);
      setScreen('QUIZ');
    } catch (err: any) {
      playSFX('locked');
      alert(err.message || 'Unable to restart quiz attempt.');
    } finally {
      setRetrying(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <span className="font-pixel text-xs text-amber-300">
                ASSESSMENT RESULTS & RESEARCH REPORT
              </span>
              <div className="flex items-center gap-1 font-pixel text-[10px] text-cyan-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeTakenSec)}</span>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            {/* Outcome Banner */}
            <div
              className={`p-6 text-center border-4 flex flex-col items-center gap-2 ${
                isPassed
                  ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_20px_rgba(76,175,80,0.3)]'
                  : 'bg-red-950/80 border-red-600 shadow-[0_0_20px_rgba(229,57,53,0.3)]'
              }`}
            >
              {isPassed ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-6 h-6 animate-spin" />
                    <h2 className="font-pixel text-xl md:text-2xl tracking-wider text-emerald-300">
                      ASSESSMENT PASSED!
                    </h2>
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <p className="font-clean text-xs text-emerald-100/90 max-w-md">
                    Outstanding research analysis! Knowledge verified by the genomics evaluation system.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-pixel text-xl md:text-2xl tracking-wider text-red-400">
                    BENCHMARK NOT MET
                  </h2>
                  <p className="font-clean text-xs text-red-200/80 max-w-md">
                    The passing threshold was not reached on this attempt. Review the topic dossier and reattempt.
                  </p>
                </>
              )}
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Score */}
              <div className="pixel-box-parchment p-3 text-center">
                <span className="font-pixel text-[9px] text-[#5c3a22]">SCORE</span>
                <div className="font-pixel text-base text-[#2e180d] mt-1">
                  {score} / {totalMarks}
                </div>
              </div>

              {/* Accuracy % */}
              <div className="pixel-box-parchment p-3 text-center">
                <span className="font-pixel text-[9px] text-[#5c3a22]">ACCURACY</span>
                <div className="font-pixel text-base text-[#2e180d] mt-1">
                  {Math.round(percentage)}%
                </div>
              </div>

              {/* Correct Answers */}
              <div className="pixel-box-parchment p-3 text-center">
                <span className="font-pixel text-[9px] text-emerald-800">CORRECT</span>
                <div className="font-pixel text-base text-emerald-700 mt-1">
                  {correctCount}
                </div>
              </div>

              {/* Incorrect Answers */}
              <div className="pixel-box-parchment p-3 text-center">
                <span className="font-pixel text-[9px] text-red-800">INCORRECT</span>
                <div className="font-pixel text-base text-red-700 mt-1">
                  {incorrectCount}
                </div>
              </div>
            </div>

            {/* XP & Level Status */}
            <div className="pixel-box-wood p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/glowing_blue_diamond_XP_crystal_icon.png"
                  alt="XP"
                  className="w-10 h-10 animate-bounce"
                />
                <div>
                  <h4 className="font-pixel text-xs text-amber-300">
                    RESEARCH XP EARNED
                  </h4>
                  <p className="font-clean text-xs text-amber-100/70">
                    Total XP: <span className="font-bold text-cyan-300">{xpData?.totalXP ?? 0}</span>
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-48">
                <ProgressBar
                  value={xpData?.progressPercent ?? 0}
                  variant="cyan"
                  height="md"
                  showLabel
                  label={`LVL ${xpData?.currentLevel ?? 1}`}
                />
              </div>
            </div>

            {/* Review Section Toggle */}
            {reviewQuestions.length > 0 && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowReview((prev) => !prev)}
                  className="pixel-box-parchment p-3 flex items-center justify-between text-left font-pixel text-xs text-[#3a2216] cursor-pointer hover:bg-amber-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-800" />
                    <span>{showReview ? 'HIDE DETAILED QUESTION REVIEW' : 'VIEW DETAILED QUESTION REVIEW & EXPLANATIONS'}</span>
                  </div>
                  <span className="text-amber-800">{showReview ? '▲' : '▼'}</span>
                </button>

                {showReview && (
                  <div className="flex flex-col gap-3 max-h-72 overflow-y-auto p-1">
                    {reviewQuestions.map((q: any, i: number) => {
                      const isCorrect = q.isCorrect;

                      return (
                        <div
                          key={q.id || i}
                          className={`p-4 border-2 ${
                            isCorrect
                              ? 'bg-[#f0fdf4] border-emerald-600 text-[#14532d]'
                              : 'bg-[#fef2f2] border-red-500 text-[#7f1d1d]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <h5 className="font-pixel text-[11px] font-bold">
                                Q{i + 1}: {q.questionText}
                              </h5>

                              {q.selectedOption && (
                                <p className="text-xs mt-1 font-sans">
                                  Your Choice: <strong>{q.selectedOption.optionText}</strong>
                                </p>
                              )}

                              {!isCorrect && q.correctOption && (
                                <p className="text-xs text-emerald-800 font-sans mt-0.5">
                                  Correct Solution: <strong>{q.correctOption.optionText}</strong>
                                </p>
                              )}

                              {q.explanation && (
                                <div className="mt-2 p-2 bg-black/5 text-xs font-sans italic border-l-2 border-amber-700">
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-950">
              <PixelButton
                variant="wood"
                size="md"
                onClick={() => setScreen('OVERWORLD')}
                icon={<Home className="w-4 h-4" />}
              >
                RETURN TO HUB
              </PixelButton>

              <div className="flex items-center gap-3">
                <PixelButton
                  variant="cyan"
                  size="md"
                  onClick={() => setScreen('LAB')}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  LAB MODULES
                </PixelButton>

                <PixelButton
                  variant="amber"
                  size="md"
                  disabled={retrying}
                  onClick={handleRetryQuiz}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  {retrying ? 'RETRYING...' : 'RETRY QUIZ'}
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
