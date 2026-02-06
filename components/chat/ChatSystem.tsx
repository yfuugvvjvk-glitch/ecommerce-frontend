'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Users, Plus, X, Send, Phone, Video, Settings, Paperclip, Edit3, Trash2, MoreVertical, Move, Maximize2, Minimize2 } from 'lucide-react';

interface ChatRoom {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'SUPPORT';
  members: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      role: string;
    };
  }>;
  lastMessage?: {
    content: string;
    sender: {
      name: string;
    };
    createdAt: string;
  };
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  readBy: Array<{ readAt: string }>;
  fileUrl?: string;
  fileName?: string;
  isEdited?: boolean;
  editedAt?: string;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export default function ChatSystem() {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Chat window positioning and sizing
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showRoomOptions, setShowRoomOptions] = useState<string | null>(null);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showRoomOptions && !chatRef.current?.contains(event.target as Node)) {
        setShowRoomOptions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRoomOptions]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io('http://localhost:3001', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('💬 Connected to chat server');
      newSocket.emit('user_online');
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      // Update last message in chat rooms
      setChatRooms(prev => prev.map(room => 
        room.id === selectedRoom?.id 
          ? { ...room, lastMessage: { content: message.content, sender: message.sender, createdAt: message.createdAt } }
          : room
      ));
    });

    newSocket.on('user_typing', (data: { userId: string; userEmail: string; roomId: string }) => {
      if (data.roomId === selectedRoom?.id && data.userId !== user.id) {
        setIsTyping(prev => ({ ...prev, [data.userId]: true }));
        setTimeout(() => {
          setIsTyping(prev => ({ ...prev, [data.userId]: false }));
        }, 3000);
      }
    });

    newSocket.on('user_stopped_typing', (data: { userId: string; roomId: string }) => {
      setIsTyping(prev => ({ ...prev, [data.userId]: false }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, selectedRoom?.id]);

  // Load chat rooms
  useEffect(() => {
    if (!token) return;
    loadChatRooms();
  }, [token]);

  // Load available users when opening new chat modal
  useEffect(() => {
    if (showNewChatModal && token) {
      console.log('🚀 New chat modal opened, loading users...');
      loadAvailableUsers();
      // Reîncarcă utilizatorii la fiecare 5 secunde pentru actualizare în timp real
      const interval = setInterval(() => {
        console.log('🔄 Refreshing users list...');
        loadAvailableUsers();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showNewChatModal, token]);

  // Load available users for group modal
  useEffect(() => {
    if (showGroupModal && token) {
      loadAvailableUsers();
      // Reîncarcă utilizatorii la fiecare 5 secunde pentru actualizare în timp real
      const interval = setInterval(loadAvailableUsers, 5000);
      return () => clearInterval(interval);
    }
  }, [showGroupModal, token]);

  const loadChatRooms = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const rooms = await response.json();
        setChatRooms(rooms);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    }
  };

  const loadAvailableUsers = async () => {
    console.log('🔍 Loading available users...');
    console.log('👤 Current user:', user);
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    try {
      // First test if we can reach the auth endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('🌐 API URL:', apiUrl);
      
      // Test auth endpoint first
      console.log('🔐 Testing auth endpoint...');
      const authResponse = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('🔐 Auth test status:', authResponse.status);
      
      if (!authResponse.ok) {
        console.error('❌ Auth test failed, token might be invalid');
        const authError = await authResponse.text();
        console.error('❌ Auth error:', authError);
        return;
      } else {
        console.log('✅ Auth test passed, token is valid');
      }
      
      // Now test available users endpoint
      const url = `${apiUrl}/api/chat/available-users`;
      console.log('📡 Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      
      if (response.ok) {
        const users = await response.json();
        console.log('👥 Received users:', users);
        console.log('📈 Number of users:', users.length);
        setAvailableUsers(users);
        console.log('✅ Users set in state successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Response not ok:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error loading available users:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms/${roomId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const roomMessages = await response.json();
        setMessages(roomMessages);
        // Mark messages as read
        await markMessagesAsRead(roomId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (roomId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/chat/rooms/${roomId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      // Update local state to remove unread count
      setChatRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unreadCount: 0 } : room
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const selectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setMessages([]);
    loadMessages(room.id);
    if (socket) {
      socket.emit('join_room', room.id);
    }
    
    // Mark room as read immediately when selected
    setChatRooms(prev => prev.map(r => 
      r.id === room.id ? { ...r, unreadCount: 0 } : r
    ));
  };

  // Drag and drop functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current?.contains(e.target as Node)) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Resize functionality
  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('right')) {
        newWidth = Math.max(300, startWidth + deltaX);
      }
      if (direction.includes('left')) {
        newWidth = Math.max(300, startWidth - deltaX);
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(400, startHeight + deltaY);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(400, startHeight - deltaY);
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Delete conversation
  const deleteConversation = async (roomId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această conversație?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setChatRooms(prev => prev.filter(room => room.id !== roomId));
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
          setMessages([]);
        }
        setShowRoomOptions(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Leave group
  const leaveGroup = async (roomId: string) => {
    if (!confirm('Ești sigur că vrei să părăsești acest grup?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setChatRooms(prev => prev.filter(room => room.id !== roomId));
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
          setMessages([]);
        }
        setShowRoomOptions(null);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !token) return;

    setSendingMessage(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms/${selectedRoom.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        if (socket) {
          socket.emit('typing_stop', { roomId: selectedRoom.id });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const createDirectChat = async (targetUserId: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/direct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId })
      });

      if (response.ok) {
        const newRoom = await response.json();
        setChatRooms(prev => [newRoom, ...prev]);
        setShowNewChatModal(false);
        selectRoom(newRoom);
      }
    } catch (error) {
      console.error('Error creating direct chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/group`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: groupName,
          memberIds: selectedUsers
        })
      });

      if (response.ok) {
        const newRoom = await response.json();
        setChatRooms(prev => [newRoom, ...prev]);
        setShowGroupModal(false);
        setGroupName('');
        setSelectedUsers([]);
        selectRoom(newRoom);
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSupportChat = async () => {
    console.log('🎧 Creating support chat...');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    console.log('👤 User:', user);
    
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${apiUrl}/api/chat/support`;
      console.log('📡 Making support chat request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Nu includem Content-Type pentru că nu trimitem body
        }
      });

      console.log('📊 Support chat response status:', response.status);
      console.log('📊 Support chat response ok:', response.ok);

      if (response.ok) {
        const supportRoom = await response.json();
        console.log('✅ Support room created:', supportRoom);
        setChatRooms(prev => [supportRoom, ...prev]);
        selectRoom(supportRoom);
        console.log('✅ Support chat created and selected successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Support chat creation failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error creating support chat:', error);
    } finally {
      setLoading(false);
      console.log('🎧 Support chat creation finished');
    }
  };

  const handleTyping = () => {
    if (socket && selectedRoom) {
      socket.emit('typing_start', { roomId: selectedRoom.id });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedRoom || !token) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/upload/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const { fileUrl } = await response.json();
        
        // Send message with file
        const messageResponse = await fetch(`${apiUrl}/api/chat/rooms/${selectedRoom.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: `Shared a file: ${file.name}`,
            type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
            fileUrl,
            fileName: file.name
          })
        });

        if (messageResponse.ok) {
          // Message will be added via socket
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!selectedRoom || !token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms/${selectedRoom.id}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        setEditingMessage(null);
        setEditContent('');
        // Reload messages to show updated content
        loadMessages(selectedRoom.id);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedRoom || !token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat/rooms/${selectedRoom.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Reload messages to show updated list
        loadMessages(selectedRoom.id);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === 'SUPPORT') return '🎧 Support';
    if (room.type === 'GROUP') return room.name || 'Group Chat';
    
    // For direct chats, show the other user's name
    const otherUser = room.members.find(member => member.user.id !== user?.id);
    return otherUser?.user.name || 'Direct Chat';
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'SUPPORT') return '🎧';
    if (room.type === 'GROUP') return '👥';
    
    const otherUser = room.members.find(member => member.user.id !== user?.id);
    return otherUser?.user.avatar || '👤';
  };

  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 right-24 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 relative group"
          title="Chat cu utilizatori"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
          <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat Utilizatori
          </span>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className={`fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col ${
            isMaximized ? 'inset-4' : ''
          }`}
          style={
            isMaximized 
              ? {} 
              : {
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${size.width}px`,
                  height: `${size.height}px`
                }
          }
          onMouseDown={handleMouseDown}
        >
          {/* Resize handles */}
          {!isMaximized && (
            <>
              {/* Corner resize handles */}
              <div 
                className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize bg-blue-500 opacity-0 hover:opacity-50 rounded-tl"
                onMouseDown={(e) => handleResize(e, 'top-left')}
              />
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize bg-blue-500 opacity-0 hover:opacity-50 rounded-tr"
                onMouseDown={(e) => handleResize(e, 'top-right')}
              />
              <div 
                className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize bg-blue-500 opacity-0 hover:opacity-50 rounded-bl"
                onMouseDown={(e) => handleResize(e, 'bottom-left')}
              />
              <div 
                className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize bg-blue-500 opacity-0 hover:opacity-50 rounded-br"
                onMouseDown={(e) => handleResize(e, 'bottom-right')}
              />
              
              {/* Edge resize handles */}
              <div 
                className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize"
                onMouseDown={(e) => handleResize(e, 'top')}
              />
              <div 
                className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize"
                onMouseDown={(e) => handleResize(e, 'bottom')}
              />
              <div 
                className="absolute -left-1 top-3 bottom-3 w-2 cursor-w-resize"
                onMouseDown={(e) => handleResize(e, 'left')}
              />
              <div 
                className="absolute -right-1 top-3 bottom-3 w-2 cursor-e-resize"
                onMouseDown={(e) => handleResize(e, 'right')}
              />
            </>
          )}

          {/* Header */}
          <div 
            ref={dragRef}
            className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg cursor-move select-none"
          >
            <div className="flex items-center space-x-2">
              <Move className="h-4 w-4 opacity-70" />
              <h3 className="font-semibold">💬 Chat</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-1 hover:bg-blue-700 rounded"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 hover:bg-blue-700 rounded"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Chat Rooms List */}
            <div className={`${selectedRoom ? 'w-1/3' : 'w-full'} border-r border-gray-200 flex flex-col transition-all duration-200`}>
              {/* Quick Actions */}
              <div className="p-3 border-b border-gray-100 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Acțiuni rapide</span>
                  <button
                    onClick={loadChatRooms}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                    title="Reîmprospătează conversațiile"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={createSupportChat}
                  disabled={loading}
                  className="w-full text-left p-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>🎧</span>
                  <span>{loading ? 'Se creează...' : 'Contact Support'}</span>
                </button>
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>👥</span>
                  <span>Creează Grup</span>
                </button>
              </div>

              {/* Chat Rooms */}
              <div className="flex-1 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Se încarcă...</p>
                  </div>
                )}
                {!loading && chatRooms.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    <div className="text-2xl mb-2">💬</div>
                    <p>Nu ai conversații încă.</p>
                    <p className="text-xs mt-1">Începe o conversație nouă!</p>
                  </div>
                ) : (
                  chatRooms.map(room => (
                    <div
                      key={room.id}
                      className={`relative group p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div 
                        className="flex items-center space-x-3"
                        onClick={() => selectRoom(room)}
                      >
                        <div className="text-2xl">{getRoomAvatar(room)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {getRoomDisplayName(room)}
                            </p>
                            <div className="flex items-center space-x-1">
                              {room.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                  {room.unreadCount > 9 ? '9+' : room.unreadCount}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRoomOptions(showRoomOptions === room.id ? null : room.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          {room.lastMessage && (
                            <p className="text-xs text-gray-500 truncate">
                              {room.lastMessage.sender.name}: {room.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Room Options Menu */}
                      {showRoomOptions === room.id && (
                        <div className="absolute right-2 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                            Opțiuni conversație
                          </div>
                          {room.type === 'GROUP' && (
                            <button
                              onClick={() => leaveGroup(room.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 text-orange-600 flex items-center space-x-2"
                            >
                              <span>🚪</span>
                              <span>Părăsește grupul</span>
                            </button>
                          )}
                          {room.type !== 'SUPPORT' && (
                            <button
                              onClick={() => deleteConversation(room.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                            >
                              <span>🗑️</span>
                              <span>Șterge conversația</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setChatRooms(prev => prev.map(r => 
                                r.id === room.id ? { ...r, unreadCount: 0 } : r
                              ));
                              setShowRoomOptions(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center space-x-2"
                          >
                            <span>✅</span>
                            <span>Marchează ca citit</span>
                          </button>
                          <div className="border-t border-gray-100 mt-1">
                            <button
                              onClick={() => setShowRoomOptions(null)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-600 flex items-center space-x-2"
                            >
                              <span>❌</span>
                              <span>Închide</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Messages */}
            {selectedRoom && (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRoomAvatar(selectedRoom)}</span>
                      <div>
                        <p className="font-medium text-sm">{getRoomDisplayName(selectedRoom)}</p>
                        <p className="text-xs text-gray-500">
                          {selectedRoom.members.length} member{selectedRoom.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button className="p-1 hover:bg-gray-200 rounded" title="Voice Call">
                        <Phone className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Video Call">
                        <Video className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Settings">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative group ${
                        message.sender.id === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {message.sender.id !== user.id && (
                          <p className="text-xs font-medium mb-1">{message.sender.name}</p>
                        )}
                        
                        {/* Message Content */}
                        {editingMessage === message.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded text-gray-800"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  editMessage(message.id, editContent);
                                }
                              }}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => editMessage(message.id, editContent)}
                                className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                                className="text-xs px-2 py-1 bg-gray-500 text-white rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* File/Image Display */}
                            {message.type === 'IMAGE' && message.fileUrl && (
                              <div className="mb-2">
                                <img 
                                  src={message.fileUrl} 
                                  alt={message.fileName || 'Image'} 
                                  className="max-w-full h-auto rounded cursor-pointer"
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                />
                              </div>
                            )}
                            
                            {message.type === 'FILE' && message.fileUrl && (
                              <div className="mb-2">
                                <a 
                                  href={message.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{message.fileName}</span>
                                </a>
                              </div>
                            )}
                            
                            <p className="text-sm">{message.content}</p>
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${
                                message.sender.id === user.id ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {message.isEdited && <span className="ml-1">(edited)</span>}
                              </p>
                              
                              {/* Message Actions */}
                              {message.sender.id === user.id && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                  <button
                                    onClick={() => {
                                      setEditingMessage(message.id);
                                      setEditContent(message.content);
                                    }}
                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                    title="Edit message"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteMessage(message.id)}
                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicators */}
                  {Object.entries(isTyping).some(([_, typing]) => typing) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {/* File Upload Button */}
                    <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="h-4 w-4 text-gray-600" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*,.pdf,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                        disabled={uploadingFile}
                      />
                    </label>
                    
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={uploadingFile ? "Uploading file..." : "Type a message..."}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={uploadingFile}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || uploadingFile || sendingMessage}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[44px]"
                    >
                      {sendingMessage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Start New Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableUsers.map(availableUser => {
                return (
                  <div
                    key={availableUser.id}
                    onClick={() => createDirectChat(availableUser.id)}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {availableUser.avatar ? (
                      <img src={availableUser.avatar} alt={availableUser.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{availableUser.name}</p>
                    <p className="text-sm text-gray-500">{availableUser.email}</p>
                  </div>
                  {availableUser.role === 'admin' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Admin</span>
                  )}
                </div>
                );
              })}
            </div>

            {availableUsers.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <p>No users available for new chats</p>
                <p className="text-xs mt-1">Debug: Check console for details</p>
                <p className="text-xs mt-1">Token: {token ? 'Present' : 'Missing'}</p>
                <p className="text-xs mt-1">User: {user?.name || 'Not loaded'}</p>
                <button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    loadAvailableUsers();
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Refresh Users
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Group Chat</h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName('');
                  setSelectedUsers([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Members:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map(availableUser => (
                    <label
                      key={availableUser.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(availableUser.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, availableUser.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== availableUser.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {availableUser.avatar ? (
                          <img src={availableUser.avatar} alt={availableUser.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm">👤</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{availableUser.name}</p>
                        <p className="text-xs text-gray-500">{availableUser.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName('');
                    setSelectedUsers([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroupChat}
                  disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}