import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GoalsSlide } from "./goals-slide";
import { HighlightsSlide } from "./highlights-slide";
import { IntroSlide } from "./intro-slide";

export type WeeklyWrappedData = {
  totals: {
    distanceM: number;
    runCount: number;
    elapsedS: number;
    avgPaceSecPerKm: number | null;
  } | null;
  shouldShow: boolean;
  period: {
    reviewWeekStart: string;
    reviewWeekEnd: string;
  } | null;
  comparisonVsPriorWeek: {
    distanceMDelta: number;
    runCountDelta: number;
    paceSecPerKmDelta: number | null;
  } | null;
  goals: {
    goalId: number;
    goalType: "distance" | "frequency" | "pace";
    targetValue: number;
    currentValue: number;
    completed: boolean;
    completionRatio: number;
  }[];
  highlights: {
    bestDistanceDayM?: number | undefined;
    longestRunM?: number | undefined;
    fastestRunPaceSecPerKm?: number | undefined;
  } | null;
};

interface WeeklyWrappedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: WeeklyWrappedData;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.96,
  }),
};

export function WeeklyWrapped({
  open,
  onOpenChange,
  data,
}: WeeklyWrappedProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides = useMemo(() => {
    const s: React.ReactNode[] = [];
    s.push(<IntroSlide data={data} />);
    if (data.goals.length > 0) {
      s.push(<GoalsSlide data={data} />);
    }
    if (
      data.highlights &&
      (data.highlights.longestRunM ||
        data.highlights.fastestRunPaceSecPerKm ||
        data.highlights.bestDistanceDayM)
    ) {
      s.push(<HighlightsSlide data={data} />);
    }
    return s;
  }, [data]);

  const totalSlides = slides.length;
  const isLast = step === totalSlides - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onOpenChange(false);
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  }, [isLast, onOpenChange]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card overflow-hidden border-zinc-800 p-0 sm:max-w-md [&>button]:hidden">
        <DialogTitle className="sr-only">Weekly Review</DialogTitle>

        {/* Top bar */}
        <div className="flex w-full flex-col items-end gap-2 px-3 pt-3">
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1 transition-colors"
          >
            <X className="size-4" />
          </button>
          <div className="flex w-full items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                className="bg-muted relative h-1 flex-1 overflow-hidden rounded-full"
              >
                <motion.div
                  className="bg-primary absolute inset-y-0 left-0 rounded-full"
                  initial={false}
                  animate={{
                    width: i < step ? "100%" : i === step ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Slide content */}
        <div className="relative min-h-[360px] px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {slides[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-6 pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button size="sm" className="group" onClick={handleNext}>
            {isLast ? "Done" : "Next"}
            {!isLast && (
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
