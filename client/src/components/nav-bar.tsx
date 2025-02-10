import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, BookOpen, Users, MessageSquare, LogOut } from "lucide-react";


export function NavBar() {
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/projects", label: "Projects", icon: Users },
    { path: "/forum", label: "Forum", icon: BookOpen },
    { path: "/chat", label: "AI Chat", icon: MessageSquare },
  ];

  if (!user) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/">
              <a className="font-bold text-xl">
                VIT-AP SkillConnect
              </a>
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} href={path}>
              <a
                className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.username || 'User'} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}