import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Discussion, insertDiscussionSchema } from "@shared/schema";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ThumbsUp, MessageSquare } from "lucide-react";

const CATEGORIES = [
  "Coding",
  "Design",
  "AI/ML",
  "Web Development",
  "Mobile Development",
  "DevOps",
  "General",
];

export default function ForumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data: discussions, isLoading } = useQuery<Discussion[]>({
    queryKey: ["/api/discussions"],
  });

  const form = useForm({
    resolver: zodResolver(insertDiscussionSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertDiscussionSchema>) => {
      const res = await apiRequest("POST", "/api/discussions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Discussion created",
        description: "Your discussion has been posted successfully.",
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

  const upvoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/discussions/${id}/upvote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
      toast({
        title: "Upvoted!",
        description: "Your vote has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upvote",
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
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  function hasUserUpvoted(upvotedBy: number[] | null | undefined): boolean {
    if (!user || !upvotedBy) return false;
    return upvotedBy.includes(user.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Community Forum</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a Discussion</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Discussion"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {discussions?.map((discussion) => (
              <motion.div key={discussion.id} variants={item}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <div onClick={() => navigate(`/discussions/${discussion.id}`)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{discussion.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(discussion.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle>{discussion.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {discussion.content}
                      </p>
                    </CardContent>
                  </div>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant={hasUserUpvoted(discussion.upvotedBy) ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          upvoteMutation.mutate(discussion.id);
                        }}
                        disabled={upvoteMutation.isPending}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {discussion.upvotes} Upvotes
                      </Button>
                      <Link href={`/discussions/${discussion.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reply
                        </Button>
                      </Link>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Posted by {discussion.authorId === user?.id ? "you" : `user ${discussion.authorId}`}
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
