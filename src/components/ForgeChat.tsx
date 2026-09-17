import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Shield,
  UserPlus,
  Users,
  MessageSquare,
  Flame,
  Swords,
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Ban,
  Flag,
  CheckCircle2,
  X,
  Compass,
  CornerDownRight,
  Radio,
  AlertCircle
} from 'lucide-react';
import { chatStore } from '../services/chatStore';
import { authStore } from '../services/authStore';
import { ChatMessage, ChatRoom, FriendConnection, ForgeUser } from '../types';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';

export const ForgeChat: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<ForgeUser | null>(authStore.getCurrentUser());
  const [rooms, setRooms] = useState<ChatRoom[]>(chatStore.getRooms());
  const [friends, setFriends] = useState<FriendConnection[]>(chatStore.getFriends());
  const [activeChannelId, setActiveChannelId] = useState<string>('room_calisthenics');
  const [messages, setMessages] = useState<ChatMessage[]>(chatStore.getMessages('room_calisthenics'));
  const [connectionStatus, setConnectionStatus] = useState<'live' | 'polling' | 'connecting' | 'error'>(chatStore.getConnectionStatus());

  const [inputContent, setInputContent] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Mobile layout tab: 'channels' | 'messages' | 'details'
  const [mobileTab, setMobileTab] = useState<'channels' | 'messages' | 'details'>('messages');

  // New friend input state
  const [showAddFriendModal, setShowAddFriendModal] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>('');

  // Report modal
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'toxic' | 'dangerous_technique' | 'misinformation'>('toxic');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatStore.setActiveChannel(activeChannelId);

    const unsubChat = chatStore.subscribe(() => {
      setRooms(chatStore.getRooms());
      setFriends(chatStore.getFriends());
      setMessages(chatStore.getMessages(activeChannelId));
      setConnectionStatus(chatStore.getConnectionStatus());
    });

    const unsubAuth = authStore.subscribe(() => {
      setCurrentUser(authStore.getCurrentUser());
    });

    return () => {
      unsubChat();
      unsubAuth();
    };
  }, [activeChannelId]);

  useEffect(() => {
    setMessages(chatStore.getMessages(activeChannelId));
    scrollToBottom();
  }, [activeChannelId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    if (!currentUser) {
      setChatError('Для публікації повідомлень у спільному чаті увійдіть в акаунт.');
      return;
    }

    setChatError(null);
    setIsSending(true);

    try {
      const replyPayload = replyingTo
        ? {
            id: replyingTo.id,
            authorName: replyingTo.authorName,
            snippet: replyingTo.content.slice(0, 50)
          }
        : undefined;

      await chatStore.sendMessage(activeChannelId, inputContent, replyPayload);
      setInputContent('');
      setReplyingTo(null);
      scrollToBottom();
    } catch (err: any) {
      setChatError(err.message || 'Не вдалося надіслати повідомлення.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    try {
      await chatStore.editMessage(activeChannelId, msgId, editContent);
      setEditingMessageId(null);
    } catch (err: any) {
      setChatError(err.message || 'Не вдалося зберегти зміни');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await chatStore.deleteMessage(activeChannelId, msgId);
    } catch (err: any) {
      setChatError(err.message || 'Не вдалося видалити повідомлення');
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!currentUser) {
      setChatError('Увійдіть в акаунт, щоб ставити реакції на повідомлення.');
      return;
    }
    try {
      await chatStore.toggleReaction(activeChannelId, msgId, emoji);
    } catch (err: any) {
      setChatError(err.message || 'Помилка реакції');
    }
  };

  const handleQuickSwitch = async (username: string) => {
    try {
      setIsSwitchingUser(true);
      await authStore.loginAsDemo(username);
      setChatError(null);
    } catch (err: any) {
      setChatError(err.message || 'Не вдалося змінити акаунт');
    } finally {
      setIsSwitchingUser(false);
    }
  };

  const activeRoom = rooms.find((r) => r.id === activeChannelId);
  const activeFriend = friends.find((f) => f.id === activeChannelId);

  const channelTitle = activeRoom ? activeRoom.name : activeFriend ? activeFriend.username : 'Чат Кімната';
  const channelTopic = activeRoom ? activeRoom.topic : activeFriend ? `Особистий звʼязок • Ранг ${activeFriend.reputationRank}` : '';

  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    chatStore.addFriend(newFriendName.trim());
    setNewFriendName('');
    setShowAddFriendModal(false);
  };

  const handleReport = () => {
    if (!reportingMessage) return;
    sound.playClick();
    arnoVoice.speak('Повідомлення надіслано модераторам для перевірки.');
    setReportingMessage(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Mobile Top Toggle */}
      <div className="flex md:hidden items-center justify-between bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800 text-xs">
        <button
          onClick={() => setMobileTab('channels')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${
            mobileTab === 'channels' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
          }`}
        >
          Кімнати ({rooms.length})
        </button>
        <button
          onClick={() => setMobileTab('messages')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${
            mobileTab === 'messages' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
          }`}
        >
          Чат
        </button>
        <button
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all ${
            mobileTab === 'details' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
          }`}
        >
          Інфо
        </button>
      </div>

      {/* Main 3-Column Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[720px] rounded-3xl border border-amber-500/20 bg-neutral-950 overflow-hidden shadow-2xl">
        {/* LEFT COLUMN: Channels, Rooms & Friends */}
        <div
          className={`md:col-span-3 border-r border-neutral-800/80 bg-neutral-900/40 flex flex-col h-full overflow-y-auto ${
            mobileTab === 'channels' ? 'block' : 'hidden md:flex'
          }`}
        >
          {/* Header of channels */}
          <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Forge Chat Hub
              </span>
            </div>
            <button
              onClick={() => setShowAddFriendModal(true)}
              title="Додати атлета у звʼязки"
              className="p-1.5 rounded-lg border border-neutral-800 hover:border-amber-500/40 text-neutral-400 hover:text-amber-300 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rooms List */}
          <div className="flex-1 p-3 space-y-4 overflow-y-auto">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-2 block mb-1.5">
                Публічні Кімнати ({rooms.length})
              </span>
              <div className="space-y-1">
                {rooms.map((room) => {
                  const isActive = activeChannelId === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        sound.playClick();
                        setActiveChannelId(room.id);
                        setMobileTab('messages');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{room.icon}</span>
                        <span className="truncate font-semibold">{room.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                        {room.membersOnline}👥
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Connections / Friends */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-2 block mb-1.5">
                Звʼязки та Атлети ({friends.length})
              </span>
              <div className="space-y-1">
                {friends.map((friend) => {
                  const isActive = activeChannelId === friend.id;
                  return (
                    <button
                      key={friend.id}
                      onClick={() => {
                        sound.playClick();
                        setActiveChannelId(friend.id);
                        setMobileTab('messages');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-neutral-700">
                          <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate font-medium">{friend.username}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Онлайн" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Message Feed & Input */}
        <div
          className={`md:col-span-6 flex flex-col h-full bg-neutral-950 ${
            mobileTab === 'messages' ? 'block' : 'hidden md:flex'
          }`}
        >
          {/* Channel Header */}
          <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/30 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  {channelTitle}
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'live'
                        ? 'bg-emerald-400 animate-pulse'
                        : connectionStatus === 'polling'
                        ? 'bg-amber-400'
                        : 'bg-neutral-500'
                    }`}
                  />
                  <span className="text-neutral-300 font-mono">
                    {connectionStatus === 'live'
                      ? 'Live Multi-User (SSE)'
                      : connectionStatus === 'polling'
                      ? 'Синхронізація (Polling)'
                      : 'Підключення...'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 truncate max-w-sm mt-0.5">
                {channelTopic}
              </p>
            </div>

            {/* Current user switch bar for multi-user testing */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 px-2.5 py-1 rounded-xl text-xs">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-5 h-5 rounded-full object-cover border border-neutral-700"
                  />
                  <span className="text-neutral-300 font-medium text-[11px] hidden sm:inline">Ви:</span>
                  <span className="text-amber-400 font-bold font-mono text-[11px]">{currentUser.username}</span>
                  <button
                    onClick={() => handleQuickSwitch(currentUser.username === '@Kuznets' ? '@IronArnie' : '@Kuznets')}
                    disabled={isSwitchingUser}
                    className="ml-1 text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                    title="Швидке перемикання акаунта для тестування спільного діалогу"
                  >
                    {isSwitchingUser ? '...' : currentUser.username === '@Kuznets' ? '⇄ як @IronArnie' : '⇄ як @Kuznets'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 px-2.5 py-1 rounded-xl text-xs">
                  <span className="text-neutral-400 text-[11px]">Гість:</span>
                  <button
                    onClick={() => handleQuickSwitch('@Kuznets')}
                    disabled={isSwitchingUser}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                  >
                    Вхід @Kuznets
                  </button>
                  <button
                    onClick={() => handleQuickSwitch('@IronArnie')}
                    disabled={isSwitchingUser}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer"
                  >
                    @IronArnie
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Error Banner if any */}
          {chatError && (
            <div className="mx-4 mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{chatError}</span>
              </div>
              <button
                onClick={() => setChatError(null)}
                className="text-red-400 hover:text-red-200 text-sm px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs text-center p-6">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-amber-400" />
                <p>У цій кімнаті ще немає повідомлень.</p>
                <p className="text-[11px] mt-1 text-neutral-600">Будьте першим, хто поділиться технічною порадою або досвідом!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const currentUserId = currentUser?.id || '';
                const currentUsername = currentUser?.username || '';
                const isMe = Boolean(
                  currentUser &&
                    (msg.authorId === currentUserId ||
                      msg.authorId === currentUsername ||
                      msg.authorName === currentUser.displayName ||
                      msg.authorName === currentUser.username ||
                      msg.authorId === 'user_me')
                );
                const isEditing = editingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-700">
                      <img src={msg.authorAvatar} alt={msg.authorName} className="w-full h-full object-cover" />
                    </div>

                    {/* Message Bubble Container */}
                    <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Meta header */}
                      <div className="flex items-center gap-2 mb-1 text-[11px]">
                        <span className="font-bold text-neutral-300">{msg.authorName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-400 font-mono">
                          {msg.authorRank}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Reply preview if present */}
                      {msg.replyToMessage && (
                        <div className="mb-1 p-1.5 rounded-lg bg-neutral-900 border-l-2 border-amber-500 text-[10px] text-neutral-400 flex items-center gap-1.5">
                          <CornerDownRight className="w-3 h-3 text-amber-400" />
                          <span className="font-bold text-neutral-300">{msg.replyToMessage.authorName}:</span>
                          <span className="truncate">{msg.replyToMessage.snippet}</span>
                        </div>
                      )}

                      {/* Content or Edit Box */}
                      {isEditing ? (
                        <div className="p-2 rounded-2xl bg-neutral-900 border border-amber-500/40 w-full space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-neutral-950 text-xs text-neutral-100 p-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-amber-400"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2 text-[11px]">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                            >
                              Скасувати
                            </button>
                            <button
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-2.5 py-1 rounded bg-amber-500 text-neutral-950 font-bold"
                            >
                              Зберегти
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.isDeleted
                              ? 'bg-neutral-900/50 border border-neutral-800 text-neutral-500 italic'
                              : isMe
                              ? 'bg-amber-500/20 border border-amber-500/40 text-neutral-100 rounded-tr-none'
                              : 'bg-neutral-900/90 border border-neutral-800 text-neutral-200 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          {msg.isEdited && !msg.isDeleted && (
                            <span className="text-[9px] text-neutral-500 block text-right mt-1">
                              (змінено)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Reactions Pills */}
                      {!msg.isDeleted && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {Object.entries(msg.reactions || {}).map(([emoji, users]) => {
                            const userList = (users as string[]) || [];
                            const hasReacted = Boolean(
                              currentUser &&
                                (userList.includes(currentUser.id) ||
                                  userList.includes(currentUser.username) ||
                                  userList.includes('user_me'))
                            );

                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 transition-all cursor-pointer ${
                                  hasReacted
                                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="font-mono text-[10px]">{userList.length}</span>
                              </button>
                            );
                          })}

                          {/* Quick Add Reaction Buttons on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                            {['🔥', '💪', '⚔️', '👏'].map((em) => (
                              <button
                                key={em}
                                onClick={() => handleReaction(msg.id, em)}
                                className="hover:scale-125 transition-transform text-xs p-1"
                              >
                                {em}
                              </button>
                            ))}
                            <button
                              onClick={() => setReplyingTo(msg)}
                              title="Відповісти"
                              className="text-neutral-400 hover:text-amber-400 p-1"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            {isMe && !isEditing && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditContent(msg.content);
                                  }}
                                  title="Редагувати"
                                  className="text-neutral-400 hover:text-cyan-400 p-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Видалити"
                                  className="text-neutral-400 hover:text-red-400 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            {!isMe && (
                              <button
                                onClick={() => setReportingMessage(msg)}
                                title="Поскаржитися на повідомлення"
                                className="text-neutral-500 hover:text-red-400 p-1"
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Banner */}
          {replyingTo && (
            <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 truncate text-neutral-300">
                <Reply className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Відповідь для <b>{replyingTo.authorName}</b>: «{replyingTo.content.slice(0, 40)}...»</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-neutral-500 hover:text-neutral-200 text-xs p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Guest Notice if not logged in */}
          {!currentUser && (
            <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
              <span>Увійдіть в акаунт, щоб писати повідомлення в реальному часі.</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleQuickSwitch('@Kuznets')}
                  className="px-2 py-0.5 bg-amber-500 text-neutral-950 rounded font-semibold text-[10px] cursor-pointer"
                >
                  Швидкий вхід (@Kuznets)
                </button>
                <button
                  onClick={() => handleQuickSwitch('@IronArnie')}
                  className="px-2 py-0.5 bg-neutral-800 text-neutral-200 rounded text-[10px] cursor-pointer"
                >
                  як @IronArnie
                </button>
              </div>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-neutral-800/80 bg-neutral-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                currentUser
                  ? `Повідомлення у #${channelTitle} як ${currentUser.username}...`
                  : 'Увійдіть в акаунт, щоб надіслати повідомлення...'
              }
              className="flex-1 bg-neutral-950 text-xs text-neutral-100 placeholder-neutral-500 px-4 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!inputContent.trim() || isSending}
              className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Profile Details & Participants */}
        <div
          className={`md:col-span-3 border-l border-neutral-800/80 bg-neutral-900/40 p-4 space-y-6 overflow-y-auto ${
            mobileTab === 'details' ? 'block' : 'hidden md:block'
          }`}
        >
          {activeFriend ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <img src={activeFriend.avatar} alt={activeFriend.username} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-sm font-bold text-neutral-100 mt-2">{activeFriend.username}</h4>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold inline-block mt-1">
                  Ранг: {activeFriend.reputationRank}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-neutral-800 pt-3">
                <div className="flex justify-between text-neutral-400">
                  <span>Рівень:</span>
                  <span className="text-neutral-200 font-bold">{activeFriend.level}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Дисципліна:</span>
                  <span className="text-amber-400 font-bold uppercase">{activeFriend.discipline}</span>
                </div>
                {activeFriend.mutualGuild && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Спільна гільдія:</span>
                    <span className="text-cyan-400 font-semibold">{activeFriend.mutualGuild}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <button
                  onClick={() => chatStore.blockUser(activeFriend.userId)}
                  className="w-full py-2 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-900/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Заблокувати користувача
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Про Кімнату
                </span>
                <h4 className="text-sm font-bold text-neutral-100 mt-1">{channelTitle}</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {channelTopic}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Правила Безпеки Forge:
                </div>
                <p>• Повага до кожного атлета.</p>
                <p>• Жодних порад тренуватися через гострий біль.</p>
                <p>• Тільки науково обґрунтовані рекомендації.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-neutral-950 p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-100">Додати атлета у звʼязки</h3>
            <input
              type="text"
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              placeholder="Введіть нікнейм атлета..."
              className="w-full bg-neutral-900 text-xs text-neutral-100 px-4 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-neutral-400"
              >
                Скасувати
              </button>
              <button
                onClick={handleAddFriend}
                className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold"
              >
                Додати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-neutral-950 p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2 text-red-400">
              <Flag className="w-4 h-4" />
              Скарга на повідомлення
            </h3>
            <p className="text-xs text-neutral-400">
              Оберіть причину скарги на повідомлення від {reportingMessage.authorName}:
            </p>
            <div className="space-y-2">
              {[
                { id: 'toxic', label: 'Некоректна чи токсична поведінка' },
                { id: 'dangerous_technique', label: 'Небезпечна техніка / порада через біль' },
                { id: 'misinformation', label: 'Шкідлива дезінформація' },
                { id: 'spam', label: 'Спам / стороння реклама' }
              ].map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reportReason === opt.id}
                    onChange={() => setReportReason(opt.id as any)}
                    className="accent-red-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setReportingMessage(null)}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-neutral-400"
              >
                Скасувати
              </button>
              <button
                onClick={handleReport}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                Надіслати скаргу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
