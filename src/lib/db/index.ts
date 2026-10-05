import { supabase as _supabase, isSupabaseConfigured as _isSupabaseConfigured, schemaState } from './_core';
import { getBusinessProfile, updateBusinessProfile, getGoals, addGoal, updateGoal, getOffers, addOffer, syncBusinessProfileToMemory, syncGoalToMemory, syncOfferToMemory } from './profile';
import { getLeads, addLead, updateLead, deleteLead, getLeadScores, addLeadScore } from './leads';
import { getOutreachMessages, addOutreachMessage, updateOutreachMessage } from './outreach';
import { getFollowups, addFollowup, updateFollowup } from './followups';
import { getProposals, addProposal, updateProposal } from './proposals';
import { getClients, addClient, syncClientToMemory } from './clients';
import { getProjects, addProject, updateProject } from './projects';
import { getTasks, addTask, updateTask, deleteTask } from './tasks';
import { getRevenue, addRevenue, getExpenses, addExpense } from './revenue';
import { getMemories, addMemory, searchMemories } from './memory';
import { getAgentLogs, logAgentAction, getToolLogs, logToolAction } from './agents';
import { getChatMessages, addChatMessage, clearChatMessages } from './chat';
import { getContentIdeas, addContentIdea, updateContentIdea, getDailyReports, addDailyReport } from './content';
import { claimForSending } from './sendState';
import { getApprovalRequests, addApprovalRequest, updateApprovalRequest } from './approvals';
import { getEntityGoals, addEntityGoal, updateEntityGoal } from './entityGoals';

export const supabase = _supabase;
export const isSupabaseConfigured = _isSupabaseConfigured;

export const db = {
  get isSchemaInvalid() { return schemaState.isSchemaInvalid; },
  set isSchemaInvalid(v: boolean) { schemaState.isSchemaInvalid = v; },

  // Profile & Goals & Offers
  getBusinessProfile,
  updateBusinessProfile,
  getGoals,
  addGoal,
  updateGoal,
  getOffers,
  addOffer,
  syncBusinessProfileToMemory,
  syncGoalToMemory,
  syncOfferToMemory,

  // Send-state machine (atomic claim: Approved -> Sending)
  claimForSending,

  // Leads & Lead Scores
  getLeads,
  addLead,
  updateLead,
  deleteLead,
  getLeadScores,
  addLeadScore,

  // Outreach
  getOutreachMessages,
  addOutreachMessage,
  updateOutreachMessage,

  // Follow-ups
  getFollowups,
  addFollowup,
  updateFollowup,

  // Proposals
  getProposals,
  addProposal,
  updateProposal,

  // Clients
  getClients,
  addClient,
  syncClientToMemory,

  // Projects
  getProjects,
  addProject,
  updateProject,

  // Tasks
  getTasks,
  addTask,
  updateTask,
  deleteTask,

  // Revenue & Expenses
  getRevenue,
  addRevenue,
  getExpenses,
  addExpense,

  // Memories
  getMemories,
  addMemory,
  searchMemories,

  // Agent & Tool Logs
  getAgentLogs,
  logAgentAction,
  getToolLogs,
  logToolAction,

  // Chat
  getChatMessages,
  addChatMessage,
  clearChatMessages,

  // Content & Daily Reports
  getContentIdeas,
  addContentIdea,
  updateContentIdea,
  getDailyReports,
  addDailyReport,

  // Entity — Approval Queue (propose-then-approve)
  getApprovalRequests,
  addApprovalRequest,
  updateApprovalRequest,

  // Entity — Goal Cascade
  getEntityGoals,
  addEntityGoal,
  updateEntityGoal,

  // NOTE: `resetDatabase` (src/lib/db/seed.ts) is deliberately NOT exposed here.
  // It deletes every row across 15 tables for the current user with no
  // confirmation, and nothing calls it — leaving it on the shared `db` object
  // meant any future code could reach it by autocomplete. Import it directly,
  // behind an explicit confirmation, if a reset feature is ever built.
};
