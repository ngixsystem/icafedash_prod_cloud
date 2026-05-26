import LottieIcon from "@/components/LottieIcon";
import loadingAnimation from "@/assets/loading.json";
import fragLogo from "@/assets/frag.png";

const DashboardPreloader = () => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#050505] text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,149,0,0.22),transparent_34%),linear-gradient(135deg,rgba(255,106,0,0.10),transparent_32%),#050505]" />
    <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:44px_44px]" />

    <div className="relative flex w-full max-w-[320px] flex-col items-center px-6 text-center">
      <img src={fragLogo} alt="FRAG.GG" className="h-24 w-24 object-contain drop-shadow-[0_0_34px_rgba(255,149,0,0.32)]" />
      <h1 className="mt-5 font-display text-4xl leading-none tracking-wide text-white">FRAG.GG</h1>
      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.34em] text-[#ff9500]">Dashboard</p>
      <LottieIcon animationData={loadingAnimation} className="mt-5 h-24 w-24" />
      <div className="mt-2 h-1 w-36 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#ff6a00] to-[#ffb347] shadow-[0_0_18px_rgba(255,149,0,0.5)]" />
      </div>
    </div>
  </div>
);

export default DashboardPreloader;
