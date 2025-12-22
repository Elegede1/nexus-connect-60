
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Search, MoreVertical, Phone, Video, Info, ArrowLeft, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  username: string;
}

interface Message {
  id: number;
  sender: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  timestamp: string;
}

interface ChatRoom {
  id: number;
  landlord: User;
  tenant: User;
  property: {
    id: number;
    title: string;
    cover_image: string | null;
  };
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
}

export default function Messages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [conversations, setConversations] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 30s
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle auto-selection from navigation state
  useEffect(() => {
    if (location.state?.selectedRoomId) {
      const roomId = location.state.selectedRoomId;
      // If we have the full room object, use it immediately
      if (location.state.room) {
        setSelectedChat(location.state.room);
      } else {
        // Otherwise find it in the list (might need to fetch if not loaded yet)
        const found = conversations.find(c => c.id === roomId);
        if (found) setSelectedChat(found);
      }
      // Clear state so it doesn't persist on refresh/navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations]);

  const connectWebSocket = () => {
    if (!selectedChat || !token) return;

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/chat/${selectedChat.id}/?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("Connected to chat", selectedChat.id);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        const incomingMsg = data.message;
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });

        // Update conversation list with new last message
        setConversations(prev => prev.map(c => {
          if (c.id === selectedChat.id) {
            return {
              ...c,
              last_message: incomingMsg,
              updated_at: incomingMsg.timestamp
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from chat");
      // Attempt reconnect if still on the same chat
      reconnectTimeoutRef.current = setTimeout(() => {
        if (selectedChat.id === selectedChat.id) { // naive check, better to rely on ref or just depend on useEffect
          // rely on useEffect re-triggering? No, simpler to just let user or deps handle it
          // But for robustness, we can try to reconnect.
          // However, if we just close, we might want to flag it.
        }
      }, 3000);
    };

    socketRef.current = socket;
  };

  // WebSocket Connection
  useEffect(() => {
    if (selectedChat && token) {
      fetchMessages(selectedChat.id);
      connectWebSocket();

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [selectedChat, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Handle DRF pagination
        const conversationList = Array.isArray(data) ? data : (data.results || []);
        setConversations(conversationList);
      }
    } catch (error) {
      console.error('Error fetching conversations', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms/${chatId}/messages/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Handle DRF pagination
        const messageList = Array.isArray(data) ? data : (data.results || []);
        setMessages(messageList);
      }
    } catch (error) {
      console.error('Error fetching messages', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setIsSending(true);

    // Optimistic update? WebSocket will handle the update, but for faster UX we can append instantly?
    // Let's stick to API POST for reliability, and let WS broadcast update the UI. 
    // Wait, if we POST, the server saves and triggers WS broadcast.
    // If we append locally AND receive WS, we might duplicate.
    // Strategy: POST, wait for WS to update state. 
    // OR: WebSocket send()?
    // Backend consumer has receive() method that creates message.

    // Let's use WebSocket for sending if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: newMessage }));
      setNewMessage('');
      setIsSending(false);
      return;
    }

    // Fallback to HTTP POST if WS fails or is not connected
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms/${selectedChat.id}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const data = await response.json();
        // Append message locally immediately
        setMessages((prev) => [...prev, data]);
        setNewMessage('');

        // Update conversation last message
        setConversations(prev => prev.map(c => {
          if (c.id === selectedChat.id) {
            return {
              ...c,
              last_message: data,
              updated_at: data.timestamp
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

      } else {
        toast({
          title: "Error sending message",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Network error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getOtherUser = (conversation: ChatRoom) => {
    if (!user) return conversation.landlord; // Fallback
    return user.id === conversation.landlord.id ? conversation.tenant : conversation.landlord;
  };

  const filteredConversations = conversations.filter(c => {
    const otherUser = getOtherUser(c);
    const searchLower = searchQuery.toLowerCase();
    return otherUser.first_name.toLowerCase().includes(searchLower) ||
      otherUser.last_name.toLowerCase().includes(searchLower) ||
      c.property?.title.toLowerCase().includes(searchLower);
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex overflow-hidden pt-16">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-muted/10",
          selectedChat ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations yet</div>
            ) : (
              <div className="flex flex-col">
                {filteredConversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const isActive = selectedChat?.id === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedChat(conversation)}
                      className={cn(
                        "flex items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                        isActive && "bg-accent"
                      )}
                    >
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={otherUser?.avatar || undefined} />
                        <AvatarFallback>{otherUser?.first_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold truncate">
                            {otherUser?.first_name} {otherUser?.last_name}
                          </span>
                          {conversation.last_message && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {format(new Date(conversation.last_message.timestamp), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-primary mb-1 truncate">{conversation.property?.title}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-primary hover:bg-primary h-5 min-w-5 flex items-center justify-center rounded-full px-1">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Header */}
            <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-border">
                  <AvatarImage src={getOtherUser(selectedChat)?.avatar || undefined} />
                  <AvatarFallback>{getOtherUser(selectedChat)?.first_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{getOtherUser(selectedChat)?.first_name} {getOtherUser(selectedChat)?.last_name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedChat.property?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5 opacity-70" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-5 h-5 opacity-70" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Info className="w-5 h-5 opacity-70" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => {
                  const isOwn = message.sender === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-max max-w-[75%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
                        isOwn
                          ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      )}
                    >
                      {message.content}
                      <div className={cn("flex items-center gap-1 justify-end text-[10px] opacity-70", isOwn ? "text-primary-foreground" : "text-muted-foreground")}>
                        <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
                        {isOwn && (
                          message.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a chat from the left to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
