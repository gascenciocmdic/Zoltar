import React, { useEffect, useRef } from 'react';

const ConstellationCanvas = ({ seed }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth || 300;
      canvas.height = parent.clientHeight || 300;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate stars based on seed
    // Pseudo-random generator based on string
    const stringToSeed = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      }
      return h;
    };
    
    let currentSeed = stringToSeed(seed || "Cosmos");
    const r = () => {
      currentSeed = (currentSeed * 16807) % 2147483647;
      return (currentSeed - 1) / 2147483646;
    };

    const numStars = 20 + Math.floor(r() * 10);
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: r() * canvas.width,
        y: r() * canvas.height,
        vx: (r() - 0.5) * 0.3,
        vy: (r() - 0.5) * 0.3,
        size: 1 + r() * 2,
        pulseOffset: r() * Math.PI * 2, // For twinkling
        connections: []
      });
    }

    // Connect some stars to form a constellation (main lines)
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
         const dx = stars[i].x - stars[j].x;
         const dy = stars[i].y - stars[j].y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < 80) { // Connect nearby stars
           stars[i].connections.push(j);
         }
      }
    }

    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update positions
      stars.forEach(star => {
        star.x += star.vx;
        star.y += star.vy;
        
        // Bounce off edges gently
        if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if (star.y < 0 || star.y > canvas.height) star.vy *= -1;
      });

      // Draw connections
      ctx.lineWidth = 0.5;
      stars.forEach((star, i) => {
        star.connections.forEach(j => {
          const target = stars[j];
          const brightness = 0.15 + (Math.sin(time + star.pulseOffset) * 0.05); // Subtle pulse
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(255, 215, 0, ${brightness})`;
          ctx.stroke();
        });
      });

      // Draw stars
      stars.forEach(star => {
        const twinkle = 0.5 + (Math.sin(time * 2 + star.pulseOffset) * 0.5);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.shadowBlur = 10 * twinkle;
        ctx.shadowColor = "rgba(192, 132, 252, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [seed]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        width: '100%', 
        height: '100%', 
        display: 'block',
        background: 'transparent'
      }} 
    />
  );
};

export default ConstellationCanvas;
