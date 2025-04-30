import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, insertProjectSchema, User } from "@shared/schema";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Eye, 
  Image as ImageIcon, 
  Loader2, 
  MessageSquare, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  X, 
  Calendar as CalendarIcon,
  Tag,
  Users,
  Filter,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [date, setDate] = useState<Date>();
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: allProjects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Filter projects based on search query, sort, and member availability
  const filteredProjects = allProjects?.filter(project => {
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        project.tools?.some(tool => tool.toLowerCase().includes(searchLower)) ||
        project.rolesSought?.some(role => role.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by skills
    if (filterSkills.length > 0) {
      return project.skills?.some(skill => 
        filterSkills.includes(skill.toLowerCase())
      );
    }
    
    return true;
  });

  // Sort projects based on selected criteria
  const sortedProjects = filteredProjects?.sort((a, b) => {
    if (sortBy === "recent") {
      // Sort by most recent (using id as a proxy for creation time)
      return b.id - a.id;
    } else if (sortBy === "popular") {
      // Sort by popularity (using members count as a proxy)
      return (b.members?.length || 0) - (a.members?.length || 0);
    } else if (sortBy === "comments") {
      // For now, just return recent as we don't have comment counts
      return b.id - a.id;
    }
    return 0;
  });

  const projects = sortedProjects;

  const form = useForm({
    resolver: zodResolver(
      insertProjectSchema.extend({
        tools: z.array(z.string()),
        rolesSought: z.array(z.string()),
        setting: z.enum(["remote", "in-person"]),
        location: z.string(),
        deadline: z.date(),
        membersNeeded: z.number().min(1),
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
      membersNeeded: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure deadline is a string before sending to API
      const formattedData = {
        ...data,
        deadline: data.deadline instanceof Date 
          ? data.deadline.toISOString().split('T')[0] // Format as YYYY-MM-DD
          : typeof data.deadline === 'string' 
            ? data.deadline 
            : new Date().toISOString().split('T')[0],
      };
      const res = await apiRequest("POST", "/api/projects", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Project created",
        description: "Your project has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
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
                  <form
                    onSubmit={form.handleSubmit((data) => {
                      // Ensure all arrays are properly formatted
                      const formattedData = {
                        ...data,
                        skills: Array.isArray(data.skills) ? data.skills : [],
                        tools: Array.isArray(data.tools) ? data.tools : [],
                        rolesSought: Array.isArray(data.rolesSought) ? data.rolesSought : []
                      };
                      createMutation.mutate(formattedData);
                    })}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Details</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skills Required</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Python, JavaScript"
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
                          name="tools"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tools</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Photoshop, Canva"
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
                          name="rolesSought"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Roles Sought</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Designer, Developer"
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

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="setting"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Setting</FormLabel>
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
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Wayne, PA" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="membersNeeded"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Members Needed</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
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
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormLabel>Project Image</FormLabel>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-card/80"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SVG, PNG, JPG or GIF (MAX. 800x400px)
                              </p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9"
                  />
                </div>
              </div>
              
              <div className="flex-1 flex items-center gap-2">
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {filterSkills.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {filterSkills.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filter by Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {['python', 'react', 'javascript', 'ui/ux', 'nodejs', 'mobile'].map(skill => (
                          <Badge 
                            key={skill}
                            variant={filterSkills.includes(skill) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (filterSkills.includes(skill)) {
                                setFilterSkills(filterSkills.filter(s => s !== skill));
                              } else {
                                setFilterSkills([...filterSkills, skill]);
                              }
                            }}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="comments">Most Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : projects && projects.length > 0 ? (
            viewMode === "grid" ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {projects.map((project) => (
                  <motion.div key={project.id} variants={item}>
                    <Card 
                      className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden border-[#F57C00]/10 hover:border-[#F57C00]/30"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="h-1 bg-gradient-to-r from-[#F57C00] to-indigo-500"></div>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-bold hover:text-primary">
                              {project.title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Posted by {project.ownerId === user?.id 
                                ? "you" 
                                : (allUsers?.find(u => u.id === project.ownerId)?.username || "unknown user")}
                            </CardDescription>
                          </div>
                          {project.ownerId !== user?.id && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs bg-[#F57C00]/10 hover:bg-[#F57C00]/20 border-[#F57C00]/20"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click when button is clicked
                                navigate(`/projects/${project.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-[#F57C00]/10 hover:bg-[#F57C00]/20">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills && project.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{project.skills.length - 3} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{project.membersNeeded}</span> members needed
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-4"
              >
                {projects.map((project) => (
                  <motion.div key={project.id} variants={item}>
                    <Card 
                      className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden border-[#F57C00]/10 hover:border-[#F57C00]/30"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="h-1 bg-gradient-to-r from-[#F57C00] to-indigo-500"></div>
                      <div className="flex flex-col md:flex-row items-start gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold">{project.title}</h3>
                            <Badge variant="outline" className="ml-2">
                              {project.setting === "remote" ? "Remote" : "In-Person"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Posted by {project.ownerId === user?.id 
                              ? "you" 
                              : (allUsers?.find(u => u.id === project.ownerId)?.username || "unknown user")}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {project.skills?.slice(0, 5).map((skill) => (
                              <Badge key={skill} variant="secondary" className="bg-[#F57C00]/10 hover:bg-[#F57C00]/20">
                                {skill}
                              </Badge>
                            ))}
                            {project.skills && project.skills.length > 5 && (
                              <Badge variant="outline" className="text-xs">+{project.skills.length - 5} more</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span><span className="font-medium">{project.membersNeeded}</span> members needed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}</span>
                          </div>
                          <Button 
                            className="mt-2"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="bg-muted/50 inline-flex rounded-full p-4 mb-4">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
              <Button variant="outline" onClick={() => {
                setSearch("");
                setFilterSkills([]);
              }}>
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}