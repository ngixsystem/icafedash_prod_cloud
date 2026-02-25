import { Link } from "react-router-dom";

const getDashboardUrl = (path: string) => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://${host}:8080${path}`;
  }
  const cleanHost = host.replace(/^www\./, '');
  return `https://cp.${cleanHost}${path}`;
};

const Footer = () => {
  return (
    <footer className="relative bg-[hsl(220,25%,3%)] z-50">
      {/* Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />

      <div className="container px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <p className="text-sm text-muted-foreground">
          © 2026 ICAFEDASH. DEV: @R13AEV · MIT License
        </p>
        <div className="flex gap-6">
          <Link
            to="/register"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Регистрация
          </Link>
          <a
            href={getDashboardUrl("/login")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Войти
          </a>
        </div>
      </div>

      {/* Overscroll Blocker: extends the solid background infinitely downwards */}
      <div className="absolute top-full left-0 right-0 h-[100vh] bg-[hsl(220,25%,3%)] pointer-events-none" />
    </footer>
  );
};

export default Footer;
