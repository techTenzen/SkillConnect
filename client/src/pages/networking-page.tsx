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
import { Loader2, UserPlus2, Send, X, Check, Search } from "lucide-react";
import { User, Invitation } from "@shared/schema";
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
  
  return (
    <Card className="w-full max-w-[300px] hover:shadow-md transition-shadow">
      <CardContent className="pt-6 flex flex-col items-center cursor-pointer" 
        onClick={() => {
          window.location.href = `/users/${user.id}`;
        }}
      >
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={user.avatar || ""} alt={user.username} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <h3 className="font-medium text-lg">{user.username}</h3>
        <p className="text-sm text-muted-foreground mb-2">{user.bio || "No bio available"}</p>
        
        {user.skills && Object.keys(user.skills).length > 0 && (
          <div className="flex flex-wrap gap-1 my-2 justify-center">
            {Object.entries(user.skills).slice(0, 3).map(([skill]) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {Object.keys(user.skills).length > 3 && (
              <Badge variant="outline" className="text-xs">
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
          className="w-full"
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
  
  const handleViewProfile = () => {
    if (user) {
      window.location.href = `/users/${invitation.senderId}`;
    }
  };
  
  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="pt-6 flex items-center">
        <div 
          className="flex items-center flex-1 cursor-pointer" 
          onClick={handleViewProfile}
        >
          <Avatar className="h-12 w-12 mr-4">
            <AvatarImage src={user?.avatar || ""} alt={user?.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {user ? user.username : `User #${invitation.senderId}`}
            </h3>
            {invitation.projectId && (
              <p className="text-sm text-muted-foreground">
                Invited you to join their project
              </p>
            )}
            {invitation.message && (
              <p className="text-sm mt-1">"{invitation.message}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={(e) => {
              e.stopPropagation();
              onDecline(invitation.id);
            }} 
            disabled={isResponding}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            onClick={(e) => {
              e.stopPropagation();
              onAccept(invitation.id);
            }} 
            disabled={isResponding}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NetworkingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("people");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"username" | "skills">("username");
  const [filteredUsers, setFilteredUsers] = useState<Omit<User, "password">[]>([]);
  
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
  
  // Create connection request mutation
  const connectMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      await apiRequest("POST", "/api/connection-requests", {
        recipientId,
        message: "I'd like to connect with you!"
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
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Networking</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="invitations" className="relative">
            Invitations
            {pendingInvitations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="people">
          <div className="mb-6">
            <div className="flex gap-2 items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for students by name or skill..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={searchBy === "username" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchBy("username")}
                >
                  By Name
                </Button>
                <Button
                  variant={searchBy === "skills" ? "default" : "outline"}
                  size="sm"
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
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
      </Tabs>
    </div>
    </>
  );
}