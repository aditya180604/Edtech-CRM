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
  duration?: string;
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
  restartCount?: number;
  canRestart?: boolean;
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
    admissionStatus?: 'WAITING' | 'ADMITTED' | 'LEFT' | 'ENDED' | 'HOST' | null;
  } | null;
  instructorOnline?: boolean;
  resources: LiveResource[];
  chatMessages: LiveChatMessage[];
  qa: LiveQA[];
  raisedHands: RaisedHandItem[];
  userNotes?: string;
  livekitServerUrl?: string;
  hostStreamState?: {
    cameraEnabled?: boolean;
    micEnabled?: boolean;
    screenShareActive?: boolean;
    isInstructorSpeaking?: boolean;
    audioLevel?: number;
  };
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

export interface WebinarLobbyState {
  roomCode: string;
  title: string;
  status: LiveRoomState['status'];
  startTime: string;
  endTime: string;
  instructor: LiveRoomState['instructor'];
  instructorOnline: boolean;
  isHost: boolean;
  admissionStatus: 'WAITING' | 'ADMITTED' | 'LEFT' | 'ENDED' | 'HOST' | null;
  waitingCount?: number;
  waitingParticipants?: Array<{
    userId: string;
    name: string;
    email: string;
    avatar?: string | null;
    joinedAt: string;
  }>;
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

  // Register for a webinar (Free)
  async register(webinarId: string): Promise<{ success: boolean; data: { registered: boolean; registrationsCount: number; message: string; requiresPayment?: boolean; price?: number } }> {
    const res = await apiClient.post(`/webinars/${webinarId}/register`);
    return res.data;
  },

  // Create Cashfree checkout session for a paid webinar
  async createCheckoutOrder(webinarId: string): Promise<{
    success: boolean;
    data: {
      requiresPayment?: boolean;
      orderId?: string;
      cfOrderId?: string;
      paymentSessionId?: string;
      environment?: string;
      price?: number;
      registered?: boolean;
      message?: string;
    };
  }> {
    const res = await apiClient.post(`/webinars/${webinarId}/checkout`);
    return res.data;
  },

  // Verify Cashfree payment for a webinar ticket
  async verifyPayment(webinarId: string, orderId: string): Promise<{
    success: boolean;
    data: {
      registered: boolean;
      paymentId?: string;
      message: string;
    };
  }> {
    const res = await apiClient.post(`/webinars/${webinarId}/verify-payment`, { orderId });
    return res.data;
  },

  // Real-Time Live Webinar Classroom Endpoints
  async getLiveRoom(roomCode: string): Promise<{ success: boolean; data: LiveRoomState }> {
    const res = await apiClient.get(`/webinars/room/${roomCode}`);
    return res.data;
  },

  async joinLobby(roomCode: string): Promise<{ success: boolean; data: { status: string; roomCode: string } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/lobby/join`);
    return res.data;
  },

  async getLobbyState(roomCode: string): Promise<{ success: boolean; data: WebinarLobbyState }> {
    const res = await apiClient.get(`/webinars/room/${roomCode}/lobby`);
    return res.data;
  },

  async admitStudent(roomCode: string, userId: string): Promise<{ success: boolean; data: { userId: string; status: string } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/admit/${userId}`);
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

  async restartWebinar(roomCode: string): Promise<{
    success: boolean;
    data: { success: boolean; status: string; restartCount: number; notificationsSent: boolean; message: string };
  }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/restart`);
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

  async updateBroadcastState(
    roomCode: string,
    state: {
      cameraEnabled?: boolean;
      micEnabled?: boolean;
      screenShareActive?: boolean;
      isInstructorSpeaking?: boolean;
      audioLevel?: number;
    }
  ): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/broadcast-state`, state);
    return res.data;
  },

  async sendSignal(roomCode: string, signal: any): Promise<{ success: boolean }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/signal`, signal);
    return res.data;
  },

  async getSignals(
    roomCode: string,
    since = 0,
    excludeSenderId?: string
  ): Promise<{ success: boolean; data: { signals: any[] } }> {
    const res = await apiClient.get(`/webinars/room/${roomCode}/signal`, {
      params: { since, excludeSenderId },
    });
    return res.data;
  },

  async reopenOrRejoinRoom(roomCode: string): Promise<{ success: boolean; data?: { success: boolean; status: string; message: string } }> {
    const res = await apiClient.post(`/webinars/room/${roomCode}/reopen`);
    return res.data;
  },
};
