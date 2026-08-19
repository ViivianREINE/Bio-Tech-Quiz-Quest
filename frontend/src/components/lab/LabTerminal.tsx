import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { quizApi } from '../../api';
import type { Topic, QuizSummary } from '../../types';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { ArrowLeft, BookOpen, Play, Lock, Dna } from 'lucide-react';

export const LabTerminal: React.FC = () => {
  const {
    setScreen,
    units,
    activeUnit,
    setActiveUnit,
    setActiveTopic,
    setActiveQuiz,
    setActiveQuizStartData,
    loadTopicsForUnit,
    topics,
  } = useGame();
  const { playSFX } = useAudio();

  const [loading, setLoading] = useState(false);
  const [topicQuizzes, setTopicQuizzes] = useState<Record<string, QuizSummary[]>>({});
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load topics and quizzes whenever activeUnit changes
  useEffect(() => {
    if (!activeUnit) return;

    const fetchLabData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        await loadTopicsForUnit(activeUnit.id);
        const quizRes = await quizApi.getQuizzes({ unitId: activeUnit.id });
        const map: Record<string, QuizSummary[]> = {};
        quizRes.quizzes.forEach((q) => {
          if (!map[q.topicId]) map[q.topicId] = [];
          map[q.topicId].push(q);
        });
        setTopicQuizzes(map);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load laboratory academic modules.');
      } finally {
        setLoading(false);
      }
    };

    fetchLabData();
  }, [activeUnit, loadTopicsForUnit]);

  const handleReadContent = (topic: Topic) => {
    setActiveTopic(topic);
    setScreen('TOPIC_READER');
  };

  const handleStartQuiz = async (quiz: QuizSummary, topic: Topic) => {
    try {
      setStartingQuizId(quiz.id);
      setErrorMsg(null);
      playSFX('unlock');
      const startData = await quizApi.startQuiz(quiz.id);
      setActiveTopic(topic);
      setActiveQuiz(quiz);
      setActiveQuizStartData(startData);
      setScreen('QUIZ');
    } catch (err: any) {
      playSFX('locked');
      setErrorMsg(err.message || 'Unable to launch quiz terminal.');
    } finally {
      setStartingQuizId(null);
    }
  };

  // Generate slots for Unit 1 + dynamic locked future slots
  const allUnitSlots = [...units];
  if (allUnitSlots.length < 4) {
    const missing = 4 - allUnitSlots.length;
    for (let i = 0; i < missing; i++) {
      allUnitSlots.push({
        id: `locked-unit-${allUnitSlots.length + 1}`,
        subjectId: activeUnit?.subjectId || '',
        unitNumber: allUnitSlots.length + 1,
        title: `Unit ${allUnitSlots.length + 1}: Advanced Biotech Sector`,
        description: 'Advanced genomics calibration in progress.',
        status: 'DRAFT',
        displayOrder: allUnitSlots.length + 1,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-cyan-400" />
                <span className="font-pixel text-xs md:text-sm text-amber-300">
                  {activeUnit?.subject?.name || 'OMICS'} LABORATORY RESEARCH TERMINAL
                </span>
              </div>
              <PixelButton
                variant="wood"
                size="sm"
                onClick={() => setScreen('OVERWORLD')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                RETURN TO CAMPUS
              </PixelButton>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            {/* Unit Selection Tabs */}
            <div className="flex flex-wrap gap-2.5 border-b-2 border-amber-950 pb-3">
              {allUnitSlots.map((unit) => {
                const isLocked = unit.status !== 'PUBLISHED' && unit.id.startsWith('locked');
                const isActive = activeUnit?.id === unit.id;

                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      if (!isLocked) {
                        setActiveUnit(unit);
                        playSFX('tick');
                      } else {
                        playSFX('locked');
                      }
                    }}
                    className={`px-4 py-2.5 font-pixel text-xs flex items-center gap-2 transition cursor-pointer select-none ${
                      isActive
                        ? 'pixel-box-gold text-white font-bold'
                        : isLocked
                        ? 'bg-[#1b120c] border border-stone-800 text-stone-500 cursor-not-allowed opacity-75'
                        : 'pixel-box-wood text-amber-200 hover:text-white'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <span className="text-cyan-400">🔬</span>
                    )}
                    <span>UNIT {unit.unitNumber}</span>
                    {isLocked && <span className="text-[9px] text-stone-500 font-sans">(COMING SOON)</span>}
                  </button>
                );
              })}
            </div>

            {/* Active Unit Header */}
            {activeUnit && (
              <div className="pixel-box-parchment p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h3 className="font-pixel text-sm text-[#3a2216]">
                    UNIT {activeUnit.unitNumber}: {activeUnit.title}
                  </h3>
                  {activeUnit.description && (
                    <p className="font-clean text-xs text-[#5c3a22] mt-1">
                      {activeUnit.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 bg-emerald-800 text-emerald-100 font-pixel text-[10px] rounded">
                    ACTIVE LAB
                  </span>
                  <span className="font-pixel text-[10px] text-[#5c3a22]">
                    {topics.length} MODULES
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-950/90 border border-red-500 text-red-200 text-xs font-sans rounded">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Topics Grid */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Dna className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="font-pixel text-xs text-amber-200">
                  LOADING RESEARCH MODULES FROM SERVER...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map((topic) => {
                  const quizzes = topicQuizzes[topic.id] || [];
                  const primaryQuiz = quizzes[0];

                  return (
                    <div
                      key={topic.id}
                      className="pixel-box-wood p-4 flex flex-col justify-between gap-3 hover:border-amber-500/60 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-[10px] text-cyan-400">
                            TOPIC {topic.topicNumber}
                          </span>
                          {primaryQuiz && (
                            <span className="text-[10px] font-pixel text-amber-400 bg-[#160c07] px-2 py-0.5 border border-amber-900">
                              ⏱️ {primaryQuiz.duration} MINS
                            </span>
                          )}
                        </div>
                        <h4 className="font-pixel text-xs text-amber-200 mt-1.5 leading-snug">
                          {topic.title}
                        </h4>
                        {topic.description && (
                          <p className="font-clean text-xs text-amber-100/70 mt-1 line-clamp-2">
                            {topic.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-amber-950">
                        <PixelButton
                          variant="cyan"
                          size="sm"
                          onClick={() => handleReadContent(topic)}
                          icon={<BookOpen className="w-3.5 h-3.5" />}
                          className="flex-1"
                        >
                          READ NOTES
                        </PixelButton>

                        {primaryQuiz && (
                          <PixelButton
                            variant="amber"
                            size="sm"
                            disabled={startingQuizId === primaryQuiz.id}
                            onClick={() => handleStartQuiz(primaryQuiz, topic)}
                            icon={<Play className="w-3.5 h-3.5 fill-current" />}
                            className="flex-1"
                          >
                            {startingQuizId === primaryQuiz.id ? 'LAUNCHING...' : 'QUIZ'}
                          </PixelButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
