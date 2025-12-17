// Main API client
export { default as apiClient } from './client';

// User API
export { UserAPI } from './users';

// Task API - Aligned with backend routes
export { default as TaskAPI } from './task';
export * as TaskService from './task';

// Friends API
export { default as FriendsAPI } from './friends';
export type { LeaderboardEntry, LeaderboardResponse } from './friends';

// AI Agents API
export { default as organizerAgentAPI } from './agents/organizerAgent';
export * as OrganizerAgent from './agents/organizerAgent';

// Re-export types for convenience
export type {
  // Task types from lib/types
  ITask,
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskPriority,
  TaskStatus,
  // User types
  IUser,
  User,
  RegisterUserDTO,
  LoginUserDTO,
  UpdateUserDTO,
  UpdatePasswordDTO,
  UserResponse,
  AuthResponse,
  UserPreferences,
  FriendRequests,
} from '../types';

// Re-export Task API types
export type {
  TaskFilters,
  TasksResponse,
  TaskResponse,
  TaskStatsResponse,
  TaskCompleteResponse,
  TaskDeleteResponse,
  AnalyticsResponse,
  AnalyticsSummary,
  CategoryData,
  TimeSeriesData,
  SkillScore,
} from './task';

// Re-export Common types
export type {
  ApiResponse,
  PaginatedResponse,
} from '../types/Common';

// Re-export Organizer Agent types
export type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  OrganizationSuggestionsResponse,
  DailyPlanResponse,
  ProductivityAnalysisResponse,
  MotivationResponse,
  UserContext as OrganizerUserContext,
  TaskContext as OrganizerTaskContext,
  ContextResponse,
  ProviderTestResult,
  HealthCheckResponse,
} from './agents/organizerAgent';
