import { Avatar } from '../../ui/Avatar';
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Users, 
  Send, 
  PhoneOff, 
  Volume2, 
  AlertCircle,
  Swords,
  Flag,
  Ban,
  Radio,
  Check
} from 'lucide-react';
import { authStore } from '../../services/authStore';
import { socketClient } from '../../services/socketClient';
import { voiceService } from '../../services/voiceService';
import { mediaSettingsStore } from '../../services/mediaSettingsStore';
import { chatStore } from '../../services/chatStore';
import { sanitizeChatMessage, reportChatMessage } from '../../utils/moderation';
import { ChatMessage, Friend, VoiceRoom } from '../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useI18n } from '../../services/i18n';

export interface ChatVoiceViewProps {
  onChallengePlayer: (nick: string) => void;
}

export const ChatVoiceView: React.FC<ChatVoiceViewProps> = ({
  onChallengePlayer
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'list'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const [mediaSettings, setMediaSettings] = useState(mediaSettingsStore.getSettings());
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; nick: string; avatar: string; title: string }[]>([]);
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPttActive, setIsPttActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [roomParticipants, setRoomParticipants] = useState<{ userId: string; nick: string; avatar: string; isMuted?: boolean; isSpeaking?: boolean }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const user = authStore.getUser();

  useEffect(() => {
    const unsubMedia = mediaSettingsStore.subscribe(() => {
      setMediaSettings(mediaSettingsStore.getSettings());
    });
    return () => unsubMedia();
  }, []);

  // Load chat history & voice rooms from server
  useEffect(() => {
    fetch('/api/chat/history?roomId=global')
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(() => {});

  }, []);

  // Unified authenticated WebSocket + real WebRTC voice service
  useEffect(() => {
    const offChat = socketClient.on('chat_new_message', (msg) => {
      if (!chatStore.isUserBlocked(msg.message.userId)) setMessages((prev) => [...prev, msg.message]);
    });
    const offPresence = socketClient.on('presence_update', (msg) => setOnlineUsers(msg.users || []));
    const offVoice = socketClient.on('voice_room_update', (msg) => { if (msg.roomId === activeRoomId) setRoomParticipants(msg.participants || []); });
    const offError = socketClient.on('voice_room_error', (msg) => setFeedbackToast(msg.message || t.common.error));
    const unsubVoice = voiceService.subscribe(() => {
      setVoiceRooms(voiceService.getRooms()); setActiveRoomId(voiceService.getActiveRoomId()); setIsMuted(voiceService.getIsMuted()); setIsSpeaking(voiceService.getIsSpeaking());
      const participants = voiceService.getActiveRoom()?.participants || []; setRoomParticipants(participants);
    });
    return () => { offChat(); offPresence(); offVoice(); offError(); unsubVoice(); };
  }, [activeRoomId, t.common.error]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    const { text: clean, hasProfanity } = sanitizeChatMessage(raw);
    if (hasProfanity) {
      setFeedbackToast(t.chat.profanityWarning);
      setTimeout(() => setFeedbackToast(null), 3000);
    }

    socketClient.send('chat_message', { roomId: 'global', text: clean }); setInputText(''); setChatError(null);
  };

  const handleReportMessage = async (msg: ChatMessage) => {
    await reportChatMessage(msg.id, msg.userId);
    setFeedbackToast(t.chat.reportSent);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleBlockUser = (userId: string) => {
    chatStore.blockUser(userId);
    setMessages((prev) => prev.filter((m) => m.userId !== userId));
    setFeedbackToast(t.chat.blockedSent);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleJoinVoiceRoom = async (roomId: string) => { const ok = await voiceService.joinRoom(roomId); if(!ok) setFeedbackToast(voiceService.micPermissionError || t.common.error); };
  const handleLeaveVoiceRoom = () => voiceService.leaveRoom();
  const handleToggleMute = () => voiceService.toggleMute();
  const handlePttDown = () => { if(mediaSettings.pushToTalk){ setIsPttActive(true); voiceService.setPtt(true); } };
  const handlePttUp = () => { if(mediaSettings.pushToTalk){ setIsPttActive(false); voiceService.setPtt(false); } };

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-4xl mx-auto w-full px-4 pt-3">
      {feedbackToast && (
        <div className="bg-[var(--accent)] text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{feedbackToast}</span>
          <Check size={16} />
        </div>
      )}

      {/* Header and 3 Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl text-[var(--text-primary)]">
            {t.chat.community}
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {t.chat.sub}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)]">
          {[
            { id: 'chat', label: t.chat.chatTab, icon: <MessageSquare size={14} /> },
            { id: 'voice', label: t.chat.voiceTab, icon: <Mic size={14} /> },
            { id: 'list', label: t.chat.listTab, icon: <Users size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-md font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. REAL SERVER CHAT TAB */}
      {activeTab === 'chat' && (
        <Card variant="default" padding="none" className="flex flex-col h-[520px] overflow-hidden">
          <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Загальний чат атлетів (#global)
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] font-mono">
              {t.chat.online}: {onlineUsers.length || 1}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              const isMine = m.userId === user.id;

              if (m.isSystem) {
                return (
                  <div key={m.id} className="text-center my-2">
                    <span className="inline-block bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-[11px] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                      {m.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">{m.userNick}</span>
                    {m.userTitle && (
                      <Badge variant="accent" size="sm">
                        {m.userTitle}
                      </Badge>
                    )}
                    <span className="text-[10px]">
                      {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Moderation Actions for other users' messages */}
                    {!isMine && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleReportMessage(m)}
                          title={t.chat.reportMsg}
                          className="p-0.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                        >
                          <Flag size={11} />
                        </button>
                        <button
                          onClick={() => handleBlockUser(m.userId)}
                          title={t.chat.blockUser}
                          className="p-0.5 text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <Ban size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    className={`max-w-xs sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                      isMine
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] rounded-tr-none shadow-sm'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <div className="bg-red-500/15 border-t border-red-500/20 px-3 py-1.5 text-[11px] text-red-400 text-center">
              {chatError}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-3 bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] flex gap-2">
            <input
              type="text"
              placeholder={t.chat.sendPlaceholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[var(--bg-card)] text-[var(--text-primary)] text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
            <Button type="submit" size="md" variant="primary">
              <Send size={15} />
            </Button>
          </form>
        </Card>
      )}

      {/* 2. REAL VOICE ROOMS & WEBRTC SIGNALING */}
      {activeTab === 'voice' && (
        <div className="flex flex-col gap-4">
          {activeRoomId && (
            <div className="bg-[var(--bg-card)] border-2 border-[var(--accent)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSpeaking ? 'bg-[var(--accent)] text-white ring-4 ring-[var(--accent)]/30 animate-pulse' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Volume2 size={20} />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">{t.chat.connectedTo}</div>
                  <div className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {voiceRooms.find((r) => r.id === activeRoomId)?.name || 'Кімната'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!mediaSettings.pushToTalk ? (
                  <Button
                    variant={isMuted ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? <MicOff size={14} className="mr-1.5" /> : <Mic size={14} className="mr-1.5" />}
                    {isMuted ? t.chat.micOff : t.chat.micOn}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onMouseDown={handlePttDown}
                    onMouseUp={handlePttUp}
                    onTouchStart={handlePttDown}
                    onTouchEnd={handlePttUp}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                      isPttActive ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <Radio size={14} className={isPttActive ? 'animate-spin' : ''} />
                    <span>{isPttActive ? t.chat.pttRelease : t.chat.pttHold}</span>
                  </button>
                )}

                <Button variant="outline" size="sm" onClick={handleLeaveVoiceRoom}>
                  <PhoneOff size={14} className="mr-1.5 text-rose-400" />
                  {t.chat.leaveRoom}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {voiceRooms.map((room) => {
              const isInside = room.id === activeRoomId;
              const participants = isInside ? roomParticipants : [];

              return (
                <Card
                  key={room.id}
                  variant={isInside ? 'accent' : 'default'}
                  padding="md"
                  className="flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        {participants.length} / {room.maxUsers}
                      </span>
                      {isInside && <Badge variant="accent" size="sm">Ви тут</Badge>}
                    </div>

                    <h4 className="font-heading font-bold text-base text-[var(--text-primary)] mb-3">
                      {room.name}
                    </h4>

                    {participants.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {participants.map((p) => (
                          <div
                            key={p.userId}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                          >
                            <Avatar avatar={p.avatar} size="sm" alt={p.nick} />
                            <span className="truncate max-w-[80px]">{p.nick}</span>
                            {p.isMuted && <MicOff size={10} className="text-slate-500" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-secondary)] mb-4">
                        Порожня кімната
                      </div>
                    )}
                  </div>

                  {!isInside ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoinVoiceRoom(room.id)}
                      className="w-full font-bold"
                    >
                      <Mic size={14} className="mr-1.5" />
                      {t.chat.joinRoom}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLeaveVoiceRoom}
                      className="w-full"
                    >
                      {t.chat.leaveRoom}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ONLINE USERS & CHALLENGE TAB */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onlineUsers.length === 0 ? (
            <Card variant="default" padding="lg" className="col-span-2 text-center text-xs text-[var(--text-secondary)]">
              Жодного іншого атлета зараз немає онлайн. Запроси друзів за посиланням!
            </Card>
          ) : (
            onlineUsers.map((ath) => (
              <Card
                key={ath.userId}
                variant="default"
                padding="md"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0B0D11] border border-[var(--border-subtle)] flex items-center justify-center text-xl">
                    <Avatar avatar={ath.avatar} size="sm" alt={ath.nick} />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>{ath.nick}</span>
                      {ath.userId === user.id && <span className="text-[10px] text-[var(--accent)]">(Ти)</span>}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{ath.title}</span>
                  </div>
                </div>

                {ath.userId !== user.id && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onChallengePlayer(ath.nick)}
                    className="font-bold"
                  >
                    <Swords size={13} className="mr-1.5" />
                    {t.chat.duelAction}
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
