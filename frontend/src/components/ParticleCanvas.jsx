import { useRef, useEffect, useState } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();

    const particles = Array.from({ length: 60 }, () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      return {
        x, y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      };
    });

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      particles.forEach((p, i) => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = Math.min(60 / (dist + 1), 1.2);

        if (dist < 100) {
          p.x -= (dx / dist) * force * 0.3;
          p.y -= (dy / dist) * force * 0.3;
        } else {
          p.x += (p.baseX - p.x) * 0.02;
          p.y += (p.baseY - p.y) * 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) { p.vx *= -1; p.baseX = p.x; }
        if (p.y < 0 || p.y > canvas.height) { p.vy *= -1; p.baseY = p.y; }

        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx2 = particles[j].x - p.x, dy2 = particles[j].y - p.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = (1 - dist2 / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', () => {
      resize();
      particles.forEach(p => {
        p.baseX = Math.random() * canvas.width;
        p.baseY = Math.random() * canvas.height;
        p.x = p.baseX;
        p.y = p.baseY;
      });
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
