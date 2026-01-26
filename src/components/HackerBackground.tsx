import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Drop {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  char: string;
}

export function HackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dropsRef = useRef<Drop[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeDrops();
    };

    // Initialize drops for each column
    const initializeDrops = () => {
      const fontSize = 18;
      const columns = Math.floor(canvas.width / fontSize);
      dropsRef.current = [];

      for (let i = 0; i < columns; i++) {
        dropsRef.current.push({
          x: i * fontSize,
          y: Math.random() * -canvas.height, // Start above screen
          speed: Math.random() * 1.5 + 0.5, // Moderate speed between 0.5-2
          opacity: Math.random() * 0.4 + 0.6, // Random opacity between 0.6-1
          char: Math.random() > 0.5 ? '1' : '0', // Pre-generate character
        });
      }
    };

    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    // Animation loop with FPS control
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        // Clear canvas with theme-appropriate background for trailing effect
        if (theme === 'dark') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Dark trailing effect
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Light trailing effect
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#00FF00'; // Pure green

        // Draw and update each drop
        dropsRef.current.forEach((drop) => {
          // Set opacity based on theme
          const baseOpacity = theme === 'dark' ? drop.opacity : drop.opacity * 0.1;
          ctx.globalAlpha = baseOpacity;

          // Draw character
          ctx.fillText(drop.char, drop.x, drop.y);

          // Update position
          drop.y += drop.speed;

          // Occasionally change character for variety
          if (Math.random() < 0.02) {
            drop.char = Math.random() > 0.5 ? '1' : '0';
          }

          // Reset drop when it goes off screen
          if (drop.y > canvas.height + 30) {
            drop.y = Math.random() * -200 - 30; // Reset above screen
            drop.speed = Math.random() * 1.5 + 0.5; // New random speed
            drop.opacity = Math.random() * 0.4 + 0.6; // New random opacity
            drop.char = Math.random() > 0.5 ? '1' : '0'; // New character
          }
        });

        // Reset global alpha
        ctx.globalAlpha = 1;
        lastTime = currentTime;
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize and start animation
    resizeCanvas();
    animationRef.current = requestAnimationFrame(animate);

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]); // Re-run when theme changes

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: -1,
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}