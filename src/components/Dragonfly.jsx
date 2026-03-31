import React, { useState, useEffect, useRef } from 'react';

const Dragonfly = ({ visible }) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [trail, setTrail] = useState([]);
  const animRef = useRef(null);
  const targetRef = useRef({ x: 50, y: 50 });
  const posRef = useRef({ x: 50, y: 50 });
  const trailIdRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    // Pick new random target every 1.5s
    const targetInterval = setInterval(() => {
      targetRef.current = {
        x: 15 + Math.random() * 70, // Stay within card area
        y: 10 + Math.random() * 80
      };
    }, 1500);

    // Smooth movement + trail
    const moveInterval = setInterval(() => {
      const dx = (targetRef.current.x - posRef.current.x) * 0.06;
      const dy = (targetRef.current.y - posRef.current.y) * 0.06;
      // Add slight sine wave flutter
      const flutter = Math.sin(Date.now() * 0.008) * 1.5;
      
      posRef.current = {
        x: posRef.current.x + dx + flutter * 0.3,
        y: posRef.current.y + dy + Math.cos(Date.now() * 0.006) * 0.8
      };
      setPos({ ...posRef.current });

      // Add trail point
      trailIdRef.current++;
      setTrail(prev => {
        const updated = [...prev, { 
          id: trailIdRef.current, 
          x: posRef.current.x, 
          y: posRef.current.y, 
          born: Date.now() 
        }];
        // Keep only last 25 trail points
        return updated.slice(-25);
      });
    }, 40);

    // Clean old trail points
    const cleanInterval = setInterval(() => {
      const now = Date.now();
      setTrail(prev => prev.filter(p => now - p.born < 1200));
    }, 200);

    return () => {
      clearInterval(targetInterval);
      clearInterval(moveInterval);
      clearInterval(cleanInterval);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 50, overflow: 'hidden'
    }}>
      {/* Trail */}
      {trail.map(point => {
        const age = (Date.now() - point.born) / 1200; // 0 to 1
        const opacity = Math.max(0, 1 - age);
        const size = Math.max(1, 4 * (1 - age));
        return (
          <div key={point.id} style={{
            position: 'absolute',
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: `rgba(255, 255, 255, ${opacity * 0.7})`,
            boxShadow: `0 0 ${6 * opacity}px rgba(255, 255, 255, ${opacity * 0.5}), 0 0 ${12 * opacity}px rgba(192, 132, 252, ${opacity * 0.3})`,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.3s ease'
          }} />
        );
      })}
      
      {/* Dragonfly body */}
      <div style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: '12px',
        height: '12px',
        transition: 'left 0.04s linear, top 0.04s linear'
      }}>
        {/* Core glow */}
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'white',
          top: '3px',
          left: '3px',
          boxShadow: '0 0 8px 3px rgba(255,255,255,0.9), 0 0 20px 6px rgba(192,132,252,0.5), 0 0 35px 10px rgba(255,215,0,0.2)',
          animation: 'dragonflyPulse 0.8s ease-in-out infinite alternate'
        }} />
        {/* Wings */}
        <div style={{
          position: 'absolute',
          width: '16px',
          height: '4px',
          top: '2px',
          left: '-5px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '50%',
          animation: 'wingFlutter 0.15s ease-in-out infinite alternate',
          boxShadow: '0 0 6px rgba(255,255,255,0.4)'
        }} />
        <div style={{
          position: 'absolute',
          width: '16px',
          height: '4px',
          top: '6px',
          left: '-5px',
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '50%',
          animation: 'wingFlutter 0.15s ease-in-out infinite alternate-reverse',
          boxShadow: '0 0 6px rgba(255,255,255,0.3)'
        }} />
      </div>
    </div>
  );
};

export default Dragonfly;
