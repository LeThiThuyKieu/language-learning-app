// User Types
export interface User {
  id: number;
  email: string;
  createdAt: string;
  lastLogin?: string;
  status: "active" | "banned";
}

export interface UserProfile {
  id: number;
  userId: number;
  fullName?: string;
  avatarUrl?: string;
  targetGoal?: string;
  currentLevel?: number;
  totalXp: number;
  streakCount: number;
}

export interface Role {
  id: number;
  roleName: string;
}

// Learning Types
export interface Level {
  id: number;
  levelName: string;
  cefrCode?: string;
  minScoreRequired: number;
}

export interface SkillTree {
  id: number;
  levelId: number;
  title: string;
  orderIndex: number;
  isLockedByDefault: boolean;
}

export interface SkillNode {
  id: number;
  skillTreeId: number;
  title: string;
  nodeType: "VOCAB" | "LISTENING" | "SPEAKING" | "MATCHING" | "REVIEW";
  orderIndex: number;
}

export interface UserSkillTreeProgress {
  id: number;
  userId: number;
  skillTreeId: number;
  status: "locked" | "in_progress" | "done";
  score: number;
  updatedAt: string;
}

export interface UserNodeProgress {
  id: number;
  userId: number;
  nodeId: number;
  status: "not_started" | "in_progress" | "completed";
  score: number;
  attemptCount: number;
  updatedAt: string;
}

// Placement Test
export interface PlacementTest {
  id: number;
  userId: number;
  score: number;
  detectedLevelId: number;
  createdAt: string;
}

// Badges & Achievements
export interface Badge {
  id: number;
  badgeName: string;
  description: string;
  requiredXp: number;
  iconUrl?: string;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  earnedAt: string;
}

// XP & Progress
export interface XpHistory {
  id: number;
  userId: number;
  amount: number;
  source: string;
  createdAt: string;
}

export interface StreakHistory {
  id: number;
  userId: number;
  date: string;
  earnedXp: number;
}

export interface Leaderboard {
  id: number;
  userId: number;
  totalXp: number;
  rankPosition: number;
  updatedAt: string;
}

// Feedback
export interface Feedback {
  id: number;
  userId: number;
  skillTreeId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

// MongoDB Document Types
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  levelId: number;
  skillTreeId: number;
  skillNodeId: number;
  content: string;
  tags?: string[];
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswers: string[];
  explanation?: string;
  difficulty: number;
  skillNodeId: number;
  lessonId?: number;
  points: number;
}

export interface Vocabulary {
  id: string;
  word: string;
  pronunciation?: string;
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  partOfSpeech?: string;
  synonyms?: string[];
  antonyms?: string[];
  audioUrl?: string;
  imageUrl?: string;
  levelId: number;
  tags?: string[];
}
