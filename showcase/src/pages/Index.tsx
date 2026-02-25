import DynamicBackground from "@/components/DynamicBackground";
import Hero from "@/components/Hero";
import Showcase from "@/components/Showcase";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { motion, useScroll, useTransform } from "framer-motion";

const Index = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 2000], [0, 400]);
  const y2 = useTransform(scrollY, [0, 2000], [0, -300]);
  const y3 = useTransform(scrollY, [0, 2000], [0, 600]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DynamicBackground />
      <Navbar />

      {/* Decorative Parallax Orbs */}
      <motion.div style={{ y: y1 }} className="absolute top-[20%] left-[-10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div style={{ y: y2 }} className="absolute top-[50%] right-[-10%] w-[35rem] h-[35rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <motion.div style={{ y: y3 }} className="absolute bottom-[-10%] left-[20%] w-[50rem] h-[50rem] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10">
        <Hero />
        <Showcase />
        <Features />
        <Pricing />
        <CTA />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
