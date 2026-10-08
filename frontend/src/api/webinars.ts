import { apiClient } from './client';

export interface WebinarItem {
  _id: string;
  id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  category: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  capacity?: number;
  price: number;
  currency?: string;
  status: string;
  isLive: boolean;
  instructorId?: string;
  instructorName: string;
  instructorAvatar?: string | null;
  instructorHeadline?: string;
  registrationsCount?: number;
  isUserRegistered?: boolean;
  meetingUrl?: string | null;
  roomCode?: string;
  meetingType?: 'IN_PLATFORM' | 'EXTERNAL';
  date: string;
  time: string;
}

export interface LiveChatMessage {
  id: string;
  senderId: string | null;
  senderName: string;
  senderRole: 'HOST' | 'STUDENT' | 'ADMIN';
  senderAvatar?: string | null;
  message: string;
  createdAt: string;
}

export interface LiveQA {
  id: string;
  question: string;
  senderId: string | null;
  senderName: string;
  senderAvatar?: string | null;
  upvotesCount: number;
  hasUpvoted: boolean;
  answered: boolean;
  answeredAt?: string | null;
  createdAt: string;
}

export interface RaisedHandItem {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  raisedAt: string;
  canSpeak: boolean;
}

export interface LiveResource {
  title: string;
  url: string;
  type: string;
  size: string;
}

export interface LiveRoomState {
  id: string;
  _id: string;
  roomCode: string;
  title: string;
  description?: string;
  category: string;
  startTime: string;
  endTime: string;
  actualStartedAt?: string | null;
  actualEndedAt?: string | null;
  status: 'SCHEDULED' | 'STARTING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  price: number;
  currency: string;
  capacity: number;
  registrationsCount: number;
  attendanceCount?: number;
  onlineCount?: number;
  attendees?: Array<{
    userId: string;
    userName: string;
    userAvatar?: string | null;
    role: string;
    isOnline?: boolean;
    joinedAt?: string;
  }>;
  instructor: {
    id?: string;
    name: string;
    avatar?: string | null;
    headline?: string;
    bio?: string;
  };
  hasAccess: boolean;
  isHost: boolean;
  isRegistered: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: string;
  } | null;
  resources: LiveResource[];
  chatMessages: LiveChatMessage[];
  qa: LiveQA[];
  raisedHands: RaisedHandItem[];
  userNotes?: string;
  livekitServerUrl?: string;
}

export interface LiveKitTokenResponse {
  allowed: boolean;
  token: string;
  serverUrl: string;
  role: 'HOST' | 'STUDENT';
  roomCode: string;
  roomName: string;
  webinarStatus: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    role: 'HOST' | 'STUDENT';
  };
}

export const webinarsApi = {
  // Fetch active and upcoming webinars sorted chronologically by date/time
  async getUpcomingWebinars(): Promise<{ success: boolean; data: { webinars: WebinarItem[]; count: number; hasUpcoming: boolean } }> {
    const res = await apiClient.get('/webinars/upcoming');
    return res.data;
  },

  // Fetch catalog / filtered webinars
  async getWebinars(params?: { category?: string; search?: string }): Promise<{ success: boolean; data: { webinars: WebinarItem[]; count: number; hasUpcoming: boolean } }> {
    const res = await apiClient.get('/webinars', { params });
    return res.data;
  },

  // Fetch webinar details
  async getWebinarById(id: string) {
    const res = await apiClient.get(`/webinars/${id}`);
    return res.data;
  },

  // Register for a webinar
  async register(webinarId: string): Promise<{ success: boolean; data: { registered: boolean; registrationsCount: number; message: string } }> {
    const res = await apiClient.post(`/webinars/${webinarId}/register`);
    return res.data;
  },

  // Real-Time Live Webinar Classroom Endpoints
  async getLiveRoom(roomCode: string): Promise<{ success: boolean; data: LiveRoomState }> {
    const res = await apiClient.get(`/webinars/room/${roomCode}`);
    return res.data;
  },

  async getLiveKitToken(roomCode: string): Promise<{ success: boolean; data: LiveKitTokenResponse }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/token`);
    return res.data;
  },

  async startWebinar(roomCode: string): Promise<{ success: boolean; data: { success: boolean; status: string; actualStartedAt: string } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/start`);
    return res.data;
  },

  async endWebinar(roomCode: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/end`);
    return res.data;
  },

  async sendChatMessage(roomCode: string, message: string): Promise<{ success: boolean; data: LiveChatMessage }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/chat`, { message });
    return res.data;
  },

  async submitQuestion(roomCode: string, question: string): Promise<{ success: boolean; data: LiveQA }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/qa`, { question });
    return res.data;
  },

  async toggleUpvoteQuestion(roomCode: string, qaId: string): Promise<{ success: boolean; data: { qaId: string; upvotesCount: number; hasUpvoted: boolean } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/qa/${qaId}/upvote`);
    return res.data;
  },

  async answerQuestion(roomCode: string, qaId: string): Promise<{ success: boolean; data: { qaId: string; answered: boolean; answeredAt: string } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/qa/${qaId}/answer`);
    return res.data;
  },

  async toggleRaiseHand(roomCode: string): Promise<{ success: boolean; data: { isRaised: boolean; raisedHands: RaisedHandItem[] } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/raise-hand`);
    return res.data;
  },

  async allowSpeak(roomCode: string, targetUserId: string, canSpeak: boolean): Promise<{ success: boolean; data: { targetUserId: string; canSpeak: boolean } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/allow-speak`, { targetUserId, canSpeak });
    return res.data;
  },

  async saveNotes(roomCode: string, notes: string): Promise<{ success: boolean; data: { success: boolean; notes: string } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/notes`, { notes });
    return res.data;
  },

  async leaveRoom(roomCode: string): Promise<{ success: boolean }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/leave`);
    return res.data;
  },
};
