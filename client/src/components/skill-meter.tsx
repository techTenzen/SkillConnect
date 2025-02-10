import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface SkillMeterProps {
  skill: string;
  level: number;
  color?: string;
}

export function SkillMeter({ skill, level, color = "bg-primary" }: SkillMeterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="text-sm font-medium">
          {skill}
        </Badge>
        <span className="text-sm text-muted-foreground">{level}%</span>
      </div>
      <Progress
        value={level}
        className="h-2"
        indicatorClassName={color}
      />
    </motion.div>
  );
}

export function SkillList({ skills }: { skills: Record<string, number> }) {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500"
  ];

  return (
    <div className="space-y-4">
      {Object.entries(skills).map(([skill, level], index) => (
        <SkillMeter
          key={skill}
          skill={skill}
          level={level}
          color={colors[index % colors.length]}
        />
      ))}
    </div>
  );
}
