import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WizardProgressHeaderProps {
  step: number;
  steps: readonly string[];
  onBack: () => void;
}

export function WizardProgressHeader({
  step,
  steps,
  onBack,
}: WizardProgressHeaderProps) {
  return (
    <motion.div
      key="training-plan-header"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Training Plan</h2>
          <p className="text-muted-foreground text-sm">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {steps.map((item, index) => (
          <div
            key={item}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              index <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}
