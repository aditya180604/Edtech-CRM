import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  Users,
  MessageSquare,
  Hand,
  Sparkles,
  Send,
  Lock,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  FileText,
  HelpCircle,
  Volume2,
  VolumeX,
  ThumbsUp,
  Check,
  Share2,
  LogOut,
  Radio,
  Wifi,
  AlertCircle,
  Edit3,
  Save,
  Download,
  Play,
  Square,
  StopCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';

import {
  webinarsApi,
  type LiveRoomState,
  type LiveChatMessage,
  type LiveQA,
  type RaisedHandItem,
} from '../api/webinars';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';

// =========================================================================
// REAL-TIME IN-PLATFORM LIVE CLASSROOM STUDIO
// =========================================================================
interface LiveClassroomStudioProps {
  roomState: LiveRoomState;
  role: 'HOST' | 'STUDENT';
  onWebinarEnded: () => void;
  onLeave: () => void;
  onRefreshRoom: () => Promise<void>;
}

// Global active media stream cache for cross-component and local peer bridging
declare global {
  interface Window {
    __edtech_active_streams?: Record<string, { cameraStream?: MediaStream | null; screenStream?: MediaStream | null }>;
  }
}

interface ParticipantInfo {
  id: string;
  name: string;
  avatar?: string | null;
  role: 'HOST' | 'STUDENT' | 'ADMIN';
  isOnline: boolean;
  isSpeaking?: boolean;
  hasHandRaised?: boolean;
  canSpeak?: boolean;
}

const LiveClassroomStudio: React.FC<LiveClassroomStudioProps> = ({
  roomState,
  role,
  onWebinarEnded,
  onLeave,
  onRefreshRoom,
}) => {
  const { user } = useAuth();
  const { success, info, error: toastError } = useToast();

  const isHost = role === 'HOST';

  // Video & Audio Stream State
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInstructorSpeaking, setIsInstructorSpeaking] = useState(false);
  const [mutedIncoming, setMutedIncoming] = useState(false);

  // Video Element References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localPipVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remotePipVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Media Stream References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteScreenStreamRef = useRef<MediaStream | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'attendees' | 'notes' | 'resources'>('chat');

  // Real-Time Chat
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>(roomState.chatMessages || []);
  const [messageInput, setMessageInput] = useState('');
  const [isQuestionMode, setIsQuestionMode] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Real-Time Q&A
  const [qaList, setQaList] = useState<LiveQA[]>(roomState.qa || []);
  const [qaInput, setQaInput] = useState('');
  const [isSubmittingQa, setIsSubmittingQa] = useState(false);

  // Real-Time Raised Hands
  const [raisedHands, setRaisedHands] = useState<RaisedHandItem[]>(roomState.raisedHands || []);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Private Student Notes
  const [notes, setNotes] = useState(roomState.userNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Modals & Controls
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Real-Time Connected Participants List
  const [activeParticipants, setActiveParticipants] = useState<ParticipantInfo[]>(() => {
    const list: ParticipantInfo[] = [];
    // 1. Host
    list.push({
      id: roomState.instructor.id || 'host',
      name: roomState.instructor.name,
      avatar: roomState.instructor.avatar || null,
      role: 'HOST',
      isOnline: true,
      isSpeaking: false,
    });

    // 2. Initial attendees from roomState
    if (Array.isArray(roomState.attendees)) {
      roomState.attendees.forEach((att) => {
        if (att.userId && att.userId !== roomState.instructor.id) {
          list.push({
            id: att.userId,
            name: att.userName,
            avatar: att.userAvatar || null,
            role: (att.role as any) || 'STUDENT',
            isOnline: att.isOnline !== false,
          });
        }
      });
    }

    // 3. Current User if Student
    if (user) {
      const myId = ((user as any)._id || (user as any).id)?.toString();
      const myName = `${user.firstName || 'Student'} ${user.lastName || ''}`.trim();
      if (myId && !list.some((p) => p.id === myId)) {
        list.push({
          id: myId,
          name: myName,
          avatar: (user as any).profilePhoto || null,
          role: isHost ? 'HOST' : 'STUDENT',
          isOnline: true,
        });
      }
    }

    return list;
  });

  // Ensure window stream cache is initialized
  useEffect(() => {
    if (!window.__edtech_active_streams) {
      window.__edtech_active_streams = {};
    }
    if (!window.__edtech_active_streams[roomState.roomCode]) {
      window.__edtech_active_streams[roomState.roomCode] = {};
    }
  }, [roomState.roomCode]);

  // Setup Real-Time BroadcastChannel for stream state, peer signaling & presence sync
  useEffect(() => {
    const channelName = `edtech_webinar_live_${roomState.roomCode}`;
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel(channelName);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        // 1. Host broadcast state update received by Students
        if (msg.type === 'HOST_STREAM_STATE') {
          if (!isHost) {
            setCameraEnabled(Boolean(msg.cameraEnabled));
            setMicEnabled(Boolean(msg.micEnabled));
            setScreenShareActive(Boolean(msg.screenShareActive));
            setIsInstructorSpeaking(Boolean(msg.isInstructorSpeaking));
            setAudioLevel(Number(msg.audioLevel || 0));

            // Sync video elements with shared active streams
            const cached = window.__edtech_active_streams?.[roomState.roomCode];
            if (cached) {
              if (cached.screenStream && screenVideoRef.current) {
                screenVideoRef.current.srcObject = cached.screenStream;
                screenVideoRef.current.play().catch(() => {});
              }
              if (cached.cameraStream) {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = cached.cameraStream;
                  remoteVideoRef.current.play().catch(() => {});
                }
                if (remotePipVideoRef.current) {
                  remotePipVideoRef.current.srcObject = cached.cameraStream;
                  remotePipVideoRef.current.play().catch(() => {});
                }
              }
            }
          }
        }

        // 2. Participant Join/Presence Heartbeat
        if (msg.type === 'PARTICIPANT_PRESENCE') {
          const participant = msg.participant as ParticipantInfo;
          if (participant && participant.id) {
            setActiveParticipants((prev) => {
              const existingIdx = prev.findIndex((p) => p.id === participant.id);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = { ...next[existingIdx], ...participant, isOnline: true };
                return next;
              }
              return [...prev, { ...participant, isOnline: true }];
            });

            // If Host receives a new student joining, immediately respond with current broadcast state
            if (isHost && broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: 'HOST_STREAM_STATE',
                cameraEnabled,
                micEnabled,
                screenShareActive,
                isInstructorSpeaking,
                audioLevel,
                hostName: roomState.instructor.name,
              });
            }
          }
        }

        // 3. Participant Left
        if (msg.type === 'PARTICIPANT_LEFT') {
          const leftId = msg.participantId;
          if (leftId) {
            setActiveParticipants((prev) =>
              prev.map((p) => (p.id === leftId ? { ...p, isOnline: false } : p))
            );
          }
        }
      };

      // Broadcast Current User Presence
      const myId = user ? (((user as any)._id || (user as any).id)?.toString() || 'student') : 'guest';
      const myName = user ? `${user.firstName || 'Learner'} ${user.lastName || ''}`.trim() : 'Active Student';
      const myAvatar = (user as any)?.profilePhoto || null;

      const myPresence: ParticipantInfo = {
        id: myId,
        name: isHost ? roomState.instructor.name : myName,
        avatar: isHost ? roomState.instructor.avatar : myAvatar,
        role: isHost ? 'HOST' : 'STUDENT',
        isOnline: true,
      };

      bc.postMessage({
        type: 'PARTICIPANT_PRESENCE',
        participant: myPresence,
      });

      // Periodic heartbeat
      const heartbeatTimer = setInterval(() => {
        if (bc) {
          bc.postMessage({
            type: 'PARTICIPANT_PRESENCE',
            participant: myPresence,
          });

          if (isHost) {
            bc.postMessage({
              type: 'HOST_STREAM_STATE',
              cameraEnabled,
              micEnabled,
              screenShareActive,
              isInstructorSpeaking,
              audioLevel,
            });
          }
        }
      }, 2500);

      return () => {
        clearInterval(heartbeatTimer);
        if (bc) {
          bc.postMessage({
            type: 'PARTICIPANT_LEFT',
            participantId: myId,
          });
          bc.close();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel presence sync not supported:', e);
    }
  }, [roomState.roomCode, isHost, user, cameraEnabled, micEnabled, screenShareActive, isInstructorSpeaking, audioLevel, roomState.instructor]);

  // Host Initialize Local Media Streams (Camera & Mic)
  useEffect(() => {
    let active = true;

    if (isHost) {
      async function startHostMedia() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;

          // Register in global active stream cache
          if (window.__edtech_active_streams?.[roomState.roomCode]) {
            window.__edtech_active_streams[roomState.roomCode].cameraStream = stream;
          }

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }

          // Audio level detection
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              audioContextRef.current = audioCtx;
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              const source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const checkLevel = () => {
                if (!active) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                const level = Math.min(100, Math.round((avg / 128) * 100));
                setAudioLevel(level);
                const speaking = level > 12;
                setIsInstructorSpeaking(speaking);

                // Broadcast state to students
                if (broadcastChannelRef.current) {
                  broadcastChannelRef.current.postMessage({
                    type: 'HOST_STREAM_STATE',
                    cameraEnabled,
                    micEnabled,
                    screenShareActive,
                    isInstructorSpeaking: speaking,
                    audioLevel: level,
                  });
                }

                animFrameRef.current = requestAnimationFrame(checkLevel);
              };
              checkLevel();
            }
          } catch (e) {
            // Audio context not available
          }
        } catch (err: any) {
          console.warn('Could not access host camera/mic:', err);
        }
      }
      startHostMedia();
    } else {
      // Student View: Check if active streams are already running in this browser
      const cached = window.__edtech_active_streams?.[roomState.roomCode];
      if (cached) {
        if (cached.cameraStream) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = cached.cameraStream;
            remoteVideoRef.current.play().catch(() => {});
          }
          if (remotePipVideoRef.current) {
            remotePipVideoRef.current.srcObject = cached.cameraStream;
            remotePipVideoRef.current.play().catch(() => {});
          }
        }
        if (cached.screenStream && screenVideoRef.current) {
          screenVideoRef.current.srcObject = cached.screenStream;
          screenVideoRef.current.play().catch(() => {});
        }
      }
    }

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isHost, roomState.roomCode]);

  // Auto-attach video streams whenever screen share or camera state changes
  useEffect(() => {
    const cached = window.__edtech_active_streams?.[roomState.roomCode];

    if (screenShareActive) {
      const activeScreen = isHost ? screenStreamRef.current : (cached?.screenStream || null);
      if (activeScreen && screenVideoRef.current) {
        screenVideoRef.current.srcObject = activeScreen;
        screenVideoRef.current.play().catch((e) => console.warn('Screen video play:', e));
      }

      const activeCamera = isHost ? mediaStreamRef.current : (cached?.cameraStream || null);
      if (activeCamera) {
        const targetPip = isHost ? localPipVideoRef.current : remotePipVideoRef.current;
        if (targetPip) {
          targetPip.srcObject = activeCamera;
          targetPip.play().catch((e) => console.warn('PiP camera play:', e));
        }
      }
    } else {
      const activeCamera = isHost ? mediaStreamRef.current : (cached?.cameraStream || null);
      if (activeCamera) {
        const targetVideo = isHost ? localVideoRef.current : remoteVideoRef.current;
        if (targetVideo) {
          targetVideo.srcObject = activeCamera;
          targetVideo.play().catch((e) => console.warn('Camera stream play:', e));
        }
      }
    }
  }, [screenShareActive, cameraEnabled, isHost, roomState.roomCode]);

  // Sync Room Updates (Chat, Q&A, Hand Raises, Attendees) periodically
  useEffect(() => {
    let mounted = true;
    const poller = setInterval(async () => {
      try {
        const res = await webinarsApi.getLiveRoom(roomState.roomCode);
        if (res.success && res.data && mounted) {
          if (res.data.status === 'COMPLETED') {
            onWebinarEnded();
            return;
          }
          if (res.data.chatMessages) setChatMessages(res.data.chatMessages);
          if (res.data.qa) setQaList(res.data.qa);
          if (res.data.raisedHands) setRaisedHands(res.data.raisedHands);

          // Update active attendees list
          if (Array.isArray(res.data.attendees)) {
            setActiveParticipants((prev) => {
              const map = new Map(prev.map((p) => [p.id, p]));
              res.data.attendees!.forEach((att) => {
                if (att.userId) {
                  const existing = map.get(att.userId);
                  map.set(att.userId, {
                    id: att.userId,
                    name: att.userName,
                    avatar: att.userAvatar || null,
                    role: (att.role as any) || 'STUDENT',
                    isOnline: att.isOnline !== false,
                    isSpeaking: existing?.isSpeaking || false,
                    hasHandRaised: existing?.hasHandRaised || false,
                    canSpeak: existing?.canSpeak || false,
                  });
                }
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        // silent background poll error
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(poller);
    };
  }, [roomState.roomCode, onWebinarEnded]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Check if current user's hand is raised
  useEffect(() => {
    if (user) {
      const myId = (user as any)._id || (user as any).id;
      const raised = raisedHands.some((rh) => rh.userId === myId?.toString());
      setIsHandRaised(raised);
    }
  }, [raisedHands, user]);

  // Toggle Camera Track (Host)
  const handleToggleCamera = () => {
    if (mediaStreamRef.current) {
      const nextState = !cameraEnabled;
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = nextState;
      });
      setCameraEnabled(nextState);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'HOST_STREAM_STATE',
          cameraEnabled: nextState,
          micEnabled,
          screenShareActive,
          isInstructorSpeaking,
          audioLevel,
        });
      }
    }
  };

  // Toggle Mic Track (Host)
  const handleToggleMic = () => {
    if (mediaStreamRef.current) {
      const nextState = !micEnabled;
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = nextState;
      });
      setMicEnabled(nextState);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'HOST_STREAM_STATE',
          cameraEnabled,
          micEnabled: nextState,
          screenShareActive,
          isInstructorSpeaking,
          audioLevel,
        });
      }
    }
  };

  // Toggle Screen Sharing (Host)
  const handleToggleScreenShare = async () => {
    if (screenShareActive) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (window.__edtech_active_streams?.[roomState.roomCode]) {
        window.__edtech_active_streams[roomState.roomCode].screenStream = null;
      }
      setScreenShareActive(false);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'HOST_STREAM_STATE',
          cameraEnabled,
          micEnabled,
          screenShareActive: false,
          isInstructorSpeaking,
          audioLevel,
        });
      }
      console.log('[SCREEN SHARE] Screen sharing stopped by user');
    } else {
      try {
        console.log('[SCREEN SHARE] Screen sharing requested');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        console.log('[SCREEN SHARE] getDisplayMedia: SUCCESS');

        const screenTrack = screenStream.getVideoTracks()[0];
        screenStreamRef.current = screenStream;

        if (window.__edtech_active_streams?.[roomState.roomCode]) {
          window.__edtech_active_streams[roomState.roomCode].screenStream = screenStream;
        }

        setScreenShareActive(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          screenVideoRef.current.play().catch(() => {});
        }

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'HOST_STREAM_STATE',
            cameraEnabled,
            micEnabled,
            screenShareActive: true,
            isInstructorSpeaking,
            audioLevel,
          });
        }

        // Handle user stopping screen share from Chrome's floating "Stop sharing" bar
        screenTrack.onended = () => {
          console.log('[SCREEN SHARE] stopped by browser onended event');
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
          }
          if (window.__edtech_active_streams?.[roomState.roomCode]) {
            window.__edtech_active_streams[roomState.roomCode].screenStream = null;
          }
          setScreenShareActive(false);
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: 'HOST_STREAM_STATE',
              cameraEnabled,
              micEnabled,
              screenShareActive: false,
              isInstructorSpeaking,
              audioLevel,
            });
          }
        };
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          console.error('[SCREEN SHARE] Error:', err);
          toastError('Screen Share Error', err.message || 'Could not start screen share.');
        }
      }
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSendingChat) return;
    const text = messageInput.trim();
    setMessageInput('');
    setIsSendingChat(true);

    try {
      if (isQuestionMode) {
        const res = await webinarsApi.submitQuestion(roomState.roomCode, text);
        if (res.success && res.data) {
          setQaList((prev) => [res.data, ...prev]);
          setActiveTab('qa');
          success('Question Submitted', 'Your question has been added to the instructor Q&A queue.');
        }
      } else {
        const res = await webinarsApi.sendChatMessage(roomState.roomCode, text);
        if (res.success && res.data) {
          setChatMessages((prev) => [...prev, res.data]);
        }
      }
    } catch (err: any) {
      toastError('Send Failed', err.response?.data?.message || 'Could not send message.');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Submit Q&A
  const handleSubmitQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInput.trim() || isSubmittingQa) return;
    setIsSubmittingQa(true);
    try {
      const res = await webinarsApi.submitQuestion(roomState.roomCode, qaInput.trim());
      if (res.success && res.data) {
        setQaList((prev) => [res.data, ...prev]);
        setQaInput('');
        success('Question Submitted', 'Your question has been submitted to the host.');
      }
    } catch (err: any) {
      toastError('Q&A Error', err.response?.data?.message || 'Could not submit question.');
    } finally {
      setIsSubmittingQa(false);
    }
  };

  // Upvote Question
  const handleUpvote = async (qaId: string) => {
    try {
      const res = await webinarsApi.toggleUpvoteQuestion(roomState.roomCode, qaId);
      if (res.success && res.data) {
        setQaList((prev) =>
          prev.map((q) =>
            q.id === qaId
              ? { ...q, upvotesCount: res.data.upvotesCount, hasUpvoted: res.data.hasUpvoted }
              : q
          )
        );
      }
    } catch (err: any) {
      toastError('Upvote Error', err.response?.data?.message || 'Could not update upvote.');
    }
  };

  // Host Mark Question as Answered
  const handleMarkAnswered = async (qaId: string) => {
    if (!isHost) return;
    try {
      const res = await webinarsApi.answerQuestion(roomState.roomCode, qaId);
      if (res.success) {
        setQaList((prev) =>
          prev.map((q) =>
            q.id === qaId ? { ...q, answered: true, answeredAt: res.data.answeredAt } : q
          )
        );
        success('Marked Answered', 'Question marked as answered.');
      }
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Could not mark question as answered.');
    }
  };

  // Toggle Raise Hand
  const handleToggleRaiseHand = async () => {
    try {
      const res = await webinarsApi.toggleRaiseHand(roomState.roomCode);
      if (res.success && res.data) {
        setIsHandRaised(res.data.isRaised);
        setRaisedHands(res.data.raisedHands || []);
        if (res.data.isRaised) {
          info('Hand Raised', 'The instructor has been notified that you wish to speak.');
        } else {
          info('Hand Lowered', 'You lowered your hand.');
        }
      }
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Could not update hand raise.');
    }
  };

  // Host Allow Student to Speak
  const handleAllowSpeak = async (targetUserId: string, canSpeak: boolean) => {
    if (!isHost) return;
    try {
      await webinarsApi.allowSpeak(roomState.roomCode, targetUserId, canSpeak);
      setRaisedHands((prev) =>
        prev.map((rh) => (rh.userId === targetUserId ? { ...rh, canSpeak } : rh))
      );
      success('Permission Updated', canSpeak ? 'Student granted microphone access.' : 'Student microphone muted.');
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Could not update speak permission.');
    }
  };

  // Save Private Student Notes
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await webinarsApi.saveNotes(roomState.roomCode, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
      success('Notes Saved', 'Your personal workshop notes have been saved.');
    } catch (err: any) {
      toastError('Save Error', err.response?.data?.message || 'Could not save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Host Confirm End Webinar
  const handleConfirmEndWebinar = async () => {
    setIsEndingSession(true);
    try {
      await webinarsApi.endWebinar(roomState.roomCode);
      setShowEndModal(false);
      success('Session Ended', 'The live webinar session has ended.');
      onWebinarEnded();
    } catch (err: any) {
      toastError('End Session Error', err.response?.data?.message || 'Could not end webinar.');
    } finally {
      setIsEndingSession(false);
    }
  };

  // Computed online count
  const onlineCount = Math.max(
    activeParticipants.filter((p) => p.isOnline !== false).length,
    roomState.onlineCount || 0,
    roomState.registrationsCount || 0,
    1
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden select-none font-sans">
      {/* Top Navbar / Studio Status Header */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20 shrink-0 shadow-lg">
        {/* Left: Brand & Webinar Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLeave}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Leave Classroom"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1 shadow-sm">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE NOW
              </span>
              <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                {roomState.category}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white truncate max-w-[200px] sm:max-w-md md:max-w-lg">
              {roomState.title}
            </h1>
          </div>
        </div>

        {/* Center: Live Broadcast Info Badge */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold shadow-inner">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>EduTech Live Studio</span>
          <span className="text-slate-600">•</span>
          <span className="text-indigo-400 font-bold">{isHost ? 'Host Broadcasting' : 'Connected'}</span>
        </div>

        {/* Right: Participants Count & Leave / End Session */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-200">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{onlineCount} Online</span>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              success('Link Copied', 'Live room URL copied to clipboard.');
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Share Room"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Host End Session OR Student Leave Button */}
          {isHost ? (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>End Webinar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLeave}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Broadcast Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Center Live Stage */}
        <main className="flex-1 flex flex-col justify-between p-3 sm:p-5 overflow-hidden bg-slate-950">
          <div className="w-full flex-1 rounded-3xl bg-slate-900 border border-slate-800/80 overflow-hidden relative flex flex-col items-center justify-between shadow-2xl">
            {/* Primary Video / Broadcast Canvas View */}
            <div className="w-full flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              {/* Screen Share Stage View (Host or Student) */}
              {screenShareActive ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {/* Host Camera Picture-in-Picture */}
                  {cameraEnabled && (
                    <div className="absolute bottom-4 right-4 w-44 h-28 sm:w-56 sm:h-36 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-slate-900 z-20">
                      <video
                        ref={isHost ? localPipVideoRef : remotePipVideoRef}
                        autoPlay
                        playsInline
                        muted={isHost}
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{roomState.instructor.name} (Host)</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs text-white font-bold">
                    <ScreenShare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live Screen Share</span>
                  </div>
                </div>
              ) : cameraEnabled ? (
                /* Live Camera Stream (Host Preview or Student Remote Stream) */
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <video
                    ref={isHost ? localVideoRef : remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={isHost ? true : mutedIncoming}
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Live Studio Active</span>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs text-white font-semibold">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                      {roomState.instructor.name?.[0] || 'H'}
                    </div>
                    <span>{roomState.instructor.name} (Host)</span>
                  </div>
                </div>
              ) : (
                /* Instructor Profile Stage Card (When Camera is Off) */
                <div className="text-center p-8 max-w-md space-y-4 animate-in fade-in">
                  <div className="relative inline-block">
                    {roomState.instructor.avatar ? (
                      <img
                        src={roomState.instructor.avatar}
                        alt={roomState.instructor.name}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover mx-auto ring-4 ring-indigo-500/30 shadow-2xl shadow-indigo-500/20"
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-4xl flex items-center justify-center mx-auto shadow-2xl">
                        {roomState.instructor.name?.[0] || 'I'}
                      </div>
                    )}

                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                      ✓
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {roomState.instructor.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 mt-0.5">
                      {roomState.instructor.headline || 'Lead Instructor & Workshop Host'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Streaming live via EduTech Built-in Studio. Interactive chat & materials active.
                    </p>
                  </div>

                  {/* Live Speaking Indicator */}
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    <span
                      className={`w-1.5 h-6 rounded-full transition-all duration-150 ${
                        isInstructorSpeaking ? 'bg-indigo-400 h-8 animate-pulse' : 'bg-slate-700 h-4'
                      }`}
                    ></span>
                    <span
                      className={`w-1.5 h-8 rounded-full transition-all duration-150 ${
                        isInstructorSpeaking ? 'bg-indigo-500 h-10 animate-pulse' : 'bg-slate-700 h-5'
                      }`}
                    ></span>
                    <span
                      className={`w-1.5 h-5 rounded-full transition-all duration-150 ${
                        isInstructorSpeaking ? 'bg-indigo-400 h-7 animate-pulse' : 'bg-slate-700 h-3'
                      }`}
                    ></span>
                    <span
                      className={`w-1.5 h-7 rounded-full transition-all duration-150 ${
                        isInstructorSpeaking ? 'bg-indigo-600 h-9 animate-pulse' : 'bg-slate-700 h-4'
                      }`}
                    ></span>
                  </div>
                </div>
              )}

              {/* Speaking Alert Overlay */}
              {isInstructorSpeaking && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 flex items-center gap-2 text-xs font-bold text-white shadow-lg animate-in fade-in">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{roomState.instructor.name} is speaking</span>
                </div>
              )}
            </div>

            {/* MULTI-PARTICIPANT VIDEO & AVATAR THUMBNAIL STRIP */}
            <div className="w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 flex items-center gap-3 overflow-x-auto z-10 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Active ({activeParticipants.length})</span>
              </div>

              {/* Host Thumbnail Tile */}
              <div className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-slate-900 border border-indigo-500/40 shrink-0 shadow-md">
                <div className="relative">
                  {roomState.instructor.avatar ? (
                    <img
                      src={roomState.instructor.avatar}
                      alt={roomState.instructor.name}
                      className="w-7 h-7 rounded-xl object-cover ring-2 ring-indigo-500"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                      {roomState.instructor.name?.[0] || 'H'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-black text-white truncate max-w-[100px]">
                      {roomState.instructor.name}
                    </p>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 uppercase">
                      Host
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Mic className="w-2.5 h-2.5" /> Broadcasting
                  </p>
                </div>
              </div>

              {/* Connected Student Tiles */}
              {activeParticipants
                .filter((p) => p.role !== 'HOST' && p.id !== (roomState.instructor.id || 'host'))
                .map((student) => {
                  const hasRaised = raisedHands.some((rh) => rh.userId === student.id);
                  const canSpeak = raisedHands.find((rh) => rh.userId === student.id)?.canSpeak;
                  const isCurrentUser = user && ((user as any)._id || (user as any).id)?.toString() === student.id;

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-2 p-1.5 pr-3 rounded-2xl border transition-all shrink-0 ${
                        hasRaised
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="relative">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className={`w-7 h-7 rounded-xl object-cover ${
                              hasRaised ? 'ring-2 ring-amber-400' : 'ring-1 ring-slate-700'
                            }`}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-700">
                            {student.name?.[0] || 'S'}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                            student.isOnline !== false ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                        ></span>
                      </div>

                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                            {student.name} {isCurrentUser && '(You)'}
                          </p>
                          {hasRaised && <span className="text-xs">✋</span>}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {canSpeak ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Mic className="w-2.5 h-2.5" /> Mic Granted
                            </span>
                          ) : (
                            'Learner'
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Bottom Broadcast Control Dock */}
          <div className="h-16 mt-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 px-4 flex items-center justify-between shrink-0">
            {/* Left Controls: Raise Hand (Student) */}
            <div className="flex items-center gap-2">
              {!isHost && (
                <button
                  type="button"
                  onClick={handleToggleRaiseHand}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                    isHandRaised
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>{isHandRaised ? 'Hand Raised ✋' : 'Raise Hand'}</span>
                </button>
              )}

              {/* Volume Mute Incoming Audio Toggle */}
              <button
                type="button"
                onClick={() => setMutedIncoming(!mutedIncoming)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                title={mutedIncoming ? 'Unmute Live Audio' : 'Mute Live Audio'}
              >
                {mutedIncoming ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Center Controls: Host Mic / Camera / Screen Share */}
            {isHost ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-3 rounded-2xl font-bold transition cursor-pointer shadow-md ${
                    micEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`p-3 rounded-2xl font-bold transition cursor-pointer shadow-md ${
                    cameraEnabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {cameraEnabled ? <Video className="w-5 h-5 text-indigo-400" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleScreenShare}
                  className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
                    screenShareActive
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <ScreenShare className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {screenShareActive ? 'Stop Sharing' : 'Share Screen'}
                  </span>
                </button>
              </div>
            ) : (
              /* Student Mic if granted permission */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  disabled={!raisedHands.find((rh) => rh.userId === (user as any)?._id?.toString())?.canSpeak}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    !raisedHands.find((rh) => rh.userId === (user as any)?._id?.toString())?.canSpeak
                      ? 'opacity-40 bg-slate-800 text-slate-400 cursor-not-allowed'
                      : micEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{micEnabled ? 'Mic Active' : 'Mic Muted'}</span>
                </button>
              </div>
            )}

            {/* Right Controls: Tab Switchers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'qa'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Q&A
              </button>
            </div>
          </div>
        </main>

        {/* Right Interactive Sidebar */}
        <aside className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-80 lg:h-auto shrink-0">
          {/* Tabs Navigation Header */}
          <div className="flex border-b border-slate-800 p-2 gap-1 overflow-x-auto text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qa')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qa'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Q&A</span>
              {qaList.filter((q) => !q.answered).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">
                  {qaList.filter((q) => !q.answered).length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendees')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'attendees'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendees</span>
              {raisedHands.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {raisedHands.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Files</span>
            </button>
          </div>

          {/* TAB 1: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40 text-indigo-400" />
                    <p className="text-xs font-semibold">Welcome to the Live Chat!</p>
                    <p className="text-[11px] text-slate-400">
                      Say hello and introduce yourself to fellow learners.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMsgHost = msg.senderRole === 'HOST' || msg.senderRole === 'ADMIN';
                    return (
                      <div key={msg.id} className="space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white">{msg.senderName}</span>
                            {isMsgHost && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Host
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-200 leading-relaxed break-words">
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setIsQuestionMode(!isQuestionMode)}
                    className={`text-[11px] font-bold flex items-center gap-1 transition ${
                      isQuestionMode ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isQuestionMode ? 'Submitting to Q&A Queue' : 'Send as Normal Chat'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={isQuestionMode ? 'Ask a question for the instructor...' : 'Type a live message...'}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSendingChat}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-40 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: LIVE Q&A */}
          {activeTab === 'qa' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {qaList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4 space-y-2">
                    <HelpCircle className="w-8 h-8 opacity-40 text-amber-400" />
                    <p className="text-xs font-semibold">No Questions Yet</p>
                    <p className="text-[11px] text-slate-400">
                      Submit a question for the host to answer during the live workshop.
                    </p>
                  </div>
                ) : (
                  qaList.map((qa) => (
                    <div
                      key={qa.id}
                      className={`p-3.5 rounded-2xl border space-y-2 ${
                        qa.answered
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{qa.senderName}</span>
                        {qa.answered ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Answered
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold">Pending Answer</span>
                        )}
                      </div>

                      <p className="text-slate-200 leading-relaxed">{qa.question}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                        <button
                          type="button"
                          onClick={() => handleUpvote(qa.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            qa.hasUpvoted
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{qa.upvotesCount || 0} Upvotes</span>
                        </button>

                        {isHost && !qa.answered && (
                          <button
                            type="button"
                            onClick={() => handleMarkAnswered(qa.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-[10px] transition cursor-pointer border border-emerald-500/30"
                          >
                            Mark Answered
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Question Form */}
              <form onSubmit={handleSubmitQa} className="p-3 border-t border-slate-800 bg-slate-900/80 flex gap-2">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a question for the live Q&A..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={!qaInput.trim() || isSubmittingQa}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer shadow-md shrink-0"
                >
                  Ask
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ATTENDEES & RAISED HANDS */}
          {activeTab === 'attendees' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {/* Raised Hands Queue */}
              {raisedHands.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs">
                    <Hand className="w-4 h-4" />
                    <span>Raised Hands Queue ({raisedHands.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {raisedHands.map((rh) => (
                      <div
                        key={rh.userId}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          <span className="font-bold text-white text-xs">{rh.userName}</span>
                        </div>

                        {isHost && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAllowSpeak(rh.userId, !rh.canSpeak)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                rh.canSpeak
                                  ? 'bg-red-600 text-white'
                                  : 'bg-emerald-600 text-white shadow-sm'
                              }`}
                            >
                              {rh.canSpeak ? 'Mute' : 'Allow Mic'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Participants List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Connected Participants ({activeParticipants.length})
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {onlineCount} Online
                  </span>
                </div>

                {/* Host Item */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-indigo-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs ring-2 ring-indigo-500">
                      {roomState.instructor.name?.[0] || 'H'}
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-xs">{roomState.instructor.name}</p>
                      <p className="text-[10px] text-indigo-400">Host / Instructor</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Broadcaster
                  </span>
                </div>

                {/* Student Attendees */}
                {activeParticipants
                  .filter((p) => p.role !== 'HOST' && p.id !== (roomState.instructor.id || 'host'))
                  .map((student) => {
                    const isCurrentUser = user && ((user as any)._id || (user as any).id)?.toString() === student.id;
                    const canSpeak = raisedHands.find((rh) => rh.userId === student.id)?.canSpeak;
                    return (
                      <div
                        key={student.id}
                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs border border-slate-600">
                            {student.name?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">
                              {student.name} {isCurrentUser && '(You)'}
                            </p>
                            <p className="text-[10px] text-slate-400">Student Attendee</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canSpeak && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400">
                              Mic Active
                            </span>
                          )}
                          <span
                            className={`w-2 h-2 rounded-full ${
                              student.isOnline !== false ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                            title={student.isOnline !== false ? 'Online' : 'Offline'}
                          ></span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: PRIVATE STUDENT NOTES */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col p-4 space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-white text-xs">Private Workshop Notes</h4>
                <p className="text-[11px] text-slate-400">
                  Notes are private to your student profile and automatically saved.
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your personal observations, takeaways, key commands, and learning points here..."
                className="flex-1 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {notesSaved ? '✓ Saved to your profile' : 'Auto-sync active'}
                </span>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOADABLE RESOURCES */}
          {activeTab === 'resources' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-white text-xs">Workshop Materials & Files</h4>
                <p className="text-[11px] text-slate-400">
                  Authorized downloadable resources provided by the instructor.
                </p>
              </div>

              <div className="space-y-2">
                {roomState.resources.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{file.title}</p>
                        <p className="text-[10px] text-slate-400">{file.size} • {file.type}</p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download
                      onClick={(e) => {
                        if (file.url === '#') {
                          e.preventDefault();
                          info('Resource Download', `Downloading ${file.title}`);
                        }
                      }}
                      className="p-2 bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl transition cursor-pointer shrink-0"
                      title="Download Resource"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Confirmation Modal: End Webinar */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <StopCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">End Live Session?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to end this live webinar? All connected learners will be notified and attendance records will be saved.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndWebinar}
                disabled={isEndingSession}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isEndingSession ? 'Ending...' : 'Yes, End Webinar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// HOST PREFLIGHT STUDIO (Instructor Pre-Broadcast Room)
// =========================================================================
interface HostPreflightStudioProps {
  roomState: LiveRoomState;
  onStartWebinar: () => Promise<void>;
  isStarting: boolean;
  onBack: () => void;
}

const HostPreflightStudio: React.FC<HostPreflightStudioProps> = ({
  roomState,
  onStartWebinar,
  isStarting,
  onBack,
}) => {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Local Media Stream for Preflight
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Set up Audio Analyser for visual volume meter
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkLevel = () => {
              if (!active) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animationFrameRef.current = requestAnimationFrame(checkLevel);
            };
            checkLevel();
          }
        } catch (e) {
          console.warn('AudioContext visualization not available:', e);
        }
      } catch (err: any) {
        console.warn('Could not access media devices:', err);
        setMediaError(err.message || 'Camera or microphone access denied');
      }
    }

    initMedia();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Toggle Camera Track
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !cameraEnabled;
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  // Toggle Mic Track
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full space-y-6 animate-in fade-in duration-300">
        {/* Studio Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Host Live Studio Preflight
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{roomState.title}</h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {roomState.category}
            </span>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Camera / Mic Preview (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-between space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-full relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {mediaError ? (
                <div className="p-6 text-center space-y-2 text-slate-400">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Camera/Mic Unavailable</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">{mediaError}</p>
                </div>
              ) : cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl ring-4 ring-indigo-500/20">
                    {roomState.instructor?.name?.[0] || 'H'}
                  </div>
                  <p className="text-xs font-bold text-slate-400">Camera is turned off</p>
                </div>
              )}

              {/* Host Overlay Badge */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold text-white">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Host Camera Preview</span>
              </div>
            </div>

            {/* Device Controls & Live Audio Meter */}
            <div className="w-full flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                    cameraEnabled
                      ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                    micEnabled
                      ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{micEnabled ? 'Mic On' : 'Muted'}</span>
                </button>
              </div>

              {/* Live Mic Meter */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Volume2 className={`w-4 h-4 ${micEnabled && audioLevel > 5 ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: micEnabled ? `${Math.min(100, audioLevel * 1.5)}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Info & Go Live CTA (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl">
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Pre-Broadcast Checklist
              </h2>

              {/* Checklist items */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${cameraEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                    Camera Device
                  </span>
                  <strong className={cameraEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                    {cameraEnabled ? 'Ready' : 'Off'}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${micEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                    Microphone
                  </span>
                  <strong className={micEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                    {micEnabled ? 'Active' : 'Muted'}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-300 font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Enrolled Learners
                  </span>
                  <strong className="text-white">{roomState.registrationsCount} Registered</strong>
                </div>
              </div>

              {/* Instructor Tips */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-indigo-200">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Live Studio Ready
                </p>
                <p className="text-[11px] leading-relaxed text-indigo-300/80">
                  Once you click <strong>Start Live Webinar</strong>, your live classroom opens and video/audio will stream to all waiting learners.
                </p>
              </div>
            </div>

            {/* Go Live Action */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onStartWebinar}
                disabled={isStarting}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Radio className="w-5 h-5 animate-pulse" />
                <span>{isStarting ? 'Opening Live Studio...' : 'Start Live Webinar Now'}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// STUDENT WAITING ROOM
// =========================================================================
interface StudentWaitingRoomProps {
  roomState: LiveRoomState;
  onRefresh: () => Promise<void>;
  onBack: () => void;
}

const StudentWaitingRoom: React.FC<StudentWaitingRoomProps> = ({
  roomState,
  onRefresh,
  onBack,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate live countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(roomState.startTime).getTime();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [roomState.startTime]);

  // Periodic status poll
  useEffect(() => {
    const pollInterval = setInterval(() => {
      onRefresh();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [onRefresh]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Student Waiting Room
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400">{roomState.category}</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white">{roomState.title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{roomState.description}</p>
        </div>

        {/* Countdown Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Starts In
          </span>
          <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl sm:text-3xl text-indigo-400">
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {String(timeLeft.hours).padStart(2, '0')}
              <span className="block text-[9px] font-sans font-normal text-slate-400">HRS</span>
            </div>
            <span>:</span>
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {String(timeLeft.minutes).padStart(2, '0')}
              <span className="block text-[9px] font-sans font-normal text-slate-400">MIN</span>
            </div>
            <span>:</span>
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {String(timeLeft.seconds).padStart(2, '0')}
              <span className="block text-[9px] font-sans font-normal text-slate-400">SEC</span>
            </div>
          </div>
        </div>

        {/* Instructor Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
          {roomState.instructor.avatar ? (
            <img
              src={roomState.instructor.avatar}
              alt={roomState.instructor.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center">
              {roomState.instructor.name?.[0] || 'I'}
            </div>
          )}
          <div>
            <p className="font-extrabold text-white text-sm">{roomState.instructor.name}</p>
            <p className="text-[11px] text-indigo-400 font-semibold">
              {roomState.instructor.headline || 'Lead Instructor'}
            </p>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-400" /> Start Time
            </span>
            <strong className="text-white text-xs block">
              {new Date(roomState.startTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" /> Enrolled Learners
            </span>
            <strong className="text-white text-xs block">{roomState.registrationsCount} Registered</strong>
          </div>
        </div>

        {/* Waiting Status */}
        <div className="text-center p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-white">The instructor is setting up the studio...</p>
          <p className="text-[11px] text-slate-400">
            You will automatically enter the live room the moment the instructor begins broadcasting.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline mt-1 cursor-pointer flex items-center justify-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Status Now</span>
          </button>
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN CONTAINER & AUTHORIZATION / WAITING ROOM
// =========================================================================
export const LiveWebinarRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, info, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [roomState, setRoomState] = useState<LiveRoomState | null>(null);

  // Live Studio State
  const [userRole, setUserRole] = useState<'HOST' | 'STUDENT'>('STUDENT');
  const [isStartingLive, setIsStartingLive] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // Fetch Room State from backend
  const fetchRoom = useCallback(async () => {
    if (!roomCode) return;
    try {
      setLoading(true);
      const res = await webinarsApi.getLiveRoom(roomCode);
      if (res.success && res.data) {
        setRoomState(res.data);
        setUserRole(res.data.isHost ? 'HOST' : 'STUDENT');
        if (res.data.status === 'COMPLETED') {
          setHasEnded(true);
        }
      }
    } catch (err: any) {
      console.error('Failed to load live room state:', err);
      toastError('Room Error', err.response?.data?.message || 'Could not load webinar room.');
    } finally {
      setLoading(false);
    }
  }, [roomCode, toastError]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // Host Starts Webinar Action
  const handleStartWebinar = async () => {
    if (!roomCode) return;
    try {
      setIsStartingLive(true);
      const res = await webinarsApi.startWebinar(roomCode);
      if (res.success) {
        success('Webinar Started', 'You are now broadcasting live! Opening live classroom studio...');
        await fetchRoom();
      }
    } catch (err: any) {
      toastError('Start Failed', err.response?.data?.message || 'Could not start live session.');
    } finally {
      setIsStartingLive(false);
    }
  };

  // Leave Room Flow (Explicit User Click Only)
  const handleLeaveRoom = async () => {
    if (roomCode) {
      try {
        await webinarsApi.leaveRoom(roomCode);
      } catch (e) {
        // ignore
      }
    }
    navigate('/webinars');
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        <p className="text-sm font-bold text-slate-400">Connecting to secure live studio...</p>
      </div>
    );
  }

  // Not Found State
  if (!roomState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black">Live Workshop Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          The requested room code does not exist or may have been deleted.
        </p>
        <Link
          to="/webinars"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
        >
          Explore Scheduled Webinars
        </Link>
      </div>
    );
  }

  // Paywall Gatekeeper (Paid webinar & not registered)
  if (!roomState.hasAccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {roomState.category}
            </span>
            <h2 className="text-xl font-black text-white pt-2">{roomState.title}</h2>
            <p className="text-xs text-slate-400">{roomState.description}</p>
          </div>

          {/* Ticket Pass Price Card */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Workshop Pass
              </span>
              <span className="text-xl font-black text-white">
                {roomState.price > 0 ? `₹${roomState.price.toLocaleString('en-IN')}` : 'Free'}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Live Q&A + Materials
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await webinarsApi.register(roomState.id);
                  if (res.success) {
                    success('Registration Complete', 'You now have full access to this live workshop!');
                    await fetchRoom();
                  }
                } catch (err: any) {
                  toastError('Registration Failed', err.response?.data?.message || 'Could not complete registration.');
                }
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              Register & Join Live Room Now
            </button>
            <button
              type="button"
              onClick={() => navigate('/webinars')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white font-bold text-xs rounded-2xl transition cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Session Completed State
  if (hasEnded || roomState.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">This Live Session Has Ended</h2>
            <p className="text-xs text-slate-400">
              Thank you for participating in <strong className="text-white">{roomState.title}</strong> hosted by{' '}
              {roomState.instructor.name}.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-1 text-left">
            <div className="flex justify-between">
              <span>Total Registered:</span>
              <strong className="text-white">{roomState.registrationsCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Instructor:</span>
              <strong className="text-indigo-400">{roomState.instructor.name}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/webinars')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer shadow-md"
          >
            Explore More Live Sessions
          </button>
        </div>
      </div>
    );
  }

  // Host Preflight Studio (When Host is preparing before broadcast)
  if (roomState.isHost && (roomState.status === 'SCHEDULED' || roomState.status === 'STARTING')) {
    return (
      <HostPreflightStudio
        roomState={roomState}
        onStartWebinar={handleStartWebinar}
        isStarting={isStartingLive}
        onBack={() => navigate('/dashboard/instructor')}
      />
    );
  }

  // Student Waiting Room (When Student is waiting for Host to start)
  if (roomState.status === 'SCHEDULED') {
    return (
      <StudentWaitingRoom
        roomState={roomState}
        onRefresh={fetchRoom}
        onBack={() => navigate('/webinars')}
      />
    );
  }

  // LIVE Classroom (When status === 'LIVE')
  return (
    <LiveClassroomStudio
      roomState={roomState}
      role={userRole}
      onWebinarEnded={() => {
        setHasEnded(true);
      }}
      onLeave={handleLeaveRoom}
      onRefreshRoom={fetchRoom}
    />
  );
};
