import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare, 
  LogOut, 
  Send, 
  X,
  Bell
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; 

export default function NavBar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiMessages, setAiMessages] = useState<{role: string, content: string}[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you with your academic projects or finding collaborators?"
    }
  ]);
  
  // Get pending invitations for notification badge
  const { data: invitations = [] } = useQuery({
    queryKey: ["/api/invitations"],
    queryFn: async () => {
      if (!user) return [];
      try {
        const response = await apiRequest("GET", "/api/invitations");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching invitations:", error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Get unread messages for notification badge
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ["/api/messages/unread"],
    queryFn: async () => {
      if (!user) return [];
      try {
        const response = await apiRequest("GET", "/api/messages/unread");
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching unread messages:", error);
        return [];
      }
    },
    enabled: !!user,
    // Poll for new messages every 15 seconds
    refetchInterval: 15000,
  });
  
  // Calculate pending notifications
  const pendingInvitations = invitations.filter(
    inv => inv.recipientId === user?.id && inv.status === "pending"
  ).length;
  
  const unreadMessageCount = unreadMessages.length;

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { message });
      if (typeof response === 'object' && 'message' in response) {
        return response.message as string;
      }
      return "I'm sorry, I couldn't process that request.";
    },
    onSuccess: (responseMessage: string) => {
      setAiMessages((prev) => [
        ...prev, 
        { role: "assistant", content: responseMessage }
      ]);
      setAiResponse(responseMessage);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setAiMessages((prev) => [
      ...prev, 
      { role: "user", content: message }
    ]);
    sendMessageMutation.mutate(message);
    setMessage("");
  };

  const navItems = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/projects", label: "Projects", icon: Users },
    { path: "/forum", label: "Forum", icon: BookOpen },
    { path: "/networking", label: "Network", icon: Users },
  ];

  if (!user) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/">
              <div className="font-bold text-xl cursor-pointer">
                VIT-AP SkillConnect
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth?mode=login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center space-x-4 lg:space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => {
              // Add notification badges to the Network link
              const hasNetworkNotifications = path === "/networking" && (pendingInvitations > 0 || unreadMessageCount > 0);
              const totalNotifications = pendingInvitations + unreadMessageCount;
              
              return (
                <Link key={path} href={path}>
                  <div
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                      location === path
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      {hasNetworkNotifications && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {totalNotifications}
                        </div>
                      )}
                    </div>
                    <span>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center space-x-4">
            {/* AI Chat Button */}
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 text-primary"
              onClick={() => setIsAIChatOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI Chat</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.username || 'User'} />
                      <AvatarFallback>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {(pendingInvitations > 0 || unreadMessageCount > 0) && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {pendingInvitations + unreadMessageCount}
                      </div>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/networking">
                  <DropdownMenuItem className="cursor-pointer">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Networking</span>
                      </div>
                      {(pendingInvitations > 0 || unreadMessageCount > 0) && (
                        <Badge variant="destructive" className="ml-2">
                          {pendingInvitations + unreadMessageCount}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* AI Chat Dialog */}
      <Dialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Assistant
            </DialogTitle>
            <DialogDescription>
              Ask me anything about academics, projects, or finding collaborators
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto p-4 space-y-4 border rounded-md">
            {aiMessages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted max-w-[80%] rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="grid flex-1 gap-2">
              <Textarea 
                placeholder="Ask about projects, skills, or finding teammates..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
            <Button 
              type="submit" 
              size="icon"
              disabled={sendMessageMutation.isPending || !message.trim()}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsAIChatOpen(false)}
            >
              Close
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => window.location.href = "/chat"}
              className="text-primary"
            >
              Open full chat view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}