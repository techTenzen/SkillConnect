import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, Users, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestSent, setRequestSent] = useState(false);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", params.id],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/projects/${queryKey[1]}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${params.id}/join`, {
        userId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      setRequestSent(true);
      queryClient.invalidateQueries({ queryKey: ["/api/projects", params.id] });
      toast({
        title: "Request sent",
        description: "Your request to join this project has been sent to the owner.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await apiRequest("POST", `/api/projects/${params.id}/accept`, { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", params.id] });
      toast({
        title: "Request accepted",
        description: "The user has been added to the project team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await apiRequest("POST", `/api/projects/${params.id}/reject`, { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", params.id] });
      toast({
        title: "Request rejected",
        description: "The join request has been declined.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if the user has already sent a request
  useEffect(() => {
    if (project?.joinRequests?.includes(user?.id as number)) {
      setRequestSent(true);
    }
  }, [project, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold">Project not found</h1>
        </div>
      </div>
    );
  }

  const isOwner = project.ownerId === user?.id;
  const deadline = project.deadline ? new Date(project.deadline) : null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        {project.title}
                      </CardTitle>
                      <CardDescription>
                        Posted by {isOwner ? "you" : "another user"}
                      </CardDescription>
                    </div>
                    {!isOwner && (
                      <Button 
                        onClick={() => sendRequestMutation.mutate()}
                        disabled={requestSent || sendRequestMutation.isPending}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {sendRequestMutation.isPending 
                          ? "Sending..." 
                          : requestSent 
                            ? "Request Sent" 
                            : "Request to Join"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base mb-6">
                    {project.description}
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.skills?.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-purple-500/10">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <h3 className="text-lg font-semibold mb-2">Tools Used</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tools?.map((tool) => (
                      <Badge key={tool} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold mb-2">Seeking</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.rolesSought?.map((role) => (
                      <Badge key={role} variant="outline" className="bg-blue-500/10">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Deadline</p>
                      <p className="text-sm text-muted-foreground">
                        {deadline ? format(deadline, "MMMM d, yyyy") : "No deadline set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {project.setting === "remote" ? "Remote" : project.location || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Team Members</p>
                      <p className="text-sm text-muted-foreground">
                        {project.members?.length || 1} member{(project.members?.length || 1) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {project.status || "In Progress"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isOwner && project.joinRequests && project.joinRequests.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Join Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.joinRequests.map((requesterId) => (
                        <div key={requesterId} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span>User #{requesterId}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acceptRequestMutation.mutate({ userId: requesterId })}
                              disabled={acceptRequestMutation.isPending}>
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-500"
                              onClick={() => rejectRequestMutation.mutate({ userId: requesterId })}
                              disabled={rejectRequestMutation.isPending}>
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}