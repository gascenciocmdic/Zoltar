import React from 'react';
import './Card.css';

const Card = ({ card, isSelected, onSelect, isFaceUp, style, className, logoSrc }) => {
  return (
    <div
      className={`card-wrapper ${isSelected ? 'selected' : ''} ${isFaceUp ? 'face-up' : 'face-down'} ${className || ''}`}
      onClick={() => !isFaceUp && onSelect && onSelect(card)}
      style={style}
    >
      <div className="card-inner">
        <div className="card-front">
          {card.image ? (
            <img src={card.image} alt={card.name} className="card-image" />
          ) : (
            <div className="card-image-placeholder">
              <span>{card.name}</span>
            </div>
          )}
        </div>
        <div className="card-back">
          {logoSrc ? (
            <img src={logoSrc} alt="Zoltar" className="card-loading-logo" />
          ) : (
            <div className="card-pattern"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
