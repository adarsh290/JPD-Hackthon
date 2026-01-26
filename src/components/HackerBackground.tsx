import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface BinaryDigit {
  x: number;
  y: number;
  char: string;
  opacity: number;
}

interface Column {
  x: number;
  digits: BinaryDigit[];
  speed: number;
  nextDigitTimer: number;
}

export function HackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const columnsRef = useRef<Column[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const fontSize = 20;
    const digitSpacing = 35; // Vertical gap between digits
    const columnWidth = 25; // Horizontal spacing between columns

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeColumns();
    };

    // Initialize columns
    const initializeColumns = () => {
      const numColumns = Math.floor(canvas.width / columnWidth);
      columnsRef.current = [];

      for (let i = 0; i < numColumns; i++) {
        columnsRef.current.push({
          x: i * columnWidth,
          digits: [],
          speed: Math.random() * 0.8 + 0.4, // Slower speed between 0.4-1.2
          nextDigitTimer: Math.random() * 100, // Random start delay
        });
      }
    };

    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    // Animation loop with FPS control
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        // Clear canvas completely each frame (no trailing effect)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set font and glow properties
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillStyle = '#00FF00'; // Pure green
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00FF00';

        // Process each column
        columnsRef.current.forEach((column) => {
          // Add new digit at top of column
          column.nextDigitTimer--;
          if (column.nextDigitTimer <= 0) {
            column.digits.push({
              x: column.x,
              y: -fontSize,
              char: Math.random() > 0.5 ? '1' : '0',
              opacity: Math.random() * 0.3 + 0.7, // Random opacity between 0.7-1
            });
            column.nextDigitTimer = digitSpacing / column.speed; // Time until next digit
          }

          // Update and draw existing digits
          column.digits = column.digits.filter((digit) => {
            // Update position
            digit.y += column.speed;

            // Set opacity based on theme
            const finalOpacity = theme === 'dark' 
              ? digit.opacity * 0.08 // Dark mode: 0.05-0.08 range
              : digit.opacity * 0.1;  // Light mode: 0.1 range

            ctx.globalAlpha = finalOpacity;

            // Draw digit
            ctx.fillText(digit.char, digit.x, digit.y);

            // Keep digit if still on screen
            return digit.y < canvas.height + fontSize;
          });
        });

        // Reset shadow and alpha
        ctx.shadowBlur = 0;
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
        zIndex: -10, // Updated to -10 as requested
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}