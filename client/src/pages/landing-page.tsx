import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Handshake, LightbulbIcon } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="font-bold text-xl">
              VIT-AP SkillConnect
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth?mode=login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        className="py-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            Connect, Collaborate and
            <br />
            Learn Together
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join VIT-AP SkillConnect to find peers, share knowledge, and grow together in your learning journey.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth?mode=register">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Get Started
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Explore Skills
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="p-6 rounded-lg bg-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Users className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Find Peers</h3>
              <p className="text-muted-foreground">
                Connect with students who share your interests and skills.
              </p>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg bg-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Handshake className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Collaborate</h3>
              <p className="text-muted-foreground">
                Work together on projects and learn from each other.
              </p>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg bg-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LightbulbIcon className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Get Help</h3>
              <p className="text-muted-foreground">
                Ask questions and get help from AI or peers.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
