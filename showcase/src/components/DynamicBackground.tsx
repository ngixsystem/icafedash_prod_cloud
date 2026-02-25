import { useEffect, useRef } from "react";

const DynamicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) * 0.05;
      targetY = (e.clientY - window.innerHeight / 2) * 0.05;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles for depth
    const particles: { x: number; y: number; z: number; size: number }[] = [];
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 2000,
        size: Math.random() * 2 + 0.5
      });
    }

    const draw = () => {
      ctx.fillStyle = "hsl(220, 25%, 3%)"; // Dark rich background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse follow
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      time += 0.002;

      const centerX = canvas.width / 2 + mouseX * 2;
      const centerY = canvas.height / 2 + mouseY * 2;

      // Draw moving perspective grid
      ctx.lineWidth = 1;
      const gridSize = 100;
      const gridCount = 30;
      const fov = 300;

      const speed = (Date.now() * 0.05) % gridSize;

      // Draw horizontal lines
      for (let i = 1; i < gridCount; i++) {
        const z = i * gridSize - speed;
        if (z < 10) continue;

        const scale = fov / z;
        const y = centerY + 200 * scale; // floor grid

        // Fade out based on distance
        const opacity = Math.max(0, 1 - z / (gridSize * 15));

        ctx.beginPath();
        ctx.strokeStyle = `hsla(170, 80%, 50%, ${opacity * 0.3})`;

        const x1 = centerX - 1000 * scale;
        const x2 = centerX + 1000 * scale;

        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        // Add neon glow to lines close to viewer
        if (z < 1000) {
          ctx.shadowColor = "hsl(170, 80%, 50%)";
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Draw vertical lines
      for (let i = -10; i <= 10; i++) {
        const xOffset = i * gridSize;

        ctx.beginPath();
        for (let j = 1; j < gridCount; j++) {
          const z = j * gridSize - speed;
          if (z < 10) continue;

          const scale = fov / z;
          const x = centerX + xOffset * scale;
          const y = centerY + 200 * scale;

          if (j === 1) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Gradient for vertical lines
        const grad = ctx.createLinearGradient(0, centerY, 0, canvas.height);
        grad.addColorStop(0, `hsla(170, 80%, 50%, 0)`);
        grad.addColorStop(1, `hsla(170, 80%, 50%, 0.3)`);

        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      // Draw floating particles in 3D space
      particles.forEach(p => {
        // Move particles forward
        p.z -= 2;
        if (p.z <= 0) {
          p.z = 2000;
          p.x = (Math.random() - 0.5) * 2000;
          p.y = (Math.random() - 0.5) * 2000;
        }

        const scale = fov / Math.max(1, p.z);
        const x = centerX + p.x * scale;
        const y = centerY + p.y * scale - 100; // shift up a bit

        const opacity = Math.max(0, 1 - p.z / 2000);

        ctx.beginPath();
        const pSize = Math.max(0.1, p.size * scale);
        ctx.arc(x, y, pSize, 0, Math.PI * 2);

        // Alternating colors for particles
        const hue = p.x % 2 === 0 ? 170 : 200;
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;

        ctx.fill();

        // Add glow to big particles
        if (pSize > 2) {
          ctx.beginPath();
          ctx.arc(x, y, pSize * 4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity * 0.2})`;
          ctx.fill();
        }
      });

      // Add colorful ambient gradients
      const bgGrad1 = ctx.createRadialGradient(canvas.width * 0.2 + mouseX, canvas.height * 0.3 + mouseY, 0, canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.6);
      bgGrad1.addColorStop(0, "hsla(200, 80%, 40%, 0.08)");
      bgGrad1.addColorStop(1, "transparent");
      ctx.fillStyle = bgGrad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bgGrad2 = ctx.createRadialGradient(canvas.width * 0.8 - mouseX, canvas.height * 0.8 - mouseY, 0, canvas.width * 0.8, canvas.height * 0.8, canvas.width * 0.6);
      bgGrad2.addColorStop(0, "hsla(170, 80%, 50%, 0.06)");
      bgGrad2.addColorStop(1, "transparent");
      ctx.fillStyle = bgGrad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default DynamicBackground;
