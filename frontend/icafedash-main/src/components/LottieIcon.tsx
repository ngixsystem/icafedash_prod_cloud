import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

interface LottieIconProps {
  animationData: unknown;
  className?: string;
  animationClassName?: string;
  loop?: boolean;
  autoplay?: boolean;
  ariaLabel?: string;
}

const LottieIcon = ({ animationData, className, animationClassName, loop = true, autoplay = true, ariaLabel }: LottieIconProps) => (
  <span
    className={cn("inline-flex shrink-0 items-center justify-center overflow-visible bg-transparent", className)}
    aria-label={ariaLabel}
    aria-hidden={ariaLabel ? undefined : true}
  >
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={cn("h-full w-full bg-transparent [&_svg]:!overflow-visible", animationClassName)}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet", progressiveLoad: true }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    />
  </span>
);

export default LottieIcon;
