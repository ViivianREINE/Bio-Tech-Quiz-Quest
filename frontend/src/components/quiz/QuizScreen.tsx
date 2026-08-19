import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { useToast } from '../../context/ToastContext';
import { quizApi } from '../../api';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Clock, CheckCircle, AlertTriangle, Send, ArrowRight, ArrowLeft } from 'lucide-react';

export const QuizScreen: React.FC = () => {
  const {
    activeQuizStartData,
    setLastQuizResult,
    setScreen,
    refreshGamification,
  } = useGame();
  const { playSFX } = useAudio();
  const { addToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isWarning, setIsWarning] = useState(false);
  const autoSubmittedRef = useRef(false);

  const attemptId = activeQuizStartData?.attemptId;
  const questions = activeQuizStartData?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const expiresAt = activeQuizStartData?.expiresAt;

  // Timer Synchronized with Server expiresAt
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remainingMs = new Date(expiresAt).getTime() - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 15 && remainingSec > 0) {
        setIsWarning(true);
        playSFX('tick');
      } else {
        setIsWarning(false);
      }

      // Auto submit on expiration
      if (remainingSec <= 0 && !autoSubmittedRef.current && !submitting) {
        autoSubmittedRef.current = true;
        handleSubmitQuiz(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    playSFX('tick');
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuiz = async (isAuto = false) => {
    if (!attemptId || submitting) return;

    try {
      setSubmitting(true);
      if (isAuto) {
        addToast({
          type: 'warning',
          title: 'Time Expired',
          description: 'Submitting your completed answers to the research server...',
        });
      }

      const answersPayload = Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));

      const result = await quizApi.submitAttempt(attemptId, answersPayload);
      
      // Fetch full attempt details with explanations if available
      const fullDetail = await quizApi.getAttemptById(attemptId).catch(() => result as any);
      setLastQuizResult(fullDetail);

      // Play victory / defeat audio based on server outcome
      if (result.isPassed) {
        playSFX('pass');
      } else {
        playSFX('fail');
      }

      // Trigger gamification updates
      await refreshGamification();
      setScreen('RESULT');
    } catch (err: any) {
      playSFX('wrong');
      addToast({
        type: 'error',
        title: 'Submission Error',
        description: err.message || 'Failed to submit quiz attempt.',
      });
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!activeQuizStartData || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <PixelPanel variant="wood">
          <div className="text-center p-6 flex flex-col items-center gap-4">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
            <p className="font-pixel text-xs text-amber-200">
              NO ACTIVE QUIZ SESSION FOUND.
            </p>
            <PixelButton variant="wood" size="sm" onClick={() => setScreen('LAB')}>
              RETURN TO LAB
            </PixelButton>
          </div>
        </PixelPanel>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const currentSelectedOptionId = selectedAnswers[currentQuestion?.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto scanline-effect">
      <div className="w-full max-w-4xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              {/* Question Index & Marks */}
              <div className="flex items-center gap-3">
                <span className="font-pixel text-xs text-cyan-300">
                  QUESTION {currentIndex + 1} / {totalQuestions}
                </span>
                <span className="text-[10px] font-pixel text-amber-400 bg-black/40 px-2 py-0.5 border border-amber-900/60">
                  +{currentQuestion?.marks || 1} MARKS
                </span>
              </div>

              {/* Quiz Title */}
              <h2 className="hidden md:block font-silk text-xs text-amber-200 uppercase tracking-wider truncate max-w-xs">
                {activeQuizStartData.quizTitle}
              </h2>

              {/* Timer & Attempt Pip Indicators */}
              <div className="flex items-center gap-4">
                {/* Science Test Tube Pips */}
                <div className="flex items-center gap-1.5" title="Attempt Status">
                  {[...Array(Math.min(5, activeQuizStartData.maximumAttempts || 3))].map((_, i) => (
                    <img
                      key={i}
                      src="/assets/images/a_science_test_tube_flask_filled_with_bright_aqua_liquid__used_as_a_life_or_attempt_pip.png"
                      alt="Attempt Pip"
                      className="w-4 h-5 drop-shadow-[0_0_4px_rgba(0,229,255,0.8)]"
                    />
                  ))}
                </div>

                {/* Countdown Timer */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 bg-black/60 border-2 ${
                    isWarning
                      ? 'border-red-500 text-red-400 animate-timer-pulse font-bold'
                      : 'border-cyan-600 text-cyan-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-terminal text-lg tracking-wider">
                    {formatTimer(secondsRemaining)}
                  </span>
                </div>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            {/* Question Prompt Terminal Box */}
            <div className="pixel-box-terminal p-5 md:p-6 min-h-[110px] flex flex-col justify-center">
              <span className="font-terminal text-xs text-cyan-400/80 mb-1">
                // SYSTEM PROMPT QUESTION ID: {currentQuestion?.id.substring(0, 8)}...
              </span>
              <p className="font-clean text-base md:text-lg font-bold text-white leading-relaxed">
                {currentQuestion?.questionText}
              </p>
            </div>

            {/* Answer Options Grid (4 Tactile Terminal Pads) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentQuestion?.options.map((opt, idx) => {
                const isSelected = currentSelectedOptionId === opt.id;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`p-4 text-left transition-all duration-100 flex items-center gap-3 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-amber-100 border-4 border-amber-600 text-[#361e0f] shadow-[0_0_12px_rgba(255,179,0,0.6)] translate-y-0.5'
                        : 'pixel-box-parchment hover:border-amber-500 text-[#3d2415] hover:bg-[#fffcf4]'
                    }`}
                  >
                    {/* Option Indicator Badge */}
                    <div
                      className={`w-7 h-7 shrink-0 flex items-center justify-center font-pixel text-xs font-bold border-2 ${
                        isSelected
                          ? 'bg-amber-600 border-amber-800 text-white'
                          : 'bg-[#4a2e1a] border-[#2c170b] text-amber-200'
                      }`}
                    >
                      {letter}
                    </div>

                    {/* Option Text */}
                    <span className="font-clean text-xs md:text-sm font-semibold flex-1 leading-snug">
                      {opt.optionText}
                    </span>

                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-amber-700 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation Strip & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-950">
              {/* Question Jump Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {questions.map((q, i) => {
                  const isDone = !!selectedAnswers[q.id];
                  const isCurrent = currentIndex === i;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-7 h-7 font-pixel text-[10px] flex items-center justify-center transition cursor-pointer ${
                        isCurrent
                          ? 'border-2 border-cyan-400 bg-cyan-900 text-cyan-200'
                          : isDone
                          ? 'border border-emerald-600 bg-emerald-950/80 text-emerald-300'
                          : 'border border-stone-800 bg-[#160c07] text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <PixelButton
                  variant="wood"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  icon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  PREV
                </PixelButton>

                {currentIndex < totalQuestions - 1 ? (
                  <PixelButton
                    variant="cyan"
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    NEXT
                  </PixelButton>
                ) : (
                  <PixelButton
                    variant="amber"
                    size="md"
                    disabled={submitting}
                    onClick={() => handleSubmitQuiz(false)}
                    icon={<Send className="w-4 h-4" />}
                  >
                    {submitting ? 'SUBMITTING...' : `SUBMIT (${answeredCount}/${totalQuestions})`}
                  </PixelButton>
                )}
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
