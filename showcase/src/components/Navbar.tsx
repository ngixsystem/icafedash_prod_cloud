import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DynamicBackground from "@/components/DynamicBackground";
import logo from "@/assets/logo.png";
import { LogIn, UserPlus } from "lucide-react";

const Navbar = () => {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-background/50 border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <img src={logo} alt="Logo" className="h-8 transition-transform group-hover:scale-105" />
                </Link>

                <div className="flex items-center gap-4">
                    <a
                        href="http://213.230.110.108:8081/login"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Вход</span>
                    </a>
                    <Link
                        to="/register"
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsl(170_80%_50%_/_0.3)] hover:shadow-[0_0_25px_hsl(170_80%_50%_/_0.5)] transition-all uppercase tracking-wider glow-box"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Регистрация</span>
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
