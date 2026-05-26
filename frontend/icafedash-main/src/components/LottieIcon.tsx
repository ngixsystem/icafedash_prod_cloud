import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

interface LottieIconProps {
  animationData: unknown;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  ariaLabel?: string;
}

const LottieIcon = ({ animationData, className, loop = true, autoplay = true, ariaLabel }: LottieIconProps) => (
  <span
    className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden", className)}
    aria-label={ariaLabel}
    aria-hidden={ariaLabel ? undefined : true}
  >
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      style={{ width: "100%", height: "100%" }}
    />
  </span>
);

export default LottieIcon;
