import { useEffect, useRef, useCallback } from 'react';
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
  const isInitializedRef = useRef(false);
  const { theme } = useTheme();

  // Configuration constants
  const fontSize = 20;
  const digitSpacing = 35;
  const columnWidth = 25;

  // Initialize columns - separate from theme-dependent effects
  const initializeColumns = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const numColumns = Math.floor(canvas.width / columnWidth);
    columnsRef.current = [];

    for (let i = 0; i < numColumns; i++) {
      columnsRef.current.push({
        x: i * columnWidth,
        digits: [],
        speed: Math.random() * 0.8 + 0.4,
        nextDigitTimer: Math.random() * 100,
      });
    }
  }, [columnWidth]);

  // Animation loop - theme-aware but doesn't reset on theme change
  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas completely each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font properties
    ctx.font = `bold ${fontSize}px monospace`;
    
    // Theme-specific color and glow settings
    if (theme === 'dark') {
      // Dark Mode: Pure Green #00FF00 (unchanged)
      ctx.fillStyle = '#00FF00';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00FF00';
    } else {
      // Light Mode: Darker Green #006600 for better contrast
      ctx.fillStyle = '#006600';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#006600';
    }

    // Process each column
    columnsRef.current.forEach((column) => {
      // Add new digit at top of column
      column.nextDigitTimer--;
      if (column.nextDigitTimer <= 0) {
        column.digits.push({
          x: column.x,
          y: -fontSize,
          char: Math.random() > 0.5 ? '1' : '0',
          opacity: Math.random() * 0.3 + 0.7,
        });
        column.nextDigitTimer = digitSpacing / column.speed;
      }

      // Update and draw existing digits
      column.digits = column.digits.filter((digit) => {
        // Update position
        digit.y += column.speed;

        // Set opacity based on theme
        const finalOpacity = theme === 'dark' 
          ? digit.opacity * 0.08 // Dark mode: unchanged (0.05-0.08 range)
          : digit.opacity * 0.15; // Light mode: slightly higher for better visibility

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

    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  }, [theme, fontSize, digitSpacing]);

  // Canvas setup and resize handler
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Only initialize columns if not already done or on resize
    if (!isInitializedRef.current) {
      initializeColumns();
      isInitializedRef.current = true;
    } else {
      // On resize, reinitialize columns
      initializeColumns();
    }
  }, [initializeColumns]);

  // Initial setup effect - runs once
  useEffect(() => {
    setupCanvas();
    
    // Start animation
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }

    // Handle window resize
    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []); // No dependencies - runs once

  // Theme change effect - only updates rendering, doesn't reset animation
  useEffect(() => {
    // Animation continues with new theme settings
    // No need to restart or clear anything
  }, [theme]);

  // Animation update effect - restarts animation loop when animate function changes
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: -10,
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}