import { useAuth } from "@/hooks/use-auth";
import NavBar from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillList } from "@/components/skill-meter";
import { useQuery } from "@tanstack/react-query";
import { Project, Discussion } from "@shared/schema";
import { motion } from "framer-motion";
import { Loader2, Users, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: discussions, isLoading: discussionsLoading } = useQuery<Discussion[]>({
    queryKey: ["/api/discussions"],
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
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.username}!</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">Your Skills</h3>
                {user?.skills ? (
                  <SkillList skills={user.skills} />
                ) : (
                  <p className="text-muted-foreground">
                    Add skills to your profile to get started
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : projects?.slice(0, 3).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="block p-3 hover:bg-muted rounded-lg mb-2 cursor-pointer">
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Latest Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discussionsLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : discussions?.slice(0, 3).map((discussion) => (
                  <Link key={discussion.id} href={`/forum/${discussion.id}`}>
                    <div className="block p-3 hover:bg-muted rounded-lg mb-2 cursor-pointer">
                      <h4 className="font-medium">{discussion.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{discussion.category}</span>
                        <span className="mx-2">•</span>
                        <span>{discussion.upvotes} upvotes</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
