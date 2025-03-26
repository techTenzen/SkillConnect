import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, UserPlus2, User, MessageSquare, Users } from "lucide-react";
import { User as UserType, Invitation } from "@shared/schema";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UserCardProps {
  user: Omit<UserType, "password">;
  onConnect: (userId: number) => void;
  isConnecting: boolean;
}

function UserCard({ user, onConnect, isConnecting }: UserCardProps) {
  const { user: currentUser } = useAuth();
  
  // Don't show the current user
  if (user.id === currentUser?.id) return null;
  
  // Get user initials for avatar fallback
  const initials = user.username.substring(0, 2).toUpperCase();
  
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
      onClick={() => {
        window.location.href = `/users/${user.id}`;
      }}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar || ""} alt={user.username} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.username}</p>
        <p className="text-xs text-muted-foreground truncate">
          {user.bio || "No bio available"}
        </p>
      </div>
      <Button 
        size="sm"
        variant="ghost"
        className="ml-auto flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onConnect(user.id);
        }}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default function ChatNetworkingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you with your academic projects or finding collaborators?",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<Omit<UserType, "password">[]>({
    queryKey: ["/api/users"],
    queryFn: async ({ signal }) => {
      try {
        const response = await apiRequest("GET", "/api/users", undefined, { 
          signal, 
          headers: { 'Content-Type': 'application/json' } 
        });
        // Return empty array if response is not an array
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
  });
  
  // Create invitation mutation
  const connectMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      await apiRequest("POST", "/api/invitations", {
        recipientId,
        message: "I'd like to connect with you!",
        projectId: null
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: "The user will be notified of your request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send connection request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { message });
      if (typeof response === 'object' && 'message' in response) {
        return response.message;
      }
      return "I'm sorry, I couldn't process that request.";
    },
    onSuccess: (responseMessage) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: responseMessage,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    
    sendMessageMutation.mutate(message);
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">AI Assistant & Network</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat section */}
          <Card className="col-span-2 flex flex-col h-[calc(100vh-13rem)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto pb-0">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <CardFooter className="pt-3">
              <form 
                className="flex w-full gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input
                  placeholder="Ask about projects or skills..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit"
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
          
          {/* Networking section */}
          <Card className="flex flex-col h-[calc(100vh-13rem)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Network
              </CardTitle>
              <CardDescription>
                Connect with other students
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto pb-0 space-y-1">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Suggested Connections</h3>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => window.location.href = "/networking"}
                    >
                      View All
                    </Button>
                  </div>
                  {users
                    .filter(u => u.id !== user.id)
                    .slice(0, 5)
                    .map(otherUser => (
                      <UserCard
                        key={otherUser.id}
                        user={otherUser}
                        onConnect={(userId) => connectMutation.mutate(userId)}
                        isConnecting={connectMutation.isPending}
                      />
                    ))}
                    
                  <Separator className="my-3" />
                  
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">By Skills</h3>
                  </div>
                  {users
                    .filter(u => u.id !== user.id && u.skills && Object.keys(u.skills).length > 0)
                    .slice(0, 5)
                    .map(otherUser => (
                      <UserCard
                        key={otherUser.id}
                        user={otherUser}
                        onConnect={(userId) => connectMutation.mutate(userId)}
                        isConnecting={connectMutation.isPending}
                      />
                    ))}
                </>
              )}
            </CardContent>
            
            <CardFooter className="pt-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = "/networking"}
              >
                View Full Network
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}