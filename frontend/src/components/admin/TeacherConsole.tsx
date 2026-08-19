import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { adminApi, academicApi, quizApi } from '../../api';
import type {
  Subject,
  Unit,
  Topic,
  LearningContent,
  QuizSummary,
  QuizQuestion,
  AdminDashboardSummary,
  AdminAttemptItem,
  User,
} from '../../types';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  BookOpen,
  HelpCircle,
  Users,
  CheckSquare,
  BarChart3,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

type AdminTab =
  | 'OVERVIEW'
  | 'SUBJECTS'
  | 'UNITS'
  | 'TOPICS'
  | 'RESOURCES'
  | 'QUIZZES'
  | 'QUESTIONS'
  | 'STUDENTS'
  | 'ATTEMPTS'
  | 'ANALYTICS';

export const TeacherConsole: React.FC = () => {
  const { user } = useAuth();
  const { setScreen, loadSubjectAndUnits } = useGame();

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Overview data
  const [dashboardSummary, setDashboardSummary] = useState<AdminDashboardSummary | null>(null);

  // Academic hierarchy selections
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Resources
  const [resources, setResources] = useState<LearningContent[]>([]);

  // Quizzes & Questions
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Students & Attempts
  const [students, setStudents] = useState<User[]>([]);
  const [attempts, setAttempts] = useState<AdminAttemptItem[]>([]);
  const [inspectingAttemptId, setInspectingAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<any | null>(null);

  // Analytics data
  const [subjectAnalytics, setSubjectAnalytics] = useState<any[]>([]);
  const [quizAnalytics, setQuizAnalytics] = useState<any>({ quizzes: [], rankings: {} });
  const [questionAnalytics, setQuestionAnalytics] = useState<any>({ questions: [], difficultQuestions: [] });

  // Modal / Form states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', status: 'PUBLISHED' });

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({ title: '', description: '', unitNumber: 1, displayOrder: 1, status: 'PUBLISHED' });

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState({ title: '', description: '', displayOrder: 1, status: 'PUBLISHED' });

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<LearningContent | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    contentType: 'TEXT',
    body: '',
    difficulty: 'MEDIUM',
    displayOrder: 1,
    status: 'PUBLISHED',
  });

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizSummary | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    duration: 10,
    passingPercentage: 50,
    maximumAttempts: 3,
    negativeMarking: false,
    correctMark: 1.0,
    incorrectMark: 0.0,
    difficulty: 'MEDIUM',
    randomizeQuestions: false,
    randomizeOptions: false,
    status: 'PUBLISHED',
  });

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    marks: 1.0,
    difficulty: 'MEDIUM',
    explanation: '',
    options: [
      { optionText: '', isCorrect: true, displayOrder: 1 },
      { optionText: '', isCorrect: false, displayOrder: 2 },
      { optionText: '', isCorrect: false, displayOrder: 3 },
      { optionText: '', isCorrect: false, displayOrder: 4 },
    ],
  });

  const showNotification = (type: 'error' | 'success', msg: string) => {
    if (type === 'error') {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 6000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // 1. Initial Load: Dashboard & Subjects
  const fetchDashboardAndSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const [dash, subjs] = await Promise.all([
        adminApi.getDashboardSummary().catch(() => null),
        academicApi.getSubjects().catch(() => []),
      ]);
      if (dash) setDashboardSummary(dash);
      const safeSubjs = Array.isArray(subjs) ? subjs : [];
      setSubjects(safeSubjs);
      if (safeSubjs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(safeSubjs[0].id);
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to load teacher console data.');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    fetchDashboardAndSubjects();
  }, [fetchDashboardAndSubjects]);

  // 2. Fetch Units when subject changes
  const fetchUnits = useCallback(async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await academicApi.getUnitsBySubject(selectedSubjectId);
      const safeUnits = Array.isArray(res) ? res : [];
      setUnits(safeUnits);
      if (safeUnits.length > 0) {
        setSelectedUnitId(safeUnits[0].id);
      } else {
        setSelectedUnitId('');
        setTopics([]);
        setSelectedTopicId('');
      }
    } catch (e: any) {
      console.error('Failed to load units:', e);
      setUnits([]);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // 3. Fetch Topics when unit changes
  const fetchTopics = useCallback(async () => {
    if (!selectedUnitId) return;
    try {
      const res = await academicApi.getTopicsByUnit(selectedUnitId);
      const safeTopics = Array.isArray(res) ? res : [];
      setTopics(safeTopics);
      if (safeTopics.length > 0) {
        setSelectedTopicId(safeTopics[0].id);
      } else {
        setSelectedTopicId('');
        setResources([]);
        setQuizzes([]);
      }
    } catch (e: any) {
      console.error('Failed to load topics:', e);
      setTopics([]);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // 4. Fetch Resources and Quizzes when topic changes
  const fetchTopicContent = useCallback(async () => {
    if (!selectedTopicId) return;
    try {
      const [resList, quizRes] = await Promise.all([
        academicApi.getContentByTopic(selectedTopicId).catch(() => []),
        quizApi.getQuizzes({ topicId: selectedTopicId }).catch(() => ({ quizzes: [] })),
      ]);
      setResources(Array.isArray(resList) ? resList : []);
      const safeQuizzes = Array.isArray(quizRes?.quizzes) ? quizRes.quizzes : [];
      setQuizzes(safeQuizzes);
      if (safeQuizzes.length > 0) {
        setSelectedQuizId(safeQuizzes[0].id);
      } else {
        setSelectedQuizId('');
        setQuestions([]);
      }
    } catch (e: any) {
      console.error('Failed to load topic contents:', e);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    fetchTopicContent();
  }, [fetchTopicContent]);

  // 5. Fetch Questions when quiz changes
  const fetchQuestions = useCallback(async () => {
    if (!selectedQuizId) return;
    try {
      const qList = await adminApi.getQuestionsByQuiz(selectedQuizId);
      setQuestions(Array.isArray(qList) ? qList : []);
    } catch (e: any) {
      console.error('Failed to load questions:', e);
      setQuestions([]);
    }
  }, [selectedQuizId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 6. Fetch Students & Attempts
  const fetchStudentsAndAttempts = useCallback(async () => {
    try {
      const [usersRes, attemptsRes] = await Promise.all([
        adminApi.getUsers({ limit: 50 }).catch(() => ({ users: [] })),
        adminApi.getAttempts({ limit: 50 }).catch(() => ({ attempts: [] })),
      ]);
      setStudents(Array.isArray(usersRes?.users) ? usersRes.users : []);
      setAttempts(Array.isArray(attemptsRes?.attempts) ? attemptsRes.attempts : []);
    } catch (e: any) {
      console.error('Failed to load students and attempts:', e);
    }
  }, []);

  // 7. Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const [subjA, quizA, quesA] = await Promise.all([
        adminApi.getSubjectAnalytics().catch(() => []),
        adminApi.getQuizAnalytics().catch(() => ({ quizzes: [], rankings: {} })),
        adminApi.getQuestionAnalytics().catch(() => ({ questions: [], difficultQuestions: [] })),
      ]);
      setSubjectAnalytics(Array.isArray(subjA) ? subjA : []);
      setQuizAnalytics(quizA || { quizzes: [], rankings: {} });
      setQuestionAnalytics(quesA || { questions: [], difficultQuestions: [] });
    } catch (e: any) {
      console.error('Failed to load analytics:', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'STUDENTS' || activeTab === 'ATTEMPTS') {
      fetchStudentsAndAttempts();
    } else if (activeTab === 'ANALYTICS') {
      fetchAnalytics();
    } else if (activeTab === 'OVERVIEW') {
      fetchDashboardAndSubjects();
    }
  }, [activeTab, fetchStudentsAndAttempts, fetchAnalytics, fetchDashboardAndSubjects]);

  // ==================== SUBJECT CRUD HANDLERS ====================
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingSubject) {
        await adminApi.updateSubject(editingSubject.id, subjectForm);
        showNotification('success', `Subject "${subjectForm.name}" updated.`);
      } else {
        await adminApi.createSubject(subjectForm);
        showNotification('success', `Subject "${subjectForm.name}" created successfully.`);
      }
      setShowSubjectModal(false);
      setEditingSubject(null);
      await fetchDashboardAndSubjects();
      await loadSubjectAndUnits();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to save subject.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject and all its hierarchy?')) return;
    try {
      setLoading(true);
      await adminApi.deleteSubject(id);
      showNotification('success', 'Subject deleted.');
      await fetchDashboardAndSubjects();
      await loadSubjectAndUnits();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to delete subject.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== UNIT CRUD HANDLERS ====================
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      showNotification('error', 'Please select a subject first.');
      return;
    }
    try {
      setLoading(true);
      if (editingUnit) {
        await adminApi.updateUnit(editingUnit.id, {
          title: unitForm.title,
          description: unitForm.description,
          unitNumber: Number(unitForm.unitNumber),
          displayOrder: Number(unitForm.displayOrder),
          status: unitForm.status,
        });
        showNotification('success', `Unit ${unitForm.unitNumber} updated.`);
      } else {
        await adminApi.createUnit(selectedSubjectId, {
          title: unitForm.title,
          description: unitForm.description,
          unitNumber: Number(unitForm.unitNumber),
          displayOrder: Number(unitForm.displayOrder),
          status: unitForm.status,
        });
        showNotification('success', `Unit ${unitForm.unitNumber} created.`);
      }
      setShowUnitModal(false);
      setEditingUnit(null);
      await fetchUnits();
      await loadSubjectAndUnits();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to save unit.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      setLoading(true);
      await adminApi.deleteUnit(id);
      showNotification('success', 'Unit deleted.');
      await fetchUnits();
      await loadSubjectAndUnits();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to delete unit.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== TOPIC CRUD HANDLERS ====================
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      showNotification('error', 'Please select a unit first.');
      return;
    }
    try {
      setLoading(true);
      if (editingTopic) {
        await adminApi.updateTopic(editingTopic.id, {
          title: topicForm.title,
          description: topicForm.description,
          displayOrder: Number(topicForm.displayOrder),
          status: topicForm.status,
        });
        showNotification('success', `Topic updated.`);
      } else {
        await adminApi.createTopic(selectedUnitId, {
          title: topicForm.title,
          description: topicForm.description,
          displayOrder: Number(topicForm.displayOrder),
          status: topicForm.status,
        });
        showNotification('success', `Topic "${topicForm.title}" created.`);
      }
      setShowTopicModal(false);
      setEditingTopic(null);
      await fetchTopics();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to save topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      setLoading(true);
      await adminApi.deleteTopic(id);
      showNotification('success', 'Topic deleted.');
      await fetchTopics();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to delete topic.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RESOURCE CRUD HANDLERS ====================
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      showNotification('error', 'Please select a topic first.');
      return;
    }
    try {
      setLoading(true);
      if (editingResource) {
        await adminApi.updateContent(editingResource.id, {
          title: resourceForm.title,
          contentType: resourceForm.contentType,
          body: resourceForm.body,
          difficulty: resourceForm.difficulty,
          displayOrder: Number(resourceForm.displayOrder),
          status: resourceForm.status,
        });
        showNotification('success', 'Learning resource updated.');
      } else {
        await adminApi.createContent(selectedTopicId, {
          title: resourceForm.title,
          contentType: resourceForm.contentType,
          body: resourceForm.body,
          difficulty: resourceForm.difficulty,
          displayOrder: Number(resourceForm.displayOrder),
          status: resourceForm.status,
        });
        showNotification('success', 'Learning resource created and attached to topic.');
      }
      setShowResourceModal(false);
      setEditingResource(null);
      await fetchTopicContent();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to save resource.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Delete this learning resource?')) return;
    try {
      setLoading(true);
      await adminApi.deleteContent(id);
      showNotification('success', 'Resource deleted.');
      await fetchTopicContent();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to delete resource.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== QUIZ CRUD HANDLERS ====================
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      showNotification('error', 'Please select a topic first.');
      return;
    }
    try {
      setLoading(true);
      if (editingQuiz) {
        await adminApi.updateQuiz(editingQuiz.id, {
          title: quizForm.title,
          description: quizForm.description,
          duration: Number(quizForm.duration),
          passingPercentage: Number(quizForm.passingPercentage),
          maximumAttempts: Number(quizForm.maximumAttempts),
          negativeMarking: Boolean(quizForm.negativeMarking),
          correctMark: Number(quizForm.correctMark),
          incorrectMark: Number(quizForm.incorrectMark),
          difficulty: quizForm.difficulty,
          randomizeQuestions: Boolean(quizForm.randomizeQuestions),
          randomizeOptions: Boolean(quizForm.randomizeOptions),
          status: quizForm.status,
        });
        showNotification('success', 'Quiz configuration updated.');
      } else {
        await adminApi.createQuiz({
          topicId: selectedTopicId,
          title: quizForm.title,
          description: quizForm.description,
          duration: Number(quizForm.duration),
          passingPercentage: Number(quizForm.passingPercentage),
          maximumAttempts: Number(quizForm.maximumAttempts),
          negativeMarking: Boolean(quizForm.negativeMarking),
          correctMark: Number(quizForm.correctMark),
          incorrectMark: Number(quizForm.incorrectMark),
          difficulty: quizForm.difficulty,
          randomizeQuestions: Boolean(quizForm.randomizeQuestions),
          randomizeOptions: Boolean(quizForm.randomizeOptions),
          status: quizForm.status,
        });
        showNotification('success', `Quiz "${quizForm.title}" created.`);
      }
      setShowQuizModal(false);
      setEditingQuiz(null);
      await fetchTopicContent();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishQuiz = async (quizId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      setLoading(true);
      await adminApi.publishQuiz(quizId, nextStatus);
      showNotification('success', `Quiz status changed to ${nextStatus}.`);
      await fetchTopicContent();
    } catch (e: any) {
      // Backend validation error (e.g. empty quiz)
      showNotification('error', e.message || 'Failed to update quiz publishing status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      setLoading(true);
      await adminApi.deleteQuiz(id);
      showNotification('success', 'Quiz deleted.');
      await fetchTopicContent();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to delete quiz.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== QUESTION CRUD HANDLERS ====================
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId) {
      showNotification('error', 'Please select a quiz first.');
      return;
    }

    // Validate that exactly 1 option is marked correct for SINGLE_CHOICE / TRUE_FALSE
    const correctCount = questionForm.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      showNotification('error', 'Please select exactly ONE correct answer option.');
      return;
    }

    try {
      setLoading(true);
      if (editingQuestion) {
        await adminApi.updateQuestion(editingQuestion.id, {
          questionText: questionForm.questionText,
          questionType: questionForm.questionType,
          marks: Number(questionForm.marks),
          difficulty: questionForm.difficulty,
          explanation: questionForm.explanation,
          options: questionForm.options.map((opt, i) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            displayOrder: i + 1,
          })),
        });
        showNotification('success', 'Question updated.');
      } else {
        await adminApi.createQuestion(selectedQuizId, {
          questionText: questionForm.questionText,
          questionType: questionForm.questionType,
          marks: Number(questionForm.marks),
          difficulty: questionForm.difficulty,
          explanation: questionForm.explanation,
          options: questionForm.options.map((opt, i) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            displayOrder: i + 1,
          })),
        });
        showNotification('success', 'Question added to quiz.');
      }
      setShowQuestionModal(false);
      setEditingQuestion(null);
      await fetchQuestions();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to save question.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      setLoading(true);
      await adminApi.deleteQuestion(id);
      showNotification('success', 'Question deleted.');
      await fetchQuestions();
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to delete question.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectAttempt = async (attemptId: string) => {
    try {
      setLoading(true);
      const data = await adminApi.getAttemptDetail(attemptId);
      setAttemptDetail(data);
      setInspectingAttemptId(attemptId);
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to load attempt details.');
    } finally {
      setLoading(false);
    }
  };

  // RBAC Access Control Guard
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <PixelPanel variant="wood">
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
            <h2 className="font-pixel text-base text-amber-300">
              RESTRICTED FACULTY CLEARANCE REQUIRED
            </h2>
            <p className="font-clean text-xs text-amber-100/70 max-w-sm">
              Only authenticated institution faculty and administrators may access the Teacher Console.
            </p>
            <PixelButton variant="wood" size="sm" onClick={() => setScreen('OVERWORLD')}>
              RETURN TO CAMPUS
            </PixelButton>
          </div>
        </PixelPanel>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#140b07] text-[#f7eedb] overflow-hidden scanline-effect font-sans">
      {/* Top Navbar */}
      <header className="h-14 px-4 bg-[#23120b] border-b-2 border-amber-950 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-amber-400" />
          <div>
            <h1 className="font-pixel text-xs md:text-sm text-amber-300 leading-tight">
              BIOTECH TEACHER CONSOLE
            </h1>
            <span className="text-[10px] text-cyan-400 font-silk">
              FACULTY CMS & ASSESSMENT CONTROL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PixelButton
            variant="wood"
            size="sm"
            onClick={() => {
              if (activeTab === 'OVERVIEW') fetchDashboardAndSubjects();
              if (activeTab === 'STUDENTS' || activeTab === 'ATTEMPTS') fetchStudentsAndAttempts();
              if (activeTab === 'ANALYTICS') fetchAnalytics();
              if (selectedSubjectId) fetchUnits();
            }}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            REFRESH
          </PixelButton>
          <PixelButton
            variant="amber"
            size="sm"
            onClick={() => setScreen('OVERWORLD')}
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            EXIT TO CAMPUS
          </PixelButton>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-56 bg-[#1a0e08] border-r-2 border-amber-950 p-2 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'SUBJECTS', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'UNITS', label: 'Units', icon: <Layers className="w-4 h-4" /> },
            { id: 'TOPICS', label: 'Topics', icon: <FileSpreadsheet className="w-4 h-4" /> },
            { id: 'RESOURCES', label: 'Resources', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'QUIZZES', label: 'Quiz Builder', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'QUESTIONS', label: 'Questions', icon: <CheckSquare className="w-4 h-4" /> },
            { id: 'STUDENTS', label: 'Students', icon: <Users className="w-4 h-4" /> },
            { id: 'ATTEMPTS', label: 'Attempts', icon: <Clock className="w-4 h-4" /> },
            { id: 'ANALYTICS', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2.5 px-3 py-2.5 font-pixel text-[11px] transition cursor-pointer text-left ${
                  isActive
                    ? 'pixel-box-gold text-white font-bold'
                    : 'text-amber-200/80 hover:text-white hover:bg-amber-950/40'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-amber-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#180e09]">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/90 border-2 border-red-500 text-red-200 text-xs font-sans rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 font-bold ml-2">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 text-xs font-sans rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 font-bold ml-2">✕</button>
            </div>
          )}

          {/* ==================== 1. OVERVIEW TAB ==================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="flex flex-col gap-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="pixel-box-wood p-3.5">
                  <span className="font-pixel text-[9px] text-amber-400">TOTAL STUDENTS</span>
                  <div className="font-pixel text-lg text-white mt-1">
                    {dashboardSummary?.users.students ?? 0}
                  </div>
                </div>
                <div className="pixel-box-wood p-3.5">
                  <span className="font-pixel text-[9px] text-cyan-400">PUBLISHED SUBJECTS</span>
                  <div className="font-pixel text-lg text-cyan-200 mt-1">
                    {dashboardSummary?.academic.publishedSubjects ?? 0} / {dashboardSummary?.academic.subjects ?? 0}
                  </div>
                </div>
                <div className="pixel-box-wood p-3.5">
                  <span className="font-pixel text-[9px] text-amber-400">ACTIVE MODULES / UNITS</span>
                  <div className="font-pixel text-lg text-white mt-1">
                    {dashboardSummary?.academic.units ?? 0} Units • {dashboardSummary?.academic.topics ?? 0} Topics
                  </div>
                </div>
                <div className="pixel-box-wood p-3.5">
                  <span className="font-pixel text-[9px] text-emerald-400">COMPLETED ASSESSMENTS</span>
                  <div className="font-pixel text-lg text-emerald-300 mt-1">
                    {dashboardSummary?.attempts.completedAttempts ?? 0} (Avg: {dashboardSummary?.performance.averageScore ?? 0}%)
                  </div>
                </div>
              </div>

              {/* Top Performers & Popular Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top XP Researchers */}
                <div className="pixel-box-parchment p-4">
                  <h3 className="font-pixel text-xs text-[#3a2216] flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    TOP RESEARCH PERFORMERS (XP)
                  </h3>
                  {dashboardSummary?.topPerformers?.highestXP?.length ? (
                    <div className="flex flex-col gap-2">
                      {dashboardSummary.topPerformers.highestXP.slice(0, 5).map((p, i) => (
                        <div
                          key={p.userId || i}
                          className="flex items-center justify-between p-2 bg-[#f4ebd4] border border-[#d6c39f] text-xs text-[#3d2415]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-pixel text-[10px] text-amber-800">#{i + 1}</span>
                            <span className="font-bold">{p.name}</span>
                          </div>
                          <span className="font-pixel text-[10px] text-cyan-800 font-bold">{p.totalXP} XP</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5c3a22] italic">No researcher XP data recorded yet.</p>
                  )}
                </div>

                {/* Popular Modules */}
                <div className="pixel-box-parchment p-4">
                  <h3 className="font-pixel text-xs text-[#3a2216] flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    MOST ATTEMPTED ASSESSMENTS
                  </h3>
                  {dashboardSummary?.popularContent?.mostAttemptedQuizzes?.length ? (
                    <div className="flex flex-col gap-2">
                      {dashboardSummary.popularContent.mostAttemptedQuizzes.slice(0, 5).map((q, i) => (
                        <div
                          key={q.quizId || i}
                          className="flex items-center justify-between p-2 bg-[#f4ebd4] border border-[#d6c39f] text-xs text-[#3d2415]"
                        >
                          <span className="font-bold truncate max-w-[200px]">{q.quizTitle}</span>
                          <span className="font-pixel text-[10px] text-emerald-800">{q.attempts} Attempts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5c3a22] italic">No quiz attempt metrics available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. SUBJECTS TAB ==================== */}
          {activeTab === 'SUBJECTS' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-pixel text-sm text-amber-300">SUBJECT CURRICULUM MANAGEMENT</h2>
                <PixelButton
                  variant="amber"
                  size="sm"
                  onClick={() => {
                    setEditingSubject(null);
                    setSubjectForm({ name: '', description: '', status: 'PUBLISHED' });
                    setShowSubjectModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  CREATE SUBJECT
                </PixelButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((sub) => (
                  <div key={sub.id} className="pixel-box-wood p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-pixel text-xs text-amber-200">{sub.name}</h3>
                        <span
                          className={`px-2 py-0.5 font-pixel text-[9px] ${
                            sub.status === 'PUBLISHED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-stone-900 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      {sub.description && (
                        <p className="font-clean text-xs text-amber-100/70 mt-2">{sub.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-950">
                      <PixelButton
                        variant="wood"
                        size="sm"
                        onClick={() => {
                          setEditingSubject(sub);
                          setSubjectForm({
                            name: sub.name,
                            description: sub.description || '',
                            status: sub.status,
                          });
                          setShowSubjectModal(true);
                        }}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        EDIT
                      </PixelButton>

                      <PixelButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSubject(sub.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        DELETE
                      </PixelButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 3. UNITS TAB ==================== */}
          {activeTab === 'UNITS' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-amber-300">SUBJECT:</span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <PixelButton
                  variant="amber"
                  size="sm"
                  onClick={() => {
                    setEditingUnit(null);
                    const nextUnitNum = (units.length || 0) + 1;
                    setUnitForm({
                      title: `Unit ${nextUnitNum}: `,
                      description: '',
                      unitNumber: nextUnitNum,
                      displayOrder: nextUnitNum,
                      status: 'PUBLISHED',
                    });
                    setShowUnitModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  ADD UNIT (e.g. Unit 2, 3...)
                </PixelButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {units.map((u) => (
                  <div key={u.id} className="pixel-box-wood p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-[10px] text-cyan-400">UNIT {u.unitNumber}</span>
                        <span
                          className={`px-2 py-0.5 font-pixel text-[9px] ${
                            u.status === 'PUBLISHED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-stone-900 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>
                      <h3 className="font-pixel text-xs text-amber-200 mt-1">{u.title}</h3>
                      {u.description && <p className="font-clean text-xs text-amber-100/70 mt-2">{u.description}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-950">
                      <PixelButton
                        variant="wood"
                        size="sm"
                        onClick={() => {
                          setEditingUnit(u);
                          setUnitForm({
                            title: u.title,
                            description: u.description || '',
                            unitNumber: u.unitNumber,
                            displayOrder: u.displayOrder,
                            status: u.status,
                          });
                          setShowUnitModal(true);
                        }}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        EDIT
                      </PixelButton>

                      <PixelButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUnit(u.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        DELETE
                      </PixelButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 4. TOPICS TAB ==================== */}
          {activeTab === 'TOPICS' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-amber-300">SUBJECT:</span>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-amber-300">UNIT:</span>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          Unit {u.unitNumber}: {u.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <PixelButton
                  variant="amber"
                  size="sm"
                  onClick={() => {
                    setEditingTopic(null);
                    setTopicForm({
                      title: '',
                      description: '',
                      displayOrder: (topics.length || 0) + 1,
                      status: 'PUBLISHED',
                    });
                    setShowTopicModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  ADD TOPIC
                </PixelButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map((t, idx) => (
                  <div key={t.id} className="pixel-box-wood p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-[10px] text-cyan-400">
                          TOPIC {t.topicNumber || idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 font-pixel text-[9px] ${
                            t.status === 'PUBLISHED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-stone-900 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <h3 className="font-pixel text-xs text-amber-200 mt-1">{t.title}</h3>
                      {t.description && <p className="font-clean text-xs text-amber-100/70 mt-2">{t.description}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-950">
                      <PixelButton
                        variant="wood"
                        size="sm"
                        onClick={() => {
                          setEditingTopic(t);
                          setTopicForm({
                            title: t.title,
                            description: t.description || '',
                            displayOrder: t.displayOrder || idx + 1,
                            status: t.status,
                          });
                          setShowTopicModal(true);
                        }}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        EDIT
                      </PixelButton>

                      <PixelButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTopic(t.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        DELETE
                      </PixelButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 5. RESOURCES TAB ==================== */}
          {activeTab === 'RESOURCES' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-amber-300">UNIT:</span>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          Unit {u.unitNumber}: {u.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-amber-300">TOPIC:</span>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none"
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <PixelButton
                  variant="amber"
                  size="sm"
                  onClick={() => {
                    setEditingResource(null);
                    setResourceForm({
                      title: '',
                      contentType: 'TEXT',
                      body: '',
                      difficulty: 'MEDIUM',
                      displayOrder: (resources.length || 0) + 1,
                      status: 'PUBLISHED',
                    });
                    setShowResourceModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  ADD RESOURCE
                </PixelButton>
              </div>

              <div className="flex flex-col gap-3">
                {resources.map((r, i) => (
                  <div key={r.id || i} className="pixel-box-wood p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700 font-pixel text-[9px]">
                          {r.contentType || 'TEXT'}
                        </span>
                        <h4 className="font-pixel text-xs text-amber-200">{r.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <PixelButton
                          variant="wood"
                          size="sm"
                          onClick={() => {
                            setEditingResource(r);
                            setResourceForm({
                              title: r.title,
                              contentType: r.contentType || 'TEXT',
                              body: r.content || r.body || '',
                              difficulty: r.difficulty || 'MEDIUM',
                              displayOrder: r.displayOrder || r.orderIndex || 1,
                              status: r.status || 'PUBLISHED',
                            });
                            setShowResourceModal(true);
                          }}
                          icon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          EDIT
                        </PixelButton>
                        <PixelButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteResource(r.id)}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          DELETE
                        </PixelButton>
                      </div>
                    </div>
                    <p className="font-clean text-xs text-amber-100/70 whitespace-pre-line line-clamp-3">
                      {r.content || r.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 6. QUIZ BUILDER TAB ==================== */}
          {activeTab === 'QUIZZES' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-amber-300">TOPIC:</span>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <PixelButton
                  variant="amber"
                  size="sm"
                  onClick={() => {
                    setEditingQuiz(null);
                    setQuizForm({
                      title: '',
                      description: '',
                      duration: 10,
                      passingPercentage: 50,
                      maximumAttempts: 3,
                      negativeMarking: false,
                      correctMark: 1.0,
                      incorrectMark: 0.0,
                      difficulty: 'MEDIUM',
                      randomizeQuestions: false,
                      randomizeOptions: false,
                      status: 'PUBLISHED',
                    });
                    setShowQuizModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  CREATE QUIZ
                </PixelButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((q) => (
                  <div key={q.id} className="pixel-box-wood p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-[10px] text-amber-400">⏱️ {q.duration} MINS</span>
                        <span
                          className={`px-2 py-0.5 font-pixel text-[9px] ${
                            q.status === 'PUBLISHED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-stone-900 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <h3 className="font-pixel text-xs text-white mt-1">{q.title}</h3>
                      {q.description && <p className="font-clean text-xs text-amber-100/70 mt-1">{q.description}</p>}

                      <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-pixel text-amber-300/80">
                        <span>PASS: {q.passingPercentage}%</span>
                        <span>ATTEMPTS: {q.maximumAttempts}</span>
                        <span>NEG MARKING: {q.negativeMarking ? 'YES' : 'NO'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-950 flex-wrap">
                      <PixelButton
                        variant="cyan"
                        size="sm"
                        onClick={() => {
                          setSelectedQuizId(q.id);
                          setActiveTab('QUESTIONS');
                        }}
                        icon={<CheckSquare className="w-3.5 h-3.5" />}
                      >
                        QUESTIONS
                      </PixelButton>

                      <PixelButton
                        variant="wood"
                        size="sm"
                        onClick={() => handlePublishQuiz(q.id, q.status)}
                        icon={<Send className="w-3.5 h-3.5" />}
                      >
                        {q.status === 'PUBLISHED' ? 'UNPUBLISH' : 'PUBLISH'}
                      </PixelButton>

                      <PixelButton
                        variant="wood"
                        size="sm"
                        onClick={() => {
                          setEditingQuiz(q);
                          setQuizForm({
                            title: q.title,
                            description: q.description || '',
                            duration: q.duration,
                            passingPercentage: q.passingPercentage,
                            maximumAttempts: q.maximumAttempts,
                            negativeMarking: q.negativeMarking,
                            correctMark: q.correctMark || 1.0,
                            incorrectMark: q.incorrectMark || 0.0,
                            difficulty: q.difficulty || 'MEDIUM',
                            randomizeQuestions: q.randomizeQuestions || false,
                            randomizeOptions: q.randomizeOptions || false,
                            status: q.status,
                          });
                          setShowQuizModal(true);
                        }}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        EDIT
                      </PixelButton>

                      <PixelButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteQuiz(q.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        DELETE
                      </PixelButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 7. QUESTIONS TAB ==================== */}
          {activeTab === 'QUESTIONS' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-amber-300">ACTIVE QUIZ:</span>
                  <select
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    className="px-3 py-1.5 bg-[#24130a] border border-amber-800 text-amber-100 text-xs font-sans outline-none max-w-xs"
                  >
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>

                <PixelButton
                  variant="amber"
                  size="sm"
                  disabled={!selectedQuizId}
                  onClick={() => {
                    setEditingQuestion(null);
                    setQuestionForm({
                      questionText: '',
                      questionType: 'SINGLE_CHOICE',
                      marks: 1.0,
                      difficulty: 'MEDIUM',
                      explanation: '',
                      options: [
                        { optionText: '', isCorrect: true, displayOrder: 1 },
                        { optionText: '', isCorrect: false, displayOrder: 2 },
                        { optionText: '', isCorrect: false, displayOrder: 3 },
                        { optionText: '', isCorrect: false, displayOrder: 4 },
                      ],
                    });
                    setShowQuestionModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  ADD QUESTION
                </PixelButton>
              </div>

              <div className="flex flex-col gap-3">
                {questions.map((q, index) => (
                  <div key={q.id || index} className="pixel-box-wood p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-pixel text-[10px] text-cyan-400">Q{index + 1}</span>
                          <span className="px-2 py-0.5 bg-black/40 text-amber-300 font-pixel text-[9px] border border-amber-900">
                            +{q.marks} MARKS
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{q.questionText}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <PixelButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          DELETE
                        </PixelButton>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {q.options.map((opt, i) => (
                        <div
                          key={opt.id || i}
                          className={`p-2 border text-xs flex items-center gap-2 ${
                            opt.isCorrect
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                              : 'bg-black/30 border-stone-800 text-stone-400'
                          }`}
                        >
                          <span className="font-pixel text-[9px]">{String.fromCharCode(65 + i)}.</span>
                          <span>{opt.optionText}</span>
                          {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-amber-200/60 italic mt-1 font-sans">
                        💡 Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 8. STUDENTS TAB ==================== */}
          {activeTab === 'STUDENTS' && (
            <div className="flex flex-col gap-4">
              <h2 className="font-pixel text-sm text-amber-300">REGISTERED RESEARCH STUDENTS</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#24120a] border-b-2 border-amber-950 font-pixel text-[10px] text-amber-400">
                      <th className="p-3">NAME</th>
                      <th className="p-3">EMAIL</th>
                      <th className="p-3">ROLE</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">JOINED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => (
                      <tr key={st.id} className="border-b border-amber-950/40 hover:bg-[#201007]">
                        <td className="p-3 font-bold text-white">{st.name}</td>
                        <td className="p-3 text-amber-100/80">{st.email}</td>
                        <td className="p-3 font-pixel text-[9px] text-cyan-400">{st.role}</td>
                        <td className="p-3 font-pixel text-[9px] text-emerald-400">{st.status}</td>
                        <td className="p-3 text-stone-400">{new Date(st.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 9. ATTEMPTS TAB ==================== */}
          {activeTab === 'ATTEMPTS' && (
            <div className="flex flex-col gap-4">
              <h2 className="font-pixel text-sm text-amber-300">STUDENT QUIZ ATTEMPTS</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#24120a] border-b-2 border-amber-950 font-pixel text-[10px] text-amber-400">
                      <th className="p-3">STUDENT</th>
                      <th className="p-3">QUIZ</th>
                      <th className="p-3">SUBJECT</th>
                      <th className="p-3">SCORE</th>
                      <th className="p-3">OUTCOME</th>
                      <th className="p-3">TIME</th>
                      <th className="p-3">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((att) => (
                      <tr key={att.attemptId} className="border-b border-amber-950/40 hover:bg-[#201007]">
                        <td className="p-3 font-bold text-white">{att.studentName}</td>
                        <td className="p-3 text-amber-100/90">{att.quizTitle}</td>
                        <td className="p-3 text-stone-400">{att.subjectName}</td>
                        <td className="p-3 font-pixel text-[10px]">
                          {att.obtainedMarks} / {att.totalMarks} ({Math.round(att.percentage)}%)
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 font-pixel text-[9px] ${
                              att.isPassed
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                : 'bg-red-950 text-red-300 border border-red-600'
                            }`}
                          >
                            {att.isPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="p-3 text-stone-400">{att.timeTakenSec}s</td>
                        <td className="p-3">
                          <PixelButton
                            variant="wood"
                            size="sm"
                            onClick={() => handleInspectAttempt(att.attemptId)}
                            icon={<Eye className="w-3 h-3" />}
                          >
                            REVIEW
                          </PixelButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 10. ANALYTICS TAB ==================== */}
          {activeTab === 'ANALYTICS' && (
            <div className="flex flex-col gap-6">
              {/* Subject Breakdown */}
              <div className="pixel-box-parchment p-4">
                <h3 className="font-pixel text-xs text-[#3a2216] mb-3">SUBJECT PERFORMANCE METRICS</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse text-[#3a2216]">
                    <thead>
                      <tr className="border-b border-[#a88d68] font-bold">
                        <th className="p-2">Subject</th>
                        <th className="p-2">Units</th>
                        <th className="p-2">Quizzes</th>
                        <th className="p-2">Attempts</th>
                        <th className="p-2">Avg Score</th>
                        <th className="p-2">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectAnalytics.map((s) => (
                        <tr key={s.subjectId} className="border-b border-[#ebd7be]">
                          <td className="p-2 font-bold">{s.subjectName}</td>
                          <td className="p-2">{s.units}</td>
                          <td className="p-2">{s.publishedQuizzes} / {s.quizzes}</td>
                          <td className="p-2">{s.attempts}</td>
                          <td className="p-2 font-bold">{s.averageScore}%</td>
                          <td className="p-2 text-emerald-800 font-bold">{s.passRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quiz Performance Analytics */}
              <div className="pixel-box-wood p-4">
                <h3 className="font-pixel text-xs text-amber-300 mb-3">QUIZ BENCHMARK RANKINGS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#1e1008] border border-amber-900">
                    <span className="font-pixel text-[9px] text-cyan-400">MOST ATTEMPTED</span>
                    <p className="font-bold text-white mt-1">
                      {quizAnalytics?.rankings?.mostAttempted?.quizTitle || 'None yet'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {quizAnalytics?.rankings?.mostAttempted?.attempts ?? 0} total attempts
                    </p>
                  </div>
                  <div className="p-3 bg-[#1e1008] border border-amber-900">
                    <span className="font-pixel text-[9px] text-emerald-400">HIGHEST AVERAGE SCORE</span>
                    <p className="font-bold text-white mt-1">
                      {quizAnalytics?.rankings?.highestPerforming?.quizTitle || 'None yet'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {quizAnalytics?.rankings?.highestPerforming?.averageScore ?? 0}% avg score
                    </p>
                  </div>
                  <div className="p-3 bg-[#1e1008] border border-amber-900">
                    <span className="font-pixel text-[9px] text-red-400">LOWEST AVERAGE SCORE</span>
                    <p className="font-bold text-white mt-1">
                      {quizAnalytics?.rankings?.lowestPerforming?.quizTitle || 'None yet'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {quizAnalytics?.rankings?.lowestPerforming?.averageScore ?? 0}% avg score
                    </p>
                  </div>
                </div>
              </div>

              {/* Hardest Questions */}
              <div className="pixel-box-wood p-4">
                <h3 className="font-pixel text-xs text-amber-300 mb-3">
                  TOP 5 HARDEST QUESTIONS (Lowest Accuracy Rate)
                </h3>
                <div className="flex flex-col gap-2">
                  {questionAnalytics?.difficultQuestions?.slice(0, 5).map((q: any, idx: number) => (
                    <div
                      key={q.questionId || idx}
                      className="p-3 bg-[#1e1008] border border-amber-900 flex items-center justify-between text-xs"
                    >
                      <div className="max-w-md">
                        <span className="font-pixel text-[9px] text-cyan-400">{q.quizTitle}</span>
                        <p className="font-bold text-white mt-0.5">{q.questionText}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-pixel text-xs text-red-400 font-bold">
                          {q.accuracyPercentage}% Accuracy
                        </span>
                        <p className="text-[10px] text-stone-400">{q.totalAnswers} total answers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <span className="font-pixel text-xs text-amber-300">
                  {editingSubject ? 'EDIT SUBJECT' : 'CREATE NEW SUBJECT'}
                </span>
              }
            >
              <form onSubmit={handleSaveSubject} className="flex flex-col gap-3.5">
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">NAME</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="e.g. Functional Genomics"
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    placeholder="Subject academic synopsis..."
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">STATUS</label>
                  <select
                    value={subjectForm.status}
                    onChange={(e) => setSubjectForm({ ...subjectForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-amber-950">
                  <PixelButton variant="wood" size="sm" type="button" onClick={() => setShowSubjectModal(false)}>
                    CANCEL
                  </PixelButton>
                  <PixelButton variant="amber" size="sm" type="submit" disabled={loading}>
                    {loading ? 'SAVING...' : 'SAVE SUBJECT'}
                  </PixelButton>
                </div>
              </form>
            </PixelPanel>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <span className="font-pixel text-xs text-amber-300">
                  {editingUnit ? 'EDIT UNIT' : 'CREATE NEW UNIT'}
                </span>
              }
            >
              <form onSubmit={handleSaveUnit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">UNIT NUMBER</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={unitForm.unitNumber}
                      onChange={(e) => setUnitForm({ ...unitForm, unitNumber: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">DISPLAY ORDER</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={unitForm.displayOrder}
                      onChange={(e) => setUnitForm({ ...unitForm, displayOrder: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">TITLE</label>
                  <input
                    type="text"
                    required
                    value={unitForm.title}
                    onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                    placeholder="e.g. Unit 2: Molecular Biotechnology"
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                    placeholder="Unit overview..."
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">STATUS</label>
                  <select
                    value={unitForm.status}
                    onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-amber-950">
                  <PixelButton variant="wood" size="sm" type="button" onClick={() => setShowUnitModal(false)}>
                    CANCEL
                  </PixelButton>
                  <PixelButton variant="amber" size="sm" type="submit" disabled={loading}>
                    {loading ? 'SAVING...' : 'SAVE UNIT'}
                  </PixelButton>
                </div>
              </form>
            </PixelPanel>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <span className="font-pixel text-xs text-amber-300">
                  {editingTopic ? 'EDIT TOPIC' : 'CREATE TOPIC'}
                </span>
              }
            >
              <form onSubmit={handleSaveTopic} className="flex flex-col gap-3.5">
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">TITLE</label>
                  <input
                    type="text"
                    required
                    value={topicForm.title}
                    onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                    placeholder="e.g. Epigenetic Modifications & Histone Acetylation"
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                    placeholder="Topic synopsis..."
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">STATUS</label>
                  <select
                    value={topicForm.status}
                    onChange={(e) => setTopicForm({ ...topicForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-amber-950">
                  <PixelButton variant="wood" size="sm" type="button" onClick={() => setShowTopicModal(false)}>
                    CANCEL
                  </PixelButton>
                  <PixelButton variant="amber" size="sm" type="submit" disabled={loading}>
                    SAVE TOPIC
                  </PixelButton>
                </div>
              </form>
            </PixelPanel>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <span className="font-pixel text-xs text-amber-300">
                  {editingResource ? 'EDIT RESOURCE' : 'CREATE LEARNING RESOURCE'}
                </span>
              }
            >
              <form onSubmit={handleSaveResource} className="flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">TITLE</label>
                  <input
                    type="text"
                    required
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    placeholder="e.g. Core Mechanisms of DNA Methylation"
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">CONTENT TYPE</label>
                    <select
                      value={resourceForm.contentType}
                      onChange={(e) => setResourceForm({ ...resourceForm, contentType: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    >
                      {['TEXT', 'IMAGE', 'DIAGRAM', 'FLOWCHART', 'TABLE', 'CASE_STUDY', 'VIDEO_REFERENCE', 'INTERACTIVE_ACTIVITY'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">DIFFICULTY</label>
                    <select
                      value={resourceForm.difficulty}
                      onChange={(e) => setResourceForm({ ...resourceForm, difficulty: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">BODY CONTENT (TEXT / MARKDOWN)</label>
                  <textarea
                    rows={6}
                    required
                    value={resourceForm.body}
                    onChange={(e) => setResourceForm({ ...resourceForm, body: e.target.value })}
                    placeholder="Enter academic principles, explanations, references..."
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs font-mono outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-amber-950">
                  <PixelButton variant="wood" size="sm" type="button" onClick={() => setShowResourceModal(false)}>
                    CANCEL
                  </PixelButton>
                  <PixelButton variant="amber" size="sm" type="submit" disabled={loading}>
                    SAVE RESOURCE
                  </PixelButton>
                </div>
              </form>
            </PixelPanel>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <span className="font-pixel text-xs text-amber-300">
                  {editingQuiz ? 'EDIT QUIZ CONFIGURATION' : 'CREATE QUIZ'}
                </span>
              }
            >
              <form onSubmit={handleSaveQuiz} className="flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">TITLE</label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="e.g. Unit 1 Mastery Checkpoint"
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">DURATION (MINS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quizForm.duration}
                      onChange={(e) => setQuizForm({ ...quizForm, duration: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">PASS %</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={quizForm.passingPercentage}
                      onChange={(e) => setQuizForm({ ...quizForm, passingPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">MAX ATTEMPTS</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quizForm.maximumAttempts}
                      onChange={(e) => setQuizForm({ ...quizForm, maximumAttempts: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-black/40 border border-amber-950">
                  <input
                    type="checkbox"
                    id="negMark"
                    checked={quizForm.negativeMarking}
                    onChange={(e) => setQuizForm({ ...quizForm, negativeMarking: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="negMark" className="font-pixel text-[10px] text-amber-300 cursor-pointer">
                    ENABLE NEGATIVE MARKING
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-amber-950">
                  <PixelButton variant="wood" size="sm" type="button" onClick={() => setShowQuizModal(false)}>
                    CANCEL
                  </PixelButton>
                  <PixelButton variant="amber" size="sm" type="submit" disabled={loading}>
                    SAVE QUIZ
                  </PixelButton>
                </div>
              </form>
            </PixelPanel>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <span className="font-pixel text-xs text-amber-300">
                  {editingQuestion ? 'EDIT QUESTION' : 'ADD NEW QUESTION & OPTIONS'}
                </span>
              }
            >
              <form onSubmit={handleSaveQuestion} className="flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="font-pixel text-[10px] text-amber-300">QUESTION PROMPT</label>
                  <textarea
                    rows={2}
                    required
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    placeholder="Enter scientific question..."
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">QUESTION TYPE</label>
                    <select
                      value={questionForm.questionType}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    >
                      <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                      <option value="TRUE_FALSE">TRUE_FALSE</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">MARKS</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-pixel text-[10px] text-amber-300">DIFFICULTY</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                {/* Options Builder */}
                <div className="flex flex-col gap-2 p-3 bg-black/30 border border-amber-950 rounded">
                  <span className="font-pixel text-[10px] text-amber-400">
                    ANSWER OPTIONS (Select radio button for the correct answer)
                  </span>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const updated = questionForm.options.map((o, idx) => ({
                            ...o,
                            isCorrect: idx === i,
                          }));
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                        className="accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-pixel text-[10px] text-amber-300 w-5">{String.fromCharCode(65 + i)}:</span>
                      <input
                        type="text"
                        required
                        value={opt.optionText}
                        onChange={(e) => {
                          const updated = [...questionForm.options];
                          updated[i].optionText = e.target.value;
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                        className="flex-1 px-3 py-1.5 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-pixel text-[10px] text-amber-300">EXPLANATION</label>
                  <textarea
                    rows={2}
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    placeholder="Explanation shown after quiz submission..."
                    className="w-full px-3 py-2 bg-[#1b0f09] border border-amber-800 text-white text-xs outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-amber-950">
                  <PixelButton variant="wood" size="sm" type="button" onClick={() => setShowQuestionModal(false)}>
                    CANCEL
                  </PixelButton>
                  <PixelButton variant="amber" size="sm" type="submit" disabled={loading}>
                    SAVE QUESTION
                  </PixelButton>
                </div>
              </form>
            </PixelPanel>
          </div>
        </div>
      )}

      {/* Attempt Review Modal */}
      {inspectingAttemptId && attemptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-3xl animate-scale-in">
            <PixelPanel
              variant="wood"
              header={
                <div className="flex items-center justify-between w-full">
                  <span className="font-pixel text-xs text-amber-300">
                    ATTEMPT AUDIT: {attemptDetail?.student?.name} • {attemptDetail?.quiz?.title}
                  </span>
                  <PixelButton variant="wood" size="sm" onClick={() => setInspectingAttemptId(null)}>
                    CLOSE
                  </PixelButton>
                </div>
              }
            >
              <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="p-3 bg-black/40 border border-amber-900 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400">Student:</span>{' '}
                    <strong>{attemptDetail?.student?.name}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400">Score:</span>{' '}
                    <strong>{attemptDetail?.obtainedMarks} / {attemptDetail?.totalMarks} ({Math.round(attemptDetail?.percentage || 0)}%)</strong>
                  </div>
                  <div>
                    <span className="text-stone-400">Status:</span>{' '}
                    <strong className={attemptDetail?.isPassed ? 'text-emerald-400' : 'text-red-400'}>
                      {attemptDetail?.isPassed ? 'PASSED' : 'FAILED'}
                    </strong>
                  </div>
                </div>

                {/* Question-by-question breakdown */}
                {attemptDetail?.reviewQuestions?.map((q: any, i: number) => (
                  <div
                    key={q.id || i}
                    className={`p-3 border-2 text-xs ${
                      q.isCorrect ? 'bg-emerald-950/40 border-emerald-600' : 'bg-red-950/40 border-red-600'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {q.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h5 className="font-bold text-white">
                          Q{i + 1}: {q.questionText}
                        </h5>
                        <p className="mt-1 text-stone-300">
                          Selected Option:{' '}
                          <strong className={q.isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                            {q.selectedOption?.optionText || 'None'}
                          </strong>
                        </p>
                        {!q.isCorrect && q.correctOption && (
                          <p className="mt-0.5 text-emerald-400">
                            Correct Answer: <strong>{q.correctOption.optionText}</strong>
                          </p>
                        )}
                        {q.explanation && (
                          <p className="mt-1 text-stone-400 italic">Explanation: {q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PixelPanel>
          </div>
        </div>
      )}
    </div>
  );
};
