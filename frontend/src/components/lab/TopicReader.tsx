import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { academicApi, quizApi } from '../../api';
import type { LearningContent, QuizSummary } from '../../types';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { ArrowLeft, Play, ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Dna, FileText, Sparkles } from 'lucide-react';

export const TopicReader: React.FC = () => {
  const {
    activeTopic,
    setActiveQuiz,
    setActiveQuizStartData,
    setScreen,
  } = useGame();
  const { playSFX } = useAudio();

  const [contents, setContents] = useState<LearningContent[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTopic) return;

    const fetchTopicDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [contentList, quizRes] = await Promise.all([
          academicApi.getContentByTopic(activeTopic.id),
          quizApi.getQuizzes({ topicId: activeTopic.id }),
        ]);
        const safeContents = Array.isArray(contentList) ? contentList : [];
        const safeQuizzes = Array.isArray(quizRes?.quizzes) ? quizRes.quizzes : [];
        setContents(safeContents);
        setQuizzes(safeQuizzes);
        setCurrentIndex(0);
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to retrieve research content.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopicDetails();
  }, [activeTopic]);

  const handleLaunchQuiz = async () => {
    if (quizzes.length === 0) return;
    const targetQuiz = quizzes[0];
    try {
      setStartingQuiz(true);
      setErrorMsg(null);
      playSFX('unlock');
      const startData = await quizApi.startQuiz(targetQuiz.id);
      setActiveQuiz(targetQuiz);
      setActiveQuizStartData(startData);
      setScreen('QUIZ');
    } catch (err: any) {
      playSFX('locked');
      setErrorMsg(err.message || 'Failed to start quiz session.');
    } finally {
      setStartingQuiz(false);
    }
  };

  const currentContent = contents[currentIndex];
  const primaryQuiz = quizzes[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-cyan-400" />
                <span className="font-pixel text-xs text-amber-300">
                  TOPIC {activeTopic?.topicNumber || ''}: {activeTopic?.title || 'RESEARCH DOSSIER'}
                </span>
              </div>
              <PixelButton
                variant="wood"
                size="sm"
                onClick={() => setScreen('LAB')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                BACK TO LAB
              </PixelButton>
            </div>
          }
        >
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Dna className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="font-pixel text-xs text-amber-200">
                DECRYPTING GENOMICS DOSSIER...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-red-950/90 border border-red-500 text-red-200 text-xs font-sans">
              ⚠️ {errorMsg}
            </div>
          ) : contents.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <FileText className="w-10 h-10 text-stone-500" />
              <p className="font-pixel text-xs text-stone-400">
                NO LEARNING CONTENT REGISTERED FOR THIS TOPIC YET.
              </p>
              {primaryQuiz && (
                <PixelButton
                  variant="amber"
                  size="md"
                  onClick={handleLaunchQuiz}
                  icon={<Play className="w-4 h-4 fill-current" />}
                  className="mt-3"
                >
                  START TOPIC QUIZ DIRECTLY
                </PixelButton>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Pagination bar if multiple pages */}
              {contents.length > 1 && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#1b0f09] border border-amber-950">
                  <span className="font-pixel text-[10px] text-amber-300">
                    SECTION {currentIndex + 1} OF {contents.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <PixelButton
                      variant="wood"
                      size="sm"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      icon={<ChevronLeft className="w-3 h-3" />}
                    >
                      PREV
                    </PixelButton>
                    <PixelButton
                      variant="wood"
                      size="sm"
                      disabled={currentIndex === contents.length - 1}
                      onClick={() => setCurrentIndex((prev) => Math.min(contents.length - 1, prev + 1))}
                      icon={<ChevronRight className="w-3 h-3" />}
                    >
                      NEXT
                    </PixelButton>
                  </div>
                </div>
              )}

              {/* In-Game Terminal Parchment Document */}
              <div className="pixel-box-parchment p-5 md:p-7 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                <div className="border-b-2 border-amber-900/30 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-silk text-xs text-amber-800 uppercase tracking-widest">
                      Academic Research Summary {currentContent.contentType ? `• ${currentContent.contentType}` : ''}
                    </span>
                    {currentContent.difficulty && (
                      <span className="px-2 py-0.5 bg-amber-900/20 border border-amber-800/40 text-[#4a2e1a] font-pixel text-[9px]">
                        {currentContent.difficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="font-pixel text-base md:text-lg text-[#2e180d] mt-1">
                    {currentContent.title}
                  </h3>
                </div>

                {/* Summary Callout */}
                {currentContent.summary && (
                  <div className="p-3.5 bg-amber-100/60 border-l-4 border-amber-600 rounded-r text-[#3e2415] text-xs font-sans leading-relaxed italic">
                    {currentContent.summary}
                  </div>
                )}

                {/* Main Content Body */}
                <div className="text-xs md:text-sm text-[#382416] font-sans leading-relaxed whitespace-pre-line">
                  {currentContent.content || currentContent.body}
                </div>

                {/* Key Points / Highlights */}
                {currentContent.keyPoints && Array.isArray(currentContent.keyPoints) && currentContent.keyPoints.length > 0 && (
                  <div className="mt-4 p-4 bg-[#f4ebd4] border border-[#d6c39f] rounded">
                    <h4 className="font-pixel text-xs text-[#2c170d] flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      KEY TAKEAWAYS & PRINCIPLES
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {currentContent.keyPoints.map((point: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#422919] font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-700 mt-0.5" />
                          <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Launch Quiz Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-950">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="font-clean text-xs text-amber-200">
                    Finished reading? Prove your mastery on the assessment terminal.
                  </span>
                </div>

                {primaryQuiz && (
                  <PixelButton
                    variant="amber"
                    size="md"
                    disabled={startingQuiz}
                    onClick={handleLaunchQuiz}
                    icon={<Play className="w-4 h-4 fill-current" />}
                    className="w-full sm:w-auto"
                  >
                    {startingQuiz ? 'STARTING EXAM...' : 'START TOPIC QUIZ'}
                  </PixelButton>
                )}
              </div>
            </div>
          )}
        </PixelPanel>
      </div>
    </div>
  );
};
