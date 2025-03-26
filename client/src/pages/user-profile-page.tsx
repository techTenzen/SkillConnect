import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/nav-bar";
import { SkillList } from "@/components/skill-meter";
import { User, Project } from "@shared/schema";
import { Invitation } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  Mail, 
  Linkedin, 
  Github, 
  Instagram, 
  Share, 
  Calendar, 
  Link,
  UserPlus, 
  UserCheck,
  Clock,
  MessageSquare
} from "lucide-react";

// Component for user profile header with connect button
function ProfileHeader({ profile, onConnect, connectionStatus }: { 
  profile: any, 
  onConnect: () => void,
  connectionStatus: "none" | "pending" | "connected" 
}) {
  // Generate initials from username
  const getInitials = (username: string) => {
    return username
      .split(/\s+/)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="relative rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 mb-8 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white">
            {profile.avatar ? (
              <AvatarImage src={profile.avatar} alt={profile.username} />
            ) : (
              <AvatarFallback className="text-xl">{getInitials(profile.username)}</AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{profile.username}</h2>
            <p className="text-white/80 mt-1 max-w-md">
              {profile.bio || "No bio provided."}
            </p>
            
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              {profile.social?.github && (
                <a 
                  href={profile.social.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              )}
              {profile.social?.linkedin && (
                <a 
                  href={profile.social.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              )}
              {profile.social?.instagram && (
                <a 
                  href={profile.social.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </a>
              )}
            </div>
          </div>
          
          <div>
            {connectionStatus === "none" && (
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 hover:text-white"
                onClick={onConnect}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Connect
              </Button>
            )}
            {connectionStatus === "pending" && (
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 hover:text-white"
                disabled
              >
                <Clock className="h-4 w-4 mr-2" />
                Request Sent
              </Button>
            )}
            {connectionStatus === "connected" && (
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 hover:text-white"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Connected
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main user profile component
export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = parseInt(id);
  const [activeTab, setActiveTab] = useState("skills");

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}`);
      return response;
    },
    enabled: !!userId && !!user,
  });

  // Fetch user's projects
  const { data: allProjects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async ({ signal }) => {
      const response = await apiRequest("GET", "/api/projects", undefined, { signal });
      return Array.isArray(response) ? response : [];
    },
    enabled: !!userId && !!user,
  });

  // Filter projects for this user
  const userProjects = allProjects.filter((project: Project) => 
    project.ownerId === userId || 
    (project.members && project.members.includes(userId))
  );

  // Connection mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/invitations", {
        recipientId: userId,
        message: `${user?.username} would like to connect with you.`
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send connection request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  // Determine connection status
  const connectionStatus = 
    profile?.isConnected ? "connected" :
    profile?.hasSentRequest ? "pending" : "none";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-medium">Loading profile...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The user profile you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => setLocation("/networking")}>
              Go to Networking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If viewing own profile, redirect to profile page
  if (user && user.id === userId) {
    setLocation("/profile");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <ProfileHeader 
          profile={profile} 
          onConnect={handleConnect} 
          connectionStatus={connectionStatus}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="skills">Skills & Expertise</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="skills" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills & Expertise</CardTitle>
                  <CardDescription>
                    Areas of knowledge and proficiency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.skills && Object.keys(profile.skills).length > 0 ? (
                    <SkillList skills={profile.skills} />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No skills have been added yet.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const message = encodeURIComponent(`Hi ${profile.username}, I noticed we have some common skills and interests. Would you be interested in collaborating?`);
                      window.location.href = `mailto:${profile.email || ""}?subject=Let's collaborate on a project&body=${message}`;
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collaboration Opportunities</CardTitle>
                  <CardDescription>
                    Explore ways to work together with {profile.username}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button
                    variant="default"
                    onClick={() => setActiveTab("projects")}
                  >
                    View Projects
                  </Button>
                  
                  {connectionStatus === "connected" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Feature coming soon",
                          description: "Direct messaging will be available in a future update.",
                        });
                      }}
                    >
                      Start Conversation
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={connectionStatus === "pending" || connectMutation.isPending}
                      onClick={handleConnect}
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      {connectionStatus === "pending" ? "Request Sent" : "Connect First"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>{profile.username}'s Projects</CardTitle>
                  <CardDescription>
                    Projects they have created or are participating in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>This user hasn't joined any projects yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userProjects.map((project: Project) => (
                        <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader className="p-4">
                            <CardTitle className="text-md">{project.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {project.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {project.skills && project.skills.length > 0 && 
                                project.skills.slice(0, 3).map((skill, i) => (
                                  <Badge key={i} variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              {project.skills && project.skills.length > 3 && (
                                <Badge variant="outline">
                                  +{project.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                            {project.deadline && (
                              <div className="flex items-center text-sm text-muted-foreground mt-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-end">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => {
                                window.location.href = `/projects/${project.id}`;
                              }}
                            >
                              View Project
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}