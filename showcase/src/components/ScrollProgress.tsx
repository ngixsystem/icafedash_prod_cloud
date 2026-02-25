import { motion, useScroll, useSpring } from "framer-motion";

const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-cyan-400 to-blue-500 origin-left z-[100] shadow-[0_0_15px_hsl(170_80%_50%_/_0.8)]"
                style={{ scaleX }}
            />
            <div className="fixed top-0 left-0 right-0 h-[1px] bg-white/10 z-[99]" />
        </>
    );
};

export default ScrollProgress;
