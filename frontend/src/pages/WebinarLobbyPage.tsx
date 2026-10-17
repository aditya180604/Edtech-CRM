import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, LoaderCircle, LockKeyhole, LogOut, Users, Video } from 'lucide-react';
import { webinarsApi, type WebinarLobbyState } from '../api/webinars';
import { useAuth } from '../context/AuthContext';
import { connectRealtimeSocket } from '../realtime/socket';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response;
    if (response && typeof response === 'object' && 'data' in response) {
      const data = response.data;
      if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
};

export const WebinarLobbyPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, isLoading } = useAuth();
  const [lobby, setLobby] = useState<WebinarLobbyState | null>(null);
  const [message, setMessage] = useState('');
  const [requestPending, setRequestPending] = useState(true);
  const refreshInProgress = useRef(false);

  const refreshLobby = useCallback(async () => {
    if (!roomCode || refreshInProgress.current) return;
    refreshInProgress.current = true;
    try {
      const response = await webinarsApi.getLobbyState(roomCode);
      if (!response.success || !response.data) return;
      setLobby(response.data);
      setMessage('');
      if (response.data.isHost) {
        navigate(`/webinars/live/${roomCode}`, { replace: true });
      } else if (response.data.admissionStatus === 'ADMITTED' && response.data.status === 'LIVE') {
        navigate(`/webinars/live/${roomCode}`, { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Unable to refresh your waiting-room status.');
      if (/register for this webinar/i.test(errorMessage)) {
        navigate(`/webinars/live/${roomCode}`, { replace: true });
        return;
      }
      setMessage(errorMessage);
    } finally {
      refreshInProgress.current = false;
      setRequestPending(false);
    }
  }, [navigate, roomCode]);

  useEffect(() => {
    if (isLoading || !roomCode || !isAuthenticated) return;
    let active = true;
    let intervalId: number | undefined;

    const joinAndPoll = async () => {
      try {
        const response = await webinarsApi.joinLobby(roomCode);
        if (!active) return;
        if (response.data.status === 'HOST') {
          navigate(`/webinars/live/${roomCode}`, { replace: true });
          return;
        }
        await refreshLobby();
      } catch (error: unknown) {
        if (!active) return;
        const errorMessage = getErrorMessage(error, 'Unable to join the webinar waiting room.');
        if (/register for this webinar/i.test(errorMessage)) {
          navigate(`/webinars/live/${roomCode}`, { replace: true });
          return;
        }
        setMessage(errorMessage);
        setRequestPending(false);
      }

      if (active) {
        intervalId = window.setInterval(() => void refreshLobby(), 2500);
      }
    };

    void joinAndPoll();
    return () => {
      active = false;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [isAuthenticated, isLoading, navigate, refreshLobby, roomCode]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const socket = connectRealtimeSocket(accessToken);
    const handleLobbyUpdate = (event: { roomCode?: string }) => {
      if (event.roomCode === roomCode) void refreshLobby();
    };
    const handleAdmission = (event: { roomCode?: string; status?: string }) => {
      if (event.roomCode === roomCode) void refreshLobby();
    };
    socket.on('webinar:lobby-updated', handleLobbyUpdate);
    socket.on('webinar:admission-updated', handleAdmission);
    return () => {
      socket.off('webinar:lobby-updated', handleLobbyUpdate);
      socket.off('webinar:admission-updated', handleAdmission);
    };
  }, [accessToken, isAuthenticated, isLoading, refreshLobby, roomCode]);

  const leaveLobby = async () => {
    if (!roomCode) return;
    try {
      await webinarsApi.leaveRoom(roomCode);
      navigate('/webinars');
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, 'Unable to leave the waiting room.'));
    }
  };

  const ended = lobby?.status === 'COMPLETED' || lobby?.status === 'CANCELLED' || lobby?.admissionStatus === 'ENDED';
  const waiting = lobby?.admissionStatus === 'WAITING' || lobby?.admissionStatus === 'LEFT';

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FA5A36]/10 text-[#FA5A36]">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FA5A36]">Webinar Lobby</p>
              <h1 className="mt-1 text-lg font-bold">{lobby?.title || 'Waiting to join webinar'}</h1>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-6">
          {lobby?.instructor && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
              {lobby.instructor.avatar ? (
                <img src={lobby.instructor.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FA5A36] font-bold">
                  {lobby.instructor.name?.[0] || 'I'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{lobby.instructor.name}</p>
                <p className="truncate text-xs text-slate-400">{lobby.instructor.headline || 'Webinar instructor'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${lobby.instructorOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                {lobby.instructorOnline ? 'Instructor online' : 'Instructor not here yet'}
              </span>
            </div>
          )}

          {!isLoading && !isAuthenticated ? (
            <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <LockKeyhole className="mx-auto h-7 w-7 text-amber-300" />
              <p className="text-sm text-slate-300">Sign in with your registered account to enter this waiting room.</p>
              <Link
                to={`/login?redirect=${encodeURIComponent(`/webinars/lobby/${roomCode || ''}`)}`}
                className="inline-flex rounded-xl bg-[#FA5A36] px-4 py-2 text-sm font-bold text-white"
              >
                Sign in
              </Link>
            </div>
          ) : requestPending && !lobby ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-300">
              <LoaderCircle className="h-8 w-8 animate-spin text-[#FA5A36]" />
              <p className="text-sm">Joining the secure waiting room…</p>
            </div>
          ) : ended ? (
            <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="font-bold">This webinar has ended</h2>
              <p className="text-sm text-slate-400">The live room is closed and no further admission is available.</p>
            </div>
          ) : waiting ? (
            <div className="space-y-4 rounded-2xl border border-[#FA5A36]/20 bg-[#FA5A36]/5 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FA5A36]/10 text-[#FA5A36]">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold">You’re in the waiting room</h2>
                <p className="mt-1 text-sm text-slate-300">The instructor will let you in shortly.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {lobby?.status === 'LIVE' ? 'The session is live; waiting for admission' : 'Waiting for the instructor to start'}
                </span>
                {lobby?.startTime && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(lobby.startTime).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Your camera and microphone are not connected while you wait.</p>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-5 text-center">
              <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[#FA5A36]" />
              <p className="text-sm text-slate-300">Checking your registration and admission status…</p>
            </div>
          )}

          {message && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">{message}</p>}
          {isAuthenticated && !ended && (
            <button
              type="button"
              onClick={() => void leaveLobby()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Leave waiting room
            </button>
          )}
          <Link to="/webinars" className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-300">
            Back to webinars
          </Link>
        </div>
      </section>
    </main>
  );
};
