import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';
import { GameProvider, useGame } from './context/GameContext';
import { PhaserGame } from './game/PhaserGame';
import { HUD } from './components/hud/HUD';
import { MainMenu } from './components/menu/MainMenu';
import { PauseMenu } from './components/menu/PauseMenu';
import { LabTerminal } from './components/lab/LabTerminal';
import { TopicReader } from './components/lab/TopicReader';
import { QuizScreen } from './components/quiz/QuizScreen';
import { ResultScreen } from './components/quiz/ResultScreen';
import { AchievementsHall } from './components/gamification/AchievementsHall';
import { LeaderboardModal } from './components/gamification/LeaderboardModal';
import { WorldMapModal } from './components/map/WorldMapModal';
import { SettingsModal } from './components/settings/SettingsModal';

const GameShell: React.FC = () => {
  const { screen } = useGame();

  if (screen === 'MENU') {
    return <MainMenu />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a120c]">
      {/* 1. Underlying Phaser 3 Top-Down Game World */}
      <PhaserGame />

      {/* 2. In-Game HUD Overlay */}
      <HUD />

      {/* 3. In-Game Pause Menu [ESC] */}
      <PauseMenu />

      {/* 4. Active Screen Overlays */}
      {screen === 'LAB' && <LabTerminal />}
      {screen === 'TOPIC_READER' && <TopicReader />}
      {screen === 'QUIZ' && <QuizScreen />}
      {screen === 'RESULT' && <ResultScreen />}
      {screen === 'ACHIEVEMENTS' && <AchievementsHall />}
      {screen === 'LEADERBOARD' && <LeaderboardModal />}
      {screen === 'WORLD_MAP' && <WorldMapModal />}
      {screen === 'SETTINGS' && <SettingsModal />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <ToastProvider>
          <GameProvider>
            <GameShell />
          </GameProvider>
        </ToastProvider>
      </AudioProvider>
    </AuthProvider>
  );
};

export default App;
