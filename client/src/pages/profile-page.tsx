import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { SkillList } from "@/components/skill-meter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Pencil, Plus, Save, Loader2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Project } from "@shared/schema";

// Skill editor component for profile page
function SkillEditor({
  open,
  onOpenChange,
  initialSkills,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSkills: Record<string, number>;
  onSave: (skills: Record<string, number>) => void;
}) {
  const [skills, setSkills] = useState<Record<string, number>>(initialSkills || {});
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState(50);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    setSkills(prev => ({
      ...prev,
      [newSkill]: newLevel
    }));
    
    setNewSkill("");
    setNewLevel(50);
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => {
      const updated = { ...prev };
      delete updated[skill];
      return updated;
    });
  };

  const handleUpdateSkillLevel = (skill: string, level: number) => {
    setSkills(prev => ({
      ...prev,
      [skill]: level
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Skills</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="New skill (e.g. React, Python)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Slider 
                value={[newLevel]} 
                min={1} 
                max={100} 
                step={1}
                onValueChange={(value) => setNewLevel(value[0])}
              />
            </div>
            <Button type="button" size="sm" onClick={handleAddSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(skills).map(([skill, level]) => (
              <div key={skill} className="flex items-center gap-2">
                <div className="flex-1 font-medium">{skill}</div>
                <div className="w-32">
                  <Slider 
                    value={[level]} 
                    min={1} 
                    max={100} 
                    step={1}
                    onValueChange={(value) => handleUpdateSkillLevel(skill, value[0])}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveSkill(skill)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" onClick={() => onSave(skills)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skillEditorOpen, setSkillEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user's projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async ({ signal }) => {
      const data = await apiRequest<Project[]>("GET", "/api/projects", undefined, { signal });
      // Filter to only show projects the user is owner of or member of
      if (user) {
        return data.filter(project => 
          project.ownerId === user.id || 
          (project.members && project.members.includes(user.id))
        );
      }
      return [];
    },
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(
      z.object({
        bio: z.string().optional(),
        avatar: z.string().url().optional(),
        skills: z.record(z.string(), z.number().min(0).max(100)).optional(),
        social: z.object({
          github: z.string().url().optional(),
          linkedin: z.string().url().optional(),
        }).optional(),
      })
    ),
    defaultValues: {
      bio: user?.bio || "",
      avatar: user?.avatar || "",
      skills: user?.skills || {},
      social: user?.social || {},
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      setSkillEditorOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveSkills = (skills: Record<string, number>) => {
    const formValues = form.getValues();
    updateMutation.mutate({
      ...formValues,
      skills
    });
  };

  if (!user) return null;

  // Skill editor dialog
  const userSkills = user.skills || {};

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="projects">My Projects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Professional Links */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Professional Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Form {...form}>
                      <form className="space-y-4">
                        <FormField
                          control={form.control}
                          name="social.github"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://github.com/username" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="social.linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://linkedin.com/in/username" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            onClick={form.handleSubmit((data) => {
                              updateMutation.mutate({
                                social: data.social
                              });
                            })}
                            disabled={updateMutation.isPending}
                            size="sm"
                          >
                            {updateMutation.isPending ? 
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                              <Save className="mr-2 h-4 w-4" />}
                            Save
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                {/* Profile Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Description about you</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form className="space-y-4">
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell us about yourself..."
                                  className="min-h-[120px]"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            onClick={form.handleSubmit((data) => {
                              updateMutation.mutate({
                                bio: data.bio
                              });
                            })}
                            disabled={updateMutation.isPending}
                            size="sm"
                          >
                            {updateMutation.isPending ? 
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                              <Save className="mr-2 h-4 w-4" />}
                            Save
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              
              {/* Skills & Interests */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Skills & Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(userSkills).length > 0 ? (
                    <SkillList skills={userSkills} />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No skills added yet. Click edit to add your skills.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSkillEditorOpen(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Available for Collaboration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Available for Collaboration</CardTitle>
                  <CardDescription>
                    Are you looking to work on innovative projects and team up with other students?
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 flex justify-end">
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        // Navigate to networking page
                        window.location.href = "/networking";
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Current Projects</CardTitle>
                  <CardDescription>
                    Projects you have created or are participating in.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>You haven't joined any projects yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          window.location.href = "/projects";
                        }}
                      >
                        Browse Projects
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project: Project) => (
                        <Card key={project.id} className="overflow-hidden">
                          <CardHeader className="p-4">
                            <CardTitle className="text-md">{project.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {project.description}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
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
                            <div className="flex-1" />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                window.location.href = `/projects/${project.id}`;
                              }}
                            >
                              View
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
      
      {/* Skill editor dialog */}
      <SkillEditor
        open={skillEditorOpen}
        onOpenChange={setSkillEditorOpen}
        initialSkills={userSkills}
        onSave={handleSaveSkills}
      />
    </div>
  );
}