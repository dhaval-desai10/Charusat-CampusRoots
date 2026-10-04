import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import io from 'socket.io-client';
import { 
   MessageCircle, 
   Send, 
   Search, 
   ArrowLeft,
   MoreVertical,
   Check,
   CheckCheck,
   Circle,
   Users,
   X,
   Smile,
   Plus,
   UserPlus,
   LogOut,
   Settings,
   Bell,
   CheckCircle,
   XCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Role badge component
const RoleBadge = ({ role }) => {
   const colors = {
      student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      alumni: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      faculty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
   };

   return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${colors[role] || colors.alumni}`}>
         {role}
      </span>
   );
};

const Chat = () => {
   const { user } = useAuth();
   const { theme } = useTheme();
   const navigate = useNavigate();
   
   // State
   const [socket, setSocket] = useState(null);
   const [conversations, setConversations] = useState([]);
   const [connections, setConnections] = useState([]);
   const [selectedConversation, setSelectedConversation] = useState(null);
   const [messages, setMessages] = useState([]);
   const [newMessage, setNewMessage] = useState('');
   const [loading, setLoading] = useState(true);
   const [messagesLoading, setMessagesLoading] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [typingUser, setTypingUser] = useState(null);
   const [onlineUsers, setOnlineUsers] = useState(new Set());
   const [showNewChat, setShowNewChat] = useState(false);
   const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
   const [showConversationList, setShowConversationList] = useState(true);
   
   // Group chat state
   const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'groups'
   const [groups, setGroups] = useState([]);
   const [selectedGroup, setSelectedGroup] = useState(null);
   const [groupMessages, setGroupMessages] = useState([]);
   const [groupInvitations, setGroupInvitations] = useState([]);
   const [showCreateGroup, setShowCreateGroup] = useState(false);
   const [showGroupInvitations, setShowGroupInvitations] = useState(false);
   const [newGroupName, setNewGroupName] = useState('');
   const [newGroupBio, setNewGroupBio] = useState('');
   const [selectedMembers, setSelectedMembers] = useState([]);
   const [creatingGroup, setCreatingGroup] = useState(false);
   const [groupTypingUsers, setGroupTypingUsers] = useState([]);
   
   // Refs
   const messagesEndRef = useRef(null);
   const messageInputRef = useRef(null);
   const typingTimeoutRef = useRef(null);

   // Initialize Socket.IO - optimized
   useEffect(() => {
      const newSocket = io(SOCKET_URL, {
         withCredentials: true,
         transports: ['websocket', 'polling'], // WebSocket preferred, polling as fallback
         upgrade: true,
         reconnection: true,
         reconnectionAttempts: 5,
         reconnectionDelay: 1000,
         reconnectionDelayMax: 5000,
         timeout: 20000,
         forceNew: true // Ensure fresh connection
      });

      newSocket.on('connect', () => {
         console.log('Socket connected');
         if (user?._id) {
            newSocket.emit('user:join', user._id);
            // Join all group rooms the user is a member of
            newSocket.emit('groups:join-all', user._id);
         }
      });

      newSocket.on('connect_error', (error) => {
         console.error('Socket connection error:', error);
      });

      newSocket.on('reconnect', (attemptNumber) => {
         console.log('Socket reconnected after', attemptNumber, 'attempts');
         if (user?._id) {
            newSocket.emit('user:join', user._id);
            newSocket.emit('groups:join-all', user._id);
         }
      });

      // Get initial list of online users
      newSocket.on('users:online-list', (userIds) => {
         setOnlineUsers(new Set(userIds));
      });

      newSocket.on('user:online', (userId) => {
         setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', (userId) => {
         setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
         });
      });

      // Direct message sent confirmation
      newSocket.on('message:sent', ({ message, tempId }) => {
         // Replace optimistic message with real one
         setMessages(prev => prev.map(msg => 
            msg._id === tempId ? message : msg
         ));
      });

      // Group chat socket events
      newSocket.on('group:message:sent', ({ message, tempId }) => {
         // Replace optimistic message with real one
         setGroupMessages(prev => prev.map(msg => 
            msg._id === tempId ? message : msg
         ));
      });

      newSocket.on('group:message:received', (message) => {
         // Skip if this is our own message (we add it optimistically when sending)
         if (message.sender?._id === user?._id || message.sender === user?._id) {
            return;
         }
         
         // Update messages if this group is selected
         setSelectedGroup(currentGroup => {
            if (currentGroup?._id === message.group) {
               setGroupMessages(prev => {
                  // Check if message already exists to prevent duplicates
                  const exists = prev.some(m => m._id === message._id);
                  if (exists) return prev;
                  return [...prev, message];
               });
            }
            return currentGroup;
         });
         
         // Update groups list with last message
         setGroups(prev => {
            const updated = prev.map(g => {
               if (g._id === message.group) {
                  return {
                     ...g,
                     lastMessage: message,
                     lastMessageAt: message.createdAt
                  };
               }
               return g;
            });
            return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
         });
      });
      
      // Update group unread count
      newSocket.on('group:unread-count', (count) => {
         console.log('Group unread count update:', count);
      });

      // Group message seen
      newSocket.on('group:message:seen', ({ groupId, readBy }) => {
         setSelectedGroup(currentGroup => {
            if (currentGroup?._id === groupId) {
               setGroupMessages(prev => prev.map(msg => ({
                  ...msg,
                  readBy: [...(msg.readBy || []), { user: readBy, readAt: new Date() }]
               })));
            }
            return currentGroup;
         });
      });

      newSocket.on('group:typing:update', ({ userId, userName, isTyping }) => {
         if (isTyping) {
            setGroupTypingUsers(prev => {
               if (!prev.find(u => u.id === userId)) {
                  return [...prev, { id: userId, name: userName }];
               }
               return prev;
            });
         } else {
            setGroupTypingUsers(prev => prev.filter(u => u.id !== userId));
         }
      });

      newSocket.on('group:invitation:received', () => {
         fetchGroupInvitations();
      });

      setSocket(newSocket);

      return () => {
         newSocket.close();
      };
   }, [user?._id]);

   // Handle incoming messages
   useEffect(() => {
      if (!socket) return;

      const handleMessageReceived = (message) => {
         // Skip if this is our own message (we already added it optimistically)
         if (message.sender?._id === user?._id || message.sender === user?._id) {
            return;
         }
         
         if (selectedConversation?._id === message.conversation) {
            // Check if message already exists to prevent duplicates
            setMessages(prev => {
               const exists = prev.some(m => m._id === message._id);
               if (exists) return prev;
               return [...prev, message];
            });
            // Mark as read
            socket.emit('message:read', {
               conversationId: message.conversation,
               userId: user._id
            });
         }
         
         // Update conversation list
         setConversations(prev => {
            const updated = prev.map(conv => {
               if (conv._id === message.conversation) {
                  return {
                     ...conv,
                     lastMessage: message,
                     lastMessageAt: message.createdAt,
                     unreadCount: selectedConversation?._id === message.conversation 
                        ? 0 
                        : conv.unreadCount + 1
                  };
               }
               return conv;
            });
            // Sort by latest message
            return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
         });
      };

      const handleMessageSeen = ({ conversationId, readBy }) => {
         if (selectedConversation?._id === conversationId) {
            setMessages(prev => prev.map(msg => ({
               ...msg,
               readBy: [...(msg.readBy || []), { user: readBy, readAt: new Date() }]
            })));
         }
      };

      const handleTypingUpdate = ({ userId, userName, isTyping }) => {
         if (isTyping) {
            setTypingUser(userName);
         } else {
            setTypingUser(null);
         }
      };

      socket.on('message:received', handleMessageReceived);
      socket.on('message:seen', handleMessageSeen);
      socket.on('typing:update', handleTypingUpdate);

      return () => {
         socket.off('message:received', handleMessageReceived);
         socket.off('message:seen', handleMessageSeen);
         socket.off('typing:update', handleTypingUpdate);
      };
   }, [socket, selectedConversation, user?._id]);

   // Fetch conversations
   useEffect(() => {
      fetchConversations();
      fetchConnections();
      fetchGroups();
      fetchGroupInvitations();
   }, []);

   // Handle window resize
   useEffect(() => {
      const handleResize = () => {
         setIsMobileView(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
   }, []);

   // Scroll to bottom on new messages
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages, groupMessages]);

   const fetchConversations = async () => {
      try {
         setLoading(true);
         const res = await axios.get(`${API_BASE}/chat/conversations`, { withCredentials: true });
         if (res.data.success) {
            setConversations(res.data.conversations);
         }
      } catch (error) {
         console.error('Failed to fetch conversations:', error);
      } finally {
         setLoading(false);
      }
   };

   const fetchConnections = async () => {
      try {
         const res = await axios.get(`${API_BASE}/chat/connections`, { withCredentials: true });
         if (res.data.success) {
            setConnections(res.data.users);
         }
      } catch (error) {
         console.error('Failed to fetch connections:', error);
      }
   };

   // Group chat functions
   const fetchGroups = async () => {
      try {
         const res = await axios.get(`${API_BASE}/groups/my-groups`, { withCredentials: true });
         if (res.data.success) {
            setGroups(res.data.groups);
         }
      } catch (error) {
         console.error('Failed to fetch groups:', error);
      }
   };

   const fetchGroupInvitations = async () => {
      try {
         const res = await axios.get(`${API_BASE}/groups/invitations`, { withCredentials: true });
         if (res.data.success) {
            setGroupInvitations(res.data.invitations);
         }
      } catch (error) {
         console.error('Failed to fetch group invitations:', error);
      }
   };

   const fetchGroupMessages = async (groupId) => {
      try {
         setMessagesLoading(true);
         const res = await axios.get(`${API_BASE}/groups/${groupId}/messages`, { withCredentials: true });
         if (res.data.success) {
            setGroupMessages(res.data.messages);
         }
      } catch (error) {
         console.error('Failed to fetch group messages:', error);
      } finally {
         setMessagesLoading(false);
      }
   };

   const selectGroup = async (group) => {
      setSelectedGroup(group);
      setSelectedConversation(null);
      await fetchGroupMessages(group._id);
      
      if (socket) {
         socket.emit('group:join', group._id);
         socket.emit('group:message:read', {
            groupId: group._id,
            userId: user._id
         });
      }

      // Reset unread count locally
      setGroups(prev => prev.map(g => 
         g._id === group._id ? { ...g, unreadCount: 0 } : g
      ));

      if (isMobileView) {
         setShowConversationList(false);
      }
   };

   const createGroup = async () => {
      if (!newGroupName.trim() || selectedMembers.length === 0) {
         alert('Please enter a group name and select at least one member');
         return;
      }

      try {
         setCreatingGroup(true);
         const res = await axios.post(`${API_BASE}/groups/create`, {
            name: newGroupName.trim(),
            bio: newGroupBio.trim(),
            invitedUsers: selectedMembers.map(m => m._id)
         }, { withCredentials: true });

         if (res.data.success) {
            setGroups(prev => [res.data.group, ...prev]);
            setShowCreateGroup(false);
            setNewGroupName('');
            setNewGroupBio('');
            setSelectedMembers([]);
            setActiveTab('groups');
            
            // Join the new group's socket room
            if (socket) {
               socket.emit('group:join', res.data.group._id);
            }
         }
      } catch (error) {
         console.error('Failed to create group:', error);
         alert(error.response?.data?.message || 'Failed to create group');
      } finally {
         setCreatingGroup(false);
      }
   };

   const handleAcceptInvitation = async (groupId) => {
      try {
         const res = await axios.post(`${API_BASE}/groups/invitations/${groupId}/accept`, {}, { withCredentials: true });
         if (res.data.success) {
            fetchGroups();
            setGroupInvitations(prev => prev.filter(inv => inv._id !== groupId));
            
            // Join the accepted group's socket room
            if (socket) {
               socket.emit('group:join', groupId);
            }
         }
      } catch (error) {
         console.error('Failed to accept invitation:', error);
         alert(error.response?.data?.message || 'Failed to accept invitation');
      }
   };

   const handleRejectInvitation = async (groupId) => {
      try {
         const res = await axios.post(`${API_BASE}/groups/invitations/${groupId}/reject`, {}, { withCredentials: true });
         if (res.data.success) {
            setGroupInvitations(prev => prev.filter(inv => inv._id !== groupId));
         }
      } catch (error) {
         console.error('Failed to reject invitation:', error);
      }
   };

   const sendGroupMessage = async (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedGroup) return;

      const messageContent = newMessage.trim();
      const tempId = `temp-${Date.now()}`;
      setNewMessage('');

      // Optimistic update - add message immediately for sender
      const optimisticMessage = {
         _id: tempId,
         group: selectedGroup._id,
         sender: {
            _id: user._id,
            name: user.name,
            profilePicture: user.profilePicture
         },
         content: messageContent,
         createdAt: new Date().toISOString(),
         readBy: [{ user: user._id, readAt: new Date() }]
      };
      setGroupMessages(prev => [...prev, optimisticMessage]);
      
      // Update groups list with last message (for sender)
      setGroups(prev => {
         const updated = prev.map(g => {
            if (g._id === selectedGroup._id) {
               return {
                  ...g,
                  lastMessage: optimisticMessage,
                  lastMessageAt: optimisticMessage.createdAt
               };
            }
            return g;
         });
         return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });

      if (socket) {
         socket.emit('group:message:send', {
            groupId: selectedGroup._id,
            senderId: user._id,
            content: messageContent,
            tempId
         }, (response) => {
            // Callback acknowledgment
            if (response?.success && response.message) {
               // Replace optimistic message with real one
               setGroupMessages(prev => prev.map(msg => 
                  msg._id === tempId ? response.message : msg
               ));
            }
         });
      }

      // Stop typing indicator
      if (typingTimeoutRef.current) {
         clearTimeout(typingTimeoutRef.current);
      }
      if (socket) {
         socket.emit('group:typing:stop', {
            groupId: selectedGroup._id,
            userId: user._id
         });
      }
   };

   const handleGroupTyping = (e) => {
      setNewMessage(e.target.value);

      if (!socket || !selectedGroup) return;

      socket.emit('group:typing:start', {
         groupId: selectedGroup._id,
         userId: user._id,
         userName: user.name
      });

      if (typingTimeoutRef.current) {
         clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
         socket.emit('group:typing:stop', {
            groupId: selectedGroup._id,
            userId: user._id
         });
      }, 2000);
   };

   const leaveGroup = async () => {
      if (!selectedGroup) return;
      
      if (!confirm('Are you sure you want to leave this group?')) return;

      try {
         const res = await axios.post(`${API_BASE}/groups/${selectedGroup._id}/leave`, {}, { withCredentials: true });
         if (res.data.success) {
            setGroups(prev => prev.filter(g => g._id !== selectedGroup._id));
            setSelectedGroup(null);
            setGroupMessages([]);
         }
      } catch (error) {
         console.error('Failed to leave group:', error);
         alert(error.response?.data?.message || 'Failed to leave group');
      }
   };

   const toggleMemberSelection = (connection) => {
      setSelectedMembers(prev => {
         const exists = prev.find(m => m._id === connection._id);
         if (exists) {
            return prev.filter(m => m._id !== connection._id);
         }
         return [...prev, connection];
      });
   };

   const fetchMessages = async (conversationId) => {
      try {
         setMessagesLoading(true);
         const res = await axios.get(`${API_BASE}/chat/messages/${conversationId}`, { withCredentials: true });
         if (res.data.success) {
            setMessages(res.data.messages);
         }
      } catch (error) {
         console.error('Failed to fetch messages:', error);
      } finally {
         setMessagesLoading(false);
      }
   };

   const selectConversation = async (conversation) => {
      setSelectedConversation(conversation);
      await fetchMessages(conversation._id);
      
      // Join conversation room
      if (socket) {
         socket.emit('conversation:join', conversation._id);
         socket.emit('message:read', {
            conversationId: conversation._id,
            userId: user._id
         });
      }

      // Reset unread count locally
      setConversations(prev => prev.map(conv => 
         conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
      ));

      if (isMobileView) {
         setShowConversationList(false);
      }
   };

   const startNewChat = async (connection) => {
      try {
         const res = await axios.get(`${API_BASE}/chat/conversation/${connection._id}`, { withCredentials: true });
         if (res.data.success) {
            const conversation = {
               _id: res.data.conversation._id,
               participant: connection,
               unreadCount: 0
            };
            
            // Add to conversations if not exists
            setConversations(prev => {
               const exists = prev.find(c => c._id === conversation._id);
               if (!exists) {
                  return [conversation, ...prev];
               }
               return prev;
            });
            
            selectConversation(conversation);
            setShowNewChat(false);
         }
      } catch (error) {
         console.error('Failed to start chat:', error);
         alert(error.response?.data?.message || 'Failed to start chat');
      }
   };

   const sendMessage = async (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedConversation) return;

      const messageContent = newMessage.trim();
      const tempId = `temp-${Date.now()}`;
      setNewMessage('');

      // Optimistic update - add message immediately
      const optimisticMessage = {
         _id: tempId,
         conversation: selectedConversation._id,
         sender: {
            _id: user._id,
            name: user.name,
            profilePicture: user.profilePicture
         },
         content: messageContent,
         createdAt: new Date().toISOString(),
         readBy: [{ user: user._id, readAt: new Date() }]
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Update conversation list immediately
      setConversations(prev => {
         const updated = prev.map(conv => {
            if (conv._id === selectedConversation._id) {
               return {
                  ...conv,
                  lastMessage: optimisticMessage,
                  lastMessageAt: optimisticMessage.createdAt
               };
            }
            return conv;
         });
         return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });

      if (socket) {
         socket.emit('message:send', {
            conversationId: selectedConversation._id,
            senderId: user._id,
            recipientId: selectedConversation.participant._id,
            content: messageContent,
            tempId
         }, (response) => {
            // Callback acknowledgment
            if (response?.success && response.message) {
               // Replace optimistic message with real one
               setMessages(prev => prev.map(msg => 
                  msg._id === tempId ? response.message : msg
               ));
            }
         });
      }

      // Stop typing indicator
      if (typingTimeoutRef.current) {
         clearTimeout(typingTimeoutRef.current);
      }
      if (socket) {
         socket.emit('typing:stop', {
            conversationId: selectedConversation._id,
            userId: user._id
         });
      }
   };

   const handleTyping = (e) => {
      setNewMessage(e.target.value);

      if (!socket || !selectedConversation) return;

      // Send typing indicator
      socket.emit('typing:start', {
         conversationId: selectedConversation._id,
         userId: user._id,
         userName: user.name
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
         clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
         socket.emit('typing:stop', {
            conversationId: selectedConversation._id,
            userId: user._id
         });
      }, 2000);
   };

   const formatTime = (date) => {
      const d = new Date(date);
      const now = new Date();
      const diff = now - d;
      
      if (diff < 86400000 && d.getDate() === now.getDate()) {
         return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (diff < 604800000) {
         return d.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
   };

   const formatMessageTime = (date) => {
      return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
   };

   const isMessageRead = (message) => {
      return message.readBy?.some(r => r.user !== user._id);
   };

   const filteredConversations = conversations.filter(conv =>
      conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const filteredConnections = connections.filter(conn =>
      conn.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !conversations.some(c => c.participant?._id === conn._id)
   );

   const filteredGroups = groups.filter(group =>
      group.name?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const goBack = () => {
      if (selectedConversation && socket) {
         socket.emit('conversation:leave', selectedConversation._id);
      }
      if (selectedGroup && socket) {
         socket.emit('group:leave', selectedGroup._id);
      }
      setSelectedConversation(null);
      setSelectedGroup(null);
      setMessages([]);
      setGroupMessages([]);
      setShowConversationList(true);
   };

   return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
         <Navbar />
         
         <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
               <div className="flex h-full">
                  {/* Conversation List */}
                  {(showConversationList || !isMobileView) && (
                     <div className={`${isMobileView ? 'w-full' : 'w-80 lg:w-96'} border-r border-[var(--border)] flex flex-col`}>
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--border)]">
                           <div className="flex items-center justify-between mb-4">
                              <h2 className="text-xl font-bold text-[var(--text-primary)]">Messages</h2>
                              <div className="flex items-center gap-1">
                                 {groupInvitations.length > 0 && (
                                    <button
                                       onClick={() => setShowGroupInvitations(true)}
                                       className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors relative"
                                       title="Group Invitations"
                                    >
                                       <Bell className="w-5 h-5 text-[var(--accent)]" />
                                       <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                          {groupInvitations.length}
                                       </span>
                                    </button>
                                 )}
                                 <button
                                    onClick={() => setShowCreateGroup(true)}
                                    className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                                    title="Create Group"
                                 >
                                    <Plus className="w-5 h-5 text-[var(--accent)]" />
                                 </button>
                                 <button
                                    onClick={() => setShowNewChat(true)}
                                    className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                                    title="New Chat"
                                 >
                                    <UserPlus className="w-5 h-5 text-[var(--accent)]" />
                                 </button>
                              </div>
                           </div>

                           {/* Tabs */}
                           <div className="flex gap-2 mb-4">
                              <button
                                 onClick={() => setActiveTab('direct')}
                                 className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'direct'
                                       ? 'bg-[var(--accent)] text-white'
                                       : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                 }`}
                              >
                                 Direct
                              </button>
                              <button
                                 onClick={() => setActiveTab('groups')}
                                 className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'groups'
                                       ? 'bg-[var(--accent)] text-white'
                                       : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                 }`}
                              >
                                 Groups
                                 {groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0) > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                       {groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0)}
                                    </span>
                                 )}
                              </button>
                           </div>
                           
                           {/* Search */}
                           <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                              <input
                                 type="text"
                                 placeholder={activeTab === 'direct' ? "Search conversations..." : "Search groups..."}
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                              />
                           </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                           {activeTab === 'direct' ? (
                              /* Direct Messages List */
                              loading ? (
                                 <div className="flex items-center justify-center h-32">
                                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                 </div>
                              ) : filteredConversations.length === 0 ? (
                                 <div className="p-6 text-center">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[var(--text-secondary)]" />
                                    <p className="text-[var(--text-secondary)]">No conversations yet</p>
                                    <button
                                       onClick={() => setShowNewChat(true)}
                                       className="mt-3 text-[var(--accent)] hover:underline"
                                    >
                                       Start a new chat
                                    </button>
                                 </div>
                              ) : (
                                 filteredConversations.map(conv => (
                                    <div
                                       key={conv._id}
                                       onClick={() => { setSelectedGroup(null); selectConversation(conv); }}
                                       className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${
                                          selectedConversation?._id === conv._id ? 'bg-[var(--bg-secondary)]' : ''
                                       }`}
                                    >
                                       <div className="relative">
                                          <img
                                             src={conv.participant?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.participant?.name || 'User')}&background=6366f1&color=fff`}
                                             alt={conv.participant?.name}
                                             className="w-12 h-12 rounded-full object-cover"
                                          />
                                          {onlineUsers.has(conv.participant?._id) && (
                                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--card-bg)]" />
                                          )}
                                       </div>
                                       
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                             <span className="font-medium text-[var(--text-primary)] truncate">
                                                {conv.participant?.name}
                                             </span>
                                             <span className="text-xs text-[var(--text-secondary)]">
                                                {conv.lastMessageAt && formatTime(conv.lastMessageAt)}
                                             </span>
                                          </div>
                                          <div className="flex items-center justify-between mt-0.5">
                                             <p className="text-sm text-[var(--text-secondary)] truncate">
                                                {conv.lastMessage?.content || 'Start a conversation'}
                                             </p>
                                             {conv.unreadCount > 0 && (
                                                <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-[var(--accent)] text-white text-xs rounded-full px-1.5">
                                                   {conv.unreadCount}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 ))
                              )
                           ) : (
                              /* Groups List */
                              loading ? (
                                 <div className="flex items-center justify-center h-32">
                                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                 </div>
                              ) : filteredGroups.length === 0 ? (
                                 <div className="p-6 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-[var(--text-secondary)]" />
                                    <p className="text-[var(--text-secondary)]">No groups yet</p>
                                    <button
                                       onClick={() => setShowCreateGroup(true)}
                                       className="mt-3 text-[var(--accent)] hover:underline"
                                    >
                                       Create a group
                                    </button>
                                 </div>
                              ) : (
                                 filteredGroups.map(group => (
                                    <div
                                       key={group._id}
                                       onClick={() => { setSelectedConversation(null); selectGroup(group); }}
                                       className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${
                                          selectedGroup?._id === group._id ? 'bg-[var(--bg-secondary)]' : ''
                                       }`}
                                    >
                                       <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                                          <Users className="w-6 h-6 text-[var(--accent)]" />
                                       </div>
                                       
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                             <span className="font-medium text-[var(--text-primary)] truncate">
                                                {group.name}
                                             </span>
                                             <span className="text-xs text-[var(--text-secondary)]">
                                                {group.lastMessageAt && formatTime(group.lastMessageAt)}
                                             </span>
                                          </div>
                                          <div className="flex items-center justify-between mt-0.5">
                                             <p className="text-sm text-[var(--text-secondary)] truncate">
                                                {group.lastMessage?.content || `${group.membersCount} members`}
                                             </p>
                                             {group.unreadCount > 0 && (
                                                <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-[var(--accent)] text-white text-xs rounded-full px-1.5">
                                                   {group.unreadCount}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 ))
                              )
                           )}
                        </div>
                     </div>
                  )}

                  {/* Chat Area */}
                  {(!showConversationList || !isMobileView) && (
                     <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                           <>
                              {/* Direct Chat Header */}
                              <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                                 {isMobileView && (
                                    <button
                                       onClick={goBack}
                                       className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                       <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                                    </button>
                                 )}
                                 
                                 <div 
                                    className="relative cursor-pointer"
                                    onClick={() => navigate(`/profile/${selectedConversation.participant?._id}`)}
                                 >
                                    <img
                                       src={selectedConversation.participant?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.participant?.name || 'User')}&background=6366f1&color=fff`}
                                       alt={selectedConversation.participant?.name}
                                       className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                                    />
                                    {onlineUsers.has(selectedConversation.participant?._id) && (
                                       <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--card-bg)]" />
                                    )}
                                 </div>
                                 
                                 <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => navigate(`/profile/${selectedConversation.participant?._id}`)}
                                 >
                                    <h3 className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                                       {selectedConversation.participant?.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                       <RoleBadge role={selectedConversation.participant?.role} />
                                       {onlineUsers.has(selectedConversation.participant?._id) ? (
                                          <span className="text-xs text-green-500">Online</span>
                                       ) : (
                                          <span className="text-xs text-[var(--text-secondary)]">
                                             {selectedConversation.participant?.currentRole}
                                             {selectedConversation.participant?.currentCompany && ` at ${selectedConversation.participant.currentCompany}`}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* Messages */}
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                 {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                       <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                 ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                                       <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                                       <p>No messages yet</p>
                                       <p className="text-sm">Say hello to start the conversation!</p>
                                    </div>
                                 ) : (
                                    <>
                                       {messages.map((message, index) => {
                                          const isOwn = message.sender._id === user._id || message.sender === user._id;
                                          const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender._id !== message.sender._id);
                                          
                                          return (
                                             <div
                                                key={message._id}
                                                className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                                             >
                                                {!isOwn && showAvatar && (
                                                   <img
                                                      src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=6366f1&color=fff`}
                                                      alt=""
                                                      className="w-8 h-8 rounded-full object-cover"
                                                   />
                                                )}
                                                {!isOwn && !showAvatar && <div className="w-8" />}
                                                
                                                <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
                                                   <div
                                                      className={`px-4 py-2 rounded-2xl ${
                                                         isOwn
                                                            ? 'bg-[var(--accent)] text-white rounded-br-md'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-md'
                                                      }`}
                                                   >
                                                      <p className="break-words">{message.content}</p>
                                                   </div>
                                                   <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                      <span className="text-xs text-[var(--text-secondary)]">
                                                         {formatMessageTime(message.createdAt)}
                                                      </span>
                                                      {isOwn && (
                                                         isMessageRead(message) ? (
                                                            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                                         ) : (
                                                            <Check className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                                         )
                                                      )}
                                                   </div>
                                                </div>
                                             </div>
                                          );
                                       })}
                                       
                                       {/* Typing Indicator */}
                                       {typingUser && (
                                          <div className="flex items-center gap-2">
                                             <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-2xl rounded-bl-md">
                                                <div className="flex gap-1">
                                                   <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                   <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                   <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                             </div>
                                             <span className="text-xs text-[var(--text-secondary)]">{typingUser} is typing...</span>
                                          </div>
                                       )}
                                       
                                       <div ref={messagesEndRef} />
                                    </>
                                 )}
                              </div>

                              {/* Message Input */}
                              <div className="p-4 border-t border-[var(--border)]">
                                 <form onSubmit={sendMessage} className="flex items-center gap-2">
                                    <input
                                       ref={messageInputRef}
                                       type="text"
                                       value={newMessage}
                                       onChange={handleTyping}
                                       placeholder="Type a message..."
                                       className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                                    />
                                    <button
                                       type="submit"
                                       disabled={!newMessage.trim()}
                                       className="p-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                       <Send className="w-5 h-5" />
                                    </button>
                                 </form>
                              </div>
                           </>
                        ) : selectedGroup ? (
                           <>
                              {/* Group Chat Header */}
                              <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                                 {isMobileView && (
                                    <button
                                       onClick={goBack}
                                       className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                       <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                                    </button>
                                 )}
                                 
                                 <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[var(--accent)]" />
                                 </div>
                                 
                                 <div className="flex-1">
                                    <h3 className="font-semibold text-[var(--text-primary)]">
                                       {selectedGroup.name}
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                       {selectedGroup.membersCount} members
                                       {selectedGroup.bio && ` • ${selectedGroup.bio}`}
                                    </p>
                                 </div>
                                 
                                 <button
                                    onClick={leaveGroup}
                                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title="Leave Group"
                                 >
                                    <LogOut className="w-5 h-5 text-red-500" />
                                 </button>
                              </div>

                              {/* Group Messages */}
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                 {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                       <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                 ) : groupMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                                       <Users className="w-16 h-16 mb-4 opacity-50" />
                                       <p>No messages yet</p>
                                       <p className="text-sm">Be the first to say something!</p>
                                    </div>
                                 ) : (
                                    <>
                                       {groupMessages.map((message, index) => {
                                          const isOwn = message.sender?._id === user._id || message.sender === user._id;
                                          const isSystem = message.messageType === 'system';
                                          const showAvatar = !isOwn && !isSystem && (index === 0 || groupMessages[index - 1]?.sender?._id !== message.sender?._id);
                                          
                                          if (isSystem) {
                                             return (
                                                <div key={message._id} className="flex justify-center">
                                                   <span className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs rounded-full">
                                                      {message.content}
                                                   </span>
                                                </div>
                                             );
                                          }
                                          
                                          return (
                                             <div
                                                key={message._id}
                                                className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                                             >
                                                {!isOwn && showAvatar && (
                                                   <img
                                                      src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=6366f1&color=fff`}
                                                      alt=""
                                                      className="w-8 h-8 rounded-full object-cover"
                                                   />
                                                )}
                                                {!isOwn && !showAvatar && <div className="w-8" />}
                                                
                                                <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
                                                   {!isOwn && showAvatar && (
                                                      <p className="text-xs text-[var(--text-secondary)] mb-1 ml-1">
                                                         {message.sender?.name}
                                                      </p>
                                                   )}
                                                   <div
                                                      className={`px-4 py-2 rounded-2xl ${
                                                         isOwn
                                                            ? 'bg-[var(--accent)] text-white rounded-br-md'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-md'
                                                      }`}
                                                   >
                                                      <p className="break-words">{message.content}</p>
                                                   </div>
                                                   <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                      <span className="text-xs text-[var(--text-secondary)]">
                                                         {formatMessageTime(message.createdAt)}
                                                      </span>
                                                   </div>
                                                </div>
                                             </div>
                                          );
                                       })}
                                       
                                       {/* Group Typing Indicator */}
                                       {groupTypingUsers.length > 0 && (
                                          <div className="flex items-center gap-2">
                                             <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-2xl rounded-bl-md">
                                                <div className="flex gap-1">
                                                   <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                   <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                   <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                             </div>
                                             <span className="text-xs text-[var(--text-secondary)]">
                                                {groupTypingUsers.map(u => u.name).join(', ')} {groupTypingUsers.length === 1 ? 'is' : 'are'} typing...
                                             </span>
                                          </div>
                                       )}
                                       
                                       <div ref={messagesEndRef} />
                                    </>
                                 )}
                              </div>

                              {/* Group Message Input */}
                              <div className="p-4 border-t border-[var(--border)]">
                                 <form onSubmit={sendGroupMessage} className="flex items-center gap-2">
                                    <input
                                       ref={messageInputRef}
                                       type="text"
                                       value={newMessage}
                                       onChange={handleGroupTyping}
                                       placeholder="Type a message..."
                                       className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                                    />
                                    <button
                                       type="submit"
                                       disabled={!newMessage.trim()}
                                       className="p-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                       <Send className="w-5 h-5" />
                                    </button>
                                 </form>
                              </div>
                           </>
                        ) : (
                           /* No Chat Selected */
                           <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                              <div className="w-24 h-24 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                                 <MessageCircle className="w-12 h-12" />
                              </div>
                              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Your Messages</h3>
                              <p className="text-center max-w-sm mb-4">
                                 Connect with alumni, faculty, and students. Start a conversation or create a group!
                              </p>
                              <div className="flex gap-3">
                                 <button
                                    onClick={() => setShowNewChat(true)}
                                    className="px-6 py-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity"
                                 >
                                    Start New Chat
                                 </button>
                                 <button
                                    onClick={() => setShowCreateGroup(true)}
                                    className="px-6 py-2 border border-[var(--accent)] text-[var(--accent)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors"
                                 >
                                    Create Group
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* New Chat Modal */}
         {showNewChat && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Message</h3>
                     <button
                        onClick={() => setShowNewChat(false)}
                        className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                     >
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                     </button>
                  </div>
                  
                  <div className="p-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input
                           type="text"
                           placeholder="Search connections..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                        />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 pb-4">
                     {connections.length === 0 ? (
                        <div className="p-6 text-center text-[var(--text-secondary)]">
                           <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                           <p>No connections yet</p>
                           <p className="text-sm">Connect with others to start chatting</p>
                        </div>
                     ) : filteredConnections.length === 0 && searchQuery ? (
                        <div className="p-6 text-center text-[var(--text-secondary)]">
                           <p>No connections found</p>
                        </div>
                     ) : (
                        [...filteredConnections, ...connections.filter(c => 
                           conversations.some(conv => conv.participant?._id === c._id) &&
                           c.name?.toLowerCase().includes(searchQuery.toLowerCase())
                        )].map(connection => (
                           <div
                              key={connection._id}
                              onClick={() => startNewChat(connection)}
                              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                           >
                              <div className="relative">
                                 <img
                                    src={connection.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name)}&background=6366f1&color=fff`}
                                    alt={connection.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                 />
                                 {onlineUsers.has(connection._id) && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--card-bg)]" />
                                 )}
                              </div>
                              <div className="flex-1">
                                 <span className="font-medium text-[var(--text-primary)]">{connection.name}</span>
                                 <div className="flex items-center gap-2">
                                    <RoleBadge role={connection.role} />
                                    {connection.currentRole && (
                                       <span className="text-sm text-[var(--text-secondary)]">
                                          {connection.currentRole}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Create Group Modal */}
         {showCreateGroup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create Group</h3>
                     <button
                        onClick={() => {
                           setShowCreateGroup(false);
                           setNewGroupName('');
                           setNewGroupBio('');
                           setSelectedMembers([]);
                        }}
                        className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                     >
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                     </button>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                     {/* Group Name */}
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                           Group Name *
                        </label>
                        <input
                           type="text"
                           value={newGroupName}
                           onChange={(e) => setNewGroupName(e.target.value)}
                           placeholder="Enter group name"
                           maxLength={50}
                           className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                        />
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{newGroupName.length}/50</p>
                     </div>

                     {/* Group Bio */}
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                           Bio (Optional)
                        </label>
                        <textarea
                           value={newGroupBio}
                           onChange={(e) => setNewGroupBio(e.target.value)}
                           placeholder="Describe your group..."
                           maxLength={200}
                           rows={3}
                           className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
                        />
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{newGroupBio.length}/200</p>
                     </div>

                     {/* Select Members */}
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                           Add Members * ({selectedMembers.length} selected)
                        </label>
                        
                        {selectedMembers.length > 0 && (
                           <div className="flex flex-wrap gap-2 mb-3">
                              {selectedMembers.map(member => (
                                 <div 
                                    key={member._id}
                                    className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full text-sm"
                                 >
                                    <span>{member.name}</span>
                                    <button
                                       onClick={() => toggleMemberSelection(member)}
                                       className="hover:bg-[var(--accent)]/30 rounded-full p-0.5"
                                    >
                                       <X className="w-3 h-3" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        )}

                        <div className="max-h-48 overflow-y-auto border border-[var(--border)] rounded-xl">
                           {connections.length === 0 ? (
                              <div className="p-4 text-center text-[var(--text-secondary)]">
                                 <p>No connections available</p>
                              </div>
                           ) : (
                              connections.map(connection => (
                                 <div
                                    key={connection._id}
                                    onClick={() => toggleMemberSelection(connection)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${
                                       selectedMembers.some(m => m._id === connection._id) ? 'bg-[var(--accent)]/10' : ''
                                    }`}
                                 >
                                    <img
                                       src={connection.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name)}&background=6366f1&color=fff`}
                                       alt={connection.name}
                                       className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                       <span className="font-medium text-[var(--text-primary)]">{connection.name}</span>
                                       <p className="text-xs text-[var(--text-secondary)]">{connection.currentRole}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                       selectedMembers.some(m => m._id === connection._id)
                                          ? 'bg-[var(--accent)] border-[var(--accent)]'
                                          : 'border-[var(--border)]'
                                    }`}>
                                       {selectedMembers.some(m => m._id === connection._id) && (
                                          <Check className="w-3 h-3 text-white" />
                                       )}
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="p-4 border-t border-[var(--border)]">
                     <button
                        onClick={createGroup}
                        disabled={!newGroupName.trim() || selectedMembers.length === 0 || creatingGroup}
                        className="w-full py-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                        {creatingGroup ? (
                           <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating...
                           </>
                        ) : (
                           <>
                              <Plus className="w-5 h-5" />
                              Create Group
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Group Invitations Modal */}
         {showGroupInvitations && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-[var(--text-primary)]">Group Invitations</h3>
                     <button
                        onClick={() => setShowGroupInvitations(false)}
                        className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                     >
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                     {groupInvitations.length === 0 ? (
                        <div className="text-center text-[var(--text-secondary)] py-8">
                           <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                           <p>No pending invitations</p>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           {groupInvitations.map(invitation => (
                              <div 
                                 key={invitation._id}
                                 className="p-4 border border-[var(--border)] rounded-xl"
                              >
                                 <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                                       <Users className="w-6 h-6 text-[var(--accent)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <h4 className="font-medium text-[var(--text-primary)]">{invitation.name}</h4>
                                       {invitation.bio && (
                                          <p className="text-sm text-[var(--text-secondary)] truncate">{invitation.bio}</p>
                                       )}
                                       <p className="text-xs text-[var(--text-secondary)] mt-1">
                                          Created by {invitation.createdBy?.name} • {invitation.membersCount} members
                                       </p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2 mt-3">
                                    <button
                                       onClick={() => handleAcceptInvitation(invitation._id)}
                                       className="flex-1 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                                    >
                                       <CheckCircle className="w-4 h-4" />
                                       Accept
                                    </button>
                                    <button
                                       onClick={() => handleRejectInvitation(invitation._id)}
                                       className="flex-1 py-2 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-center gap-1"
                                    >
                                       <XCircle className="w-4 h-4" />
                                       Decline
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Chat;
