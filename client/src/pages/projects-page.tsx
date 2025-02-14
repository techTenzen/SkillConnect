import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, insertProjectSchema } from "@shared/schema";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Search, SlidersHorizontal, Eye, MessageSquare, Image as ImageIcon } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // Query projects with error handling
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    retry: 1,
  });

  const form = useForm({
    resolver: zodResolver(
      insertProjectSchema.extend({
        tools: z.array(z.string()),
        rolesSought: z.array(z.string()),
        setting: z.enum(["remote", "in-person"]),
        location: z.string(),
        deadline: z.date(),
      })
    ),
    defaultValues: {
      title: "",
      description: "",
      skills: [],
      tools: [],
      rolesSought: [],
      setting: "in-person",
      location: "",
      deadline: new Date(),
    },
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertProjectSchema>) => {
      const res = await apiRequest("POST", "/api/projects", data);
      if (!res.ok) {
        throw new Error("Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Filter and sort projects
  const filteredProjects = projects?.filter((project) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
      project.rolesSought?.some(role => role.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Error loading projects</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Collab Space</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>About The Project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                    {/* Project Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Project Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Details</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Describe your project goals and requirements"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Skills and Tools */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Skills</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. React, Node.js"
                                value={field.value?.join(", ")}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tools"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tools</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. VS Code, Figma"
                                value={field.value.join(", ")}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Roles and Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rolesSought"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roles Sought</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Frontend Dev, Designer"
                                value={field.value.join(", ")}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Wayne, PA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Setting and Deadline */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="setting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Setting</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select setting" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="in-person">In-Person</SelectItem>
                                <SelectItem value="remote">Remote</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date()
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-4">
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by Major, Skills, Tags"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProjects?.map((project) => (
                <motion.div key={project.id} variants={item}>
                  <Card className="group hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl hover:text-primary cursor-pointer">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Posted by {project.ownerId === user?.id ? "you" : "another user"}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills?.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-purple-500/10">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>34</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>12</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}