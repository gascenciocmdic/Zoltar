import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, speed = 40, showCursor = true }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Restart typing loop when text parameter changes
  useEffect(() => {
    if (!text) return;
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    
    // Typing ticker
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  if (!text) return null;

  return (
    <span>
      {displayedText.split('\n').map((line, idx, arr) => (
        <React.Fragment key={idx}>
          {line}
          {idx !== arr.length - 1 && <br />}
        </React.Fragment>
      ))}
      {showCursor && (
        <span className={isTyping ? 'typing-cursor' : 'blinking-cursor'}>|</span>
      )}
    </span>
  );
};

export default TypewriterText;
