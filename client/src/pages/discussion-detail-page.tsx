import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reply, Discussion, insertReplySchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ThumbsUp, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DiscussionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const discussionId = parseInt(params.id);

  const { data: discussion, isLoading: isLoadingDiscussion } = useQuery<Discussion>({
    queryKey: [`/api/discussions/${discussionId}`],
  });

  const { data: replies, isLoading: isLoadingReplies } = useQuery<Reply[]>({
    queryKey: [`/api/discussions/${discussionId}/replies`],
    enabled: !!discussionId,
  });

  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  
  const form = useForm({
    resolver: zodResolver(insertReplySchema),
    defaultValues: {
      content: "",
      parentReplyId: null,
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertReplySchema>) => {
      const res = await apiRequest("POST", `/api/discussions/${discussionId}/replies`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/${discussionId}/replies`] });
      form.reset();
      toast({
        title: "Reply added",
        description: "Your reply has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reply failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const upvoteDiscussionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/discussions/${discussionId}/upvote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/${discussionId}`] });
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

  const upvoteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      const res = await apiRequest("POST", `/api/replies/${replyId}/upvote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/${discussionId}/replies`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upvote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingDiscussion || isLoadingReplies;

  function getInitials(authorId: number): string {
    return `U${authorId}`;
  }

  function hasUserUpvoted(upvotedBy: number[] | null | undefined): boolean {
    if (!user || !upvotedBy) return false;
    return upvotedBy.includes(user.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <Link href="/forum" className="flex items-center mb-6 text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
        </Link>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {discussion && (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{discussion.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(discussion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{discussion.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {discussion.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant={hasUserUpvoted(discussion.upvotedBy) ? "default" : "outline"} 
                    size="sm"
                    onClick={() => upvoteDiscussionMutation.mutate()}
                    disabled={upvoteDiscussionMutation.isPending}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {discussion.upvotes} Upvotes
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Posted by {discussion.authorId === user?.id ? "you" : `user ${discussion.authorId}`}
                  </span>
                </CardFooter>
              </Card>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Replies</h2>
              
              {user && (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit((data) => replyMutation.mutate(data))}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Add your reply..."
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between items-center">
                          {replyingTo && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span>Replying to {replyingTo.authorId === user?.id ? "your comment" : `User ${replyingTo.authorId}`}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setReplyingTo(null);
                                  form.setValue("parentReplyId", null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <Button
                            type="submit"
                            disabled={replyMutation.isPending}
                            className={replyingTo ? "w-auto" : "w-full"}
                          >
                            {replyMutation.isPending ? "Posting..." : "Post Reply"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {replies && replies.length > 0 ? (
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <Card key={reply.id}>
                      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>{getInitials(reply.authorId)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {reply.authorId === user?.id ? "You" : `User ${reply.authorId}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{reply.content}</p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant={hasUserUpvoted(reply.upvotedBy) ? "default" : "outline"}
                          size="sm"
                          onClick={() => upvoteReplyMutation.mutate(reply.id)}
                          disabled={upvoteReplyMutation.isPending}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          {reply.upvotes} Upvotes
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No replies yet. Be the first to contribute to this discussion!
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}