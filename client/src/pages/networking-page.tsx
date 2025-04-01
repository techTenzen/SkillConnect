import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserPlus2, Send, X, Check, Search, MessageCircle } from "lucide-react";
import { User, Invitation, Message } from "@shared/schema";
import NavBar from "@/components/nav-bar";

interface UserCardProps {
  user: Omit<User, "password">;
  onConnect: (userId: number) => void;
  isConnecting: boolean;
}

function UserCard({ user, onConnect, isConnecting }: UserCardProps) {
  const { user: currentUser } = useAuth();
  
  // Don't show the current user
  if (user.id === currentUser?.id) return null;
  
  // Get user initials for avatar fallback
  const initials = user.username.substring(0, 2).toUpperCase();
  
  // Generate a student ID based on username (for UI display)
  const studentId = `21${user.username.toLowerCase().substring(0, 3)}${user.id}${Math.floor(Math.random() * 1000)}`;
  
  // Generate a specialized field description based on user skills
  let specialization = "Student at VIT-AP";
  if (user.skills) {
    const skills = Object.keys(user.skills);
    if (skills.includes("JavaScript") || skills.includes("React") || skills.includes("Web Development")) {
      specialization = "Software engineering student with a focus on web development.";
    } else if (skills.includes("Python") || skills.includes("Machine Learning") || skills.includes("AI")) {
      specialization = "Computer Science student specializing in AI and machine learning.";
    } else if (skills.includes("Database") || skills.includes("SQL") || skills.includes("Data Science")) {
      specialization = "Information systems student interested in database design and management.";
    }
  }
  
  return (
    <Card className="w-full hover:shadow-md transition-shadow bg-purple-950 text-white border-none">
      <CardContent className="pt-6 flex flex-col items-center cursor-pointer" 
        onClick={() => {
          window.location.href = `/users/${user.id}`;
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="bg-purple-500 w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
        </div>
        
        <h3 className="font-medium text-lg mb-1">{studentId}</h3>
        <p className="text-sm text-gray-300 text-center mb-3 px-4">{specialization}</p>
        
        {user.skills && Object.keys(user.skills).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 justify-center">
            {Object.entries(user.skills).slice(0, 3).map(([skill]) => (
              <Badge key={skill} variant="outline" className="text-xs bg-purple-800 text-white border-purple-600 hover:bg-purple-700">
                {skill}
              </Badge>
            ))}
            {Object.keys(user.skills).length > 3 && (
              <Badge variant="outline" className="text-xs bg-purple-800 text-white border-purple-600 hover:bg-purple-700">
                +{Object.keys(user.skills).length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center pb-4">
        <Button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigating to profile
            onConnect(user.id);
          }} 
          disabled={isConnecting}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isConnecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus2 className="mr-2 h-4 w-4" />
          )}
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
}

// Message component
interface MessageCardProps {
  message: Message;
  sender?: Omit<User, "password">;
  receiver?: Omit<User, "password">;
  currentUserId: number;
}

function MessageCard({ message, sender, receiver, currentUserId }: MessageCardProps) {
  const isMyMessage = message.senderId === currentUserId;
  const otherUser = isMyMessage ? receiver : sender;
  
  // Get user initials for avatar fallback
  const initials = otherUser ? otherUser.username.substring(0, 2).toUpperCase() : "??";
  
  // Generate a student ID based on username (for UI display)
  const studentId = otherUser ? 
    `${otherUser.username}` 
    : `User #${isMyMessage ? message.recipientId : message.senderId}`;
  
  // Format timestamp
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const handleViewProfile = () => {
    if (otherUser) {
      window.location.href = `/users/${otherUser.id}`;
    }
  };
  
  return (
    <div className={`flex items-start mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      {!isMyMessage && (
        <div 
          className="cursor-pointer mr-2" 
          onClick={handleViewProfile}
        >
          <div className="bg-purple-600 h-10 w-10 rounded-full flex items-center justify-center text-white text-base font-semibold">
            {initials}
          </div>
        </div>
      )}
      <div className={`max-w-[70%]`}>
        {!isMyMessage && (
          <div className="mb-1">
            <span className="font-medium text-sm text-white cursor-pointer hover:underline" onClick={handleViewProfile}>
              {studentId}
            </span>
          </div>
        )}
        <div className={`rounded-2xl px-3 py-2 ${isMyMessage ? 'bg-purple-700 text-white rounded-br-none' : 'bg-gray-800 text-white rounded-bl-none'}`}>
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="mt-1">
          <span className="text-xs text-gray-400">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}

interface InvitationCardProps {
  invitation: Invitation;
  user?: Omit<User, "password">;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  isResponding: boolean;
}

function InvitationCard({ invitation, user, onAccept, onDecline, isResponding }: InvitationCardProps) {
  // Get user initials for avatar fallback
  const initials = user ? user.username.substring(0, 2).toUpperCase() : "??";
  
  // Use the actual username
  const username = user ? user.username : `User #${invitation.senderId}`;
  
  const handleViewProfile = () => {
    if (user) {
      window.location.href = `/users/${invitation.senderId}`;
    }
  };
  
  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="flex items-center">
        <div 
          className="cursor-pointer" 
          onClick={handleViewProfile}
        >
          <div className="bg-purple-600 h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold">
            {initials}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center">
            <h3 className="font-medium text-white cursor-pointer hover:underline" onClick={handleViewProfile}>
              {username}
            </h3>
            <span className="text-gray-400 text-sm ml-2">wants to connect with you</span>
          </div>
          
          {invitation.message && (
            <p className="text-sm mt-1 text-gray-300 italic">"{invitation.message}"</p>
          )}
          
          <div className="mt-2 flex gap-2">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={(e) => {
                e.stopPropagation();
                onDecline(invitation.id);
              }} 
              disabled={isResponding}
              className="bg-transparent border border-gray-600 hover:bg-gray-800 text-gray-300"
            >
              Decline
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={(e) => {
                e.stopPropagation();
                onAccept(invitation.id);
              }} 
              disabled={isResponding}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NetworkingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("people");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"username" | "skills">("username");
  const [filteredUsers, setFilteredUsers] = useState<Omit<User, "password">[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/users");
        const data = await response.json();
        // Return empty array if response is not an array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
  });
  
  // Fetch user's invitations
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/invitations");
        const data = await response.json();
        // Return empty array if response is not an array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching invitations:", error);
        return [];
      }
    },
    // Enable invitations query
    enabled: true,
  });
  
  // Fetch messages for the selected user
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId || !user) return [];
      try {
        const response = await apiRequest("GET", `/api/messages/${selectedUserId}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    enabled: Boolean(selectedUserId) && Boolean(user),
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedUserId || !user) throw new Error("No user selected");
      await apiRequest("POST", "/api/messages", {
        recipientId: selectedUserId,
        content
      });
    },
    onSuccess: () => {
      setNewMessage("");
      toast({
        title: "Message sent",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create connection request mutation
  const connectMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      if (!user) throw new Error("You must be logged in to send connection requests");
      
      await apiRequest("POST", "/api/connection-requests", {
        recipientId,
        message: "I'd like to connect with you!",
        senderId: user.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: "The user will be notified of your request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connection-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send connection request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/invitations/${id}/respond`, {
        status: "accepted"
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation accepted",
        description: "You are now connected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Decline invitation mutation
  const declineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/invitations/${id}/respond`, {
        status: "declined"
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation declined",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decline invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Get pending invitations (received, not sent)
  const pendingInvitations = invitations.filter(
    inv => inv.recipientId === user?.id && inv.status === "pending"
  );
  
  // Search and filter users
  useEffect(() => {
    if (!users.length || !searchQuery.trim()) {
      setFilteredUsers(users.filter(u => u.id !== user?.id));
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(u => {
      // Don't include current user
      if (u.id === user?.id) return false;
      
      if (searchBy === "username") {
        return u.username.toLowerCase().includes(query) || 
               (u.bio && u.bio.toLowerCase().includes(query));
      } else if (searchBy === "skills") {
        if (!u.skills) return false;
        
        // Check if any skill matches the query
        return Object.keys(u.skills).some(skill => 
          skill.toLowerCase().includes(query)
        );
      }
      return false;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, searchBy, user?.id]);
  
  // Find user data for each invitation
  const findUserById = (userId: number) => {
    return users.find(u => u.id === userId);
  };
  
  if (!user) return null;
  
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8 text-white">Networking</h1>
        
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-purple-900">
              <TabsTrigger 
                value="people" 
                className="data-[state=active]:bg-purple-700 data-[state=active]:text-white text-gray-200"
              >
                People
              </TabsTrigger>
              <TabsTrigger 
                value="invitations" 
                className="data-[state=active]:bg-purple-700 data-[state=active]:text-white text-gray-200 relative"
              >
                Invitations
                {pendingInvitations.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="data-[state=active]:bg-purple-700 data-[state=active]:text-white text-gray-200"
              >
                Messages
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="people">
              <div className="mb-6">
                <div className="flex gap-2 items-center mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search for students by name or skill..."
                      className="pl-8 bg-gray-900 border-gray-700 text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={searchBy === "username" ? "default" : "outline"}
                      size="sm"
                      className={searchBy === "username" 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                        : "text-gray-300 border-gray-600 hover:bg-gray-800"}
                      onClick={() => setSearchBy("username")}
                    >
                      By Name
                    </Button>
                    <Button
                      variant={searchBy === "skills" ? "default" : "outline"}
                      size="sm"
                      className={searchBy === "skills" 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                        : "text-gray-300 border-gray-600 hover:bg-gray-800"}
                      onClick={() => setSearchBy("skills")}
                    >
                      By Skill
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {isLoadingUsers ? (
                  <div className="col-span-full flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    {searchQuery ? "No users matching your search" : "No users found"}
                  </div>
                ) : (
                  filteredUsers.map(otherUser => (
                    <UserCard
                      key={otherUser.id}
                      user={otherUser}
                      onConnect={(userId) => connectMutation.mutate(userId)}
                      isConnecting={connectMutation.isPending}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="invitations">
              <div className="space-y-4">
                {isLoadingInvitations ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : pendingInvitations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No pending invitations
                  </div>
                ) : (
                  pendingInvitations.map(invitation => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      user={findUserById(invitation.senderId)}
                      onAccept={(id) => acceptMutation.mutate(id)}
                      onDecline={(id) => declineMutation.mutate(id)}
                      isResponding={acceptMutation.isPending || declineMutation.isPending}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="messages">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* User list */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-200">Messages</h3>
                  
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {users.filter(u => u.id !== user?.id).map(otherUser => {
                      const isSelected = selectedUserId === otherUser.id;
                      const initials = otherUser.username.substring(0, 2).toUpperCase();
                      
                      // Count unread messages from this user
                      const unreadCount = messages.filter(
                        m => m.senderId === otherUser.id && !m.read
                      ).length;
                      
                      return (
                        <div 
                          key={otherUser.id}
                          className={`flex items-center p-2 rounded-md cursor-pointer ${
                            isSelected ? 'bg-purple-700' : 'hover:bg-gray-800'
                          }`}
                          onClick={() => setSelectedUserId(otherUser.id)}
                        >
                          <div className="relative">
                            <div className="bg-purple-600 h-10 w-10 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                              {initials}
                            </div>
                            {unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm text-white">{otherUser.username}</h4>
                              {unreadCount > 0 && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {otherUser.bio?.substring(0, 20) || "No bio"}
                              {otherUser.bio && otherUser.bio.length > 20 ? "..." : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Messages */}
                <div className="md:col-span-2 bg-gray-900 rounded-lg p-4 flex flex-col">
                  {selectedUserId ? (
                    <>
                      <div className="flex items-center pb-4 border-b border-gray-800 mb-4">
                        <div className="bg-purple-600 h-10 w-10 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                          {findUserById(selectedUserId)?.username.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <h3 className="text-lg font-medium text-white">
                          {findUserById(selectedUserId)?.username || `User #${selectedUserId}`}
                        </h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-[340px]">
                        {isLoadingMessages ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            No messages yet. Start a conversation!
                          </div>
                        ) : (
                          messages.map(message => (
                            <MessageCard
                              key={message.id}
                              message={message}
                              sender={findUserById(message.senderId)}
                              receiver={findUserById(message.recipientId)}
                              currentUserId={user.id}
                            />
                          ))
                        )}
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type your message..."
                            className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                          />
                          <Button 
                            className="self-end bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                            onClick={() => {
                              if (newMessage.trim()) {
                                sendMessageMutation.mutate(newMessage.trim())
                              }
                            }}
                          >
                            {sendMessageMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-600 mb-4" />
                      <h3 className="text-xl font-medium text-gray-400 mb-2">No conversation selected</h3>
                      <p className="text-gray-500">Select a user from the list to start messaging</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}