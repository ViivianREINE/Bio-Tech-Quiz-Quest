import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  Subject,
  Unit,
  Topic,
  QuizSummary,
  StartQuizResponse,
  SubmitQuizResponse,
  AttemptDetailResponse,
  XPData,
  BadgeItem,
  ProgressSummary,
} from '../types';
import { academicApi, gamificationApi, progressApi } from '../api';
import { useAuth } from './AuthContext';

export type GameScreen =
  | 'MENU'
  | 'OVERWORLD'
  | 'LAB'
  | 'TOPIC_READER'
  | 'QUIZ'
  | 'RESULT'
  | 'ACHIEVEMENTS'
  | 'LEADERBOARD'
  | 'WORLD_MAP'
  | 'SETTINGS';

interface GameContextType {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  subjects: Subject[];
  activeSubject: Subject | null;
  setActiveSubject: (s: Subject | null) => void;
  units: Unit[];
  activeUnit: Unit | null;
  setActiveUnit: (u: Unit | null) => void;
  topics: Topic[];
  activeTopic: Topic | null;
  setActiveTopic: (t: Topic | null) => void;
  activeQuiz: QuizSummary | null;
  setActiveQuiz: (q: QuizSummary | null) => void;
  activeQuizStartData: StartQuizResponse | null;
  setActiveQuizStartData: (data: StartQuizResponse | null) => void;
  lastQuizResult: SubmitQuizResponse | AttemptDetailResponse | null;
  setLastQuizResult: (res: SubmitQuizResponse | AttemptDetailResponse | null) => void;
  
  // Gamification & Progress
  xpData: XPData | null;
  badges: BadgeItem[];
  progress: ProgressSummary | null;
  refreshGamification: () => Promise<void>;
  
  // Dynamic Academic Loader
  loadSubjectAndUnits: () => Promise<void>;
  loadTopicsForUnit: (unitId: string) => Promise<void>;
  
  // In-Game Proximity Trigger
  proximityPrompt: { message: string; action: () => void } | null;
  setProximityPrompt: (prompt: { message: string; action: () => void } | null) => void;
  
  // Pause Menu
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
  
  // Companion Dialogue
  companionMessage: string | null;
  setCompanionMessage: (msg: string | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizSummary | null>(null);
  const [activeQuizStartData, setActiveQuizStartData] = useState<StartQuizResponse | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<SubmitQuizResponse | AttemptDetailResponse | null>(null);

  const [xpData, setXpData] = useState<XPData | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  const [proximityPrompt, setProximityPrompt] = useState<{ message: string; action: () => void } | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [companionMessage, setCompanionMessage] = useState<string | null>(
    'Welcome to the Omics Research Station! Explore the campus or enter the lab to begin.'
  );

  const refreshGamification = useCallback(async () => {
    if (!user) return;
    try {
      const [xpRes, badgesRes, progressRes] = await Promise.all([
        gamificationApi.getXP().catch(() => null),
        gamificationApi.getBadges().catch(() => []),
        progressApi.getMyProgress().catch(() => null),
      ]);
      if (xpRes) setXpData(xpRes);
      if (badgesRes) setBadges(badgesRes);
      if (progressRes) setProgress(progressRes);
    } catch (e) {
      console.error('[GameContext] Failed to load gamification data:', e);
    }
  }, [user]);

  const loadSubjectAndUnits = useCallback(async () => {
    if (!user) return;
    try {
      const subjList = await academicApi.getSubjects();
      setSubjects(subjList);
      if (subjList.length > 0) {
        const primary = subjList[0];
        setActiveSubject(primary);
        const unitList = await academicApi.getUnitsBySubject(primary.id);
        setUnits(unitList);
        if (unitList.length > 0) {
          setActiveUnit(unitList[0]);
        }
      }
    } catch (e) {
      console.error('[GameContext] Failed to load subjects/units:', e);
    }
  }, [user]);

  const loadTopicsForUnit = useCallback(async (unitId: string) => {
    try {
      const topicList = await academicApi.getTopicsByUnit(unitId);
      setTopics(topicList);
    } catch (e) {
      console.error('[GameContext] Failed to load topics for unit:', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshGamification();
      loadSubjectAndUnits();
    } else {
      setScreen('MENU');
      setSubjects([]);
      setUnits([]);
      setTopics([]);
      setXpData(null);
      setBadges([]);
      setProgress(null);
    }
  }, [user, refreshGamification, loadSubjectAndUnits]);

  // Global ESC Key Listener for Pause Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screen === 'OVERWORLD' || screen === 'LAB') {
          setIsPaused((prev) => !prev);
        } else if (screen === 'ACHIEVEMENTS' || screen === 'LEADERBOARD' || screen === 'SETTINGS' || screen === 'WORLD_MAP') {
          setScreen('OVERWORLD');
          setIsPaused(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, setIsPaused, setScreen]);

  return (
    <GameContext.Provider
      value={{
        screen,
        setScreen,
        subjects,
        activeSubject,
        setActiveSubject,
        units,
        activeUnit,
        setActiveUnit,
        topics,
        activeTopic,
        setActiveTopic,
        activeQuiz,
        setActiveQuiz,
        activeQuizStartData,
        setActiveQuizStartData,
        lastQuizResult,
        setLastQuizResult,
        xpData,
        badges,
        progress,
        refreshGamification,
        loadSubjectAndUnits,
        loadTopicsForUnit,
        proximityPrompt,
        setProximityPrompt,
        isPaused,
        setIsPaused,
        companionMessage,
        setCompanionMessage,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
