/**
 * In-Memory Storage for Agents
 */

import type {
  AgentConfig,
  AgentSession,
  AgentStorage,
  AgentType,
} from './types';

export class InMemoryAgentStorage implements AgentStorage {
  private agents: Map<string, AgentConfig> = new Map();
  private sessions: Map<string, AgentSession> = new Map();

  async saveAgent(agent: AgentConfig): Promise<void> {
    this.agents.set(agent.id, agent);
  }

  async getAgent(agentId: string): Promise<AgentConfig | null> {
    return this.agents.get(agentId) || null;
  }

  async listAgents(filter?: { type?: AgentType }): Promise<AgentConfig[]> {
    let agents = Array.from(this.agents.values());

    if (filter?.type) {
      agents = agents.filter((a) => a.type === filter.type);
    }

    return agents;
  }

  async deleteAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
  }

  async saveSession(session: AgentSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async getSession(sessionId: string): Promise<AgentSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async listSessions(filter?: {
    agentId?: string;
    userId?: string;
  }): Promise<AgentSession[]> {
    let sessions = Array.from(this.sessions.values());

    if (filter?.agentId) {
      sessions = sessions.filter((s) => s.agentId === filter.agentId);
    }

    if (filter?.userId) {
      sessions = sessions.filter((s) => s.userId === filter.userId);
    }

    return sessions;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
