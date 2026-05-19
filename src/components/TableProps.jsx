import React from 'react';
import './TableProps.css';
import velasImg   from '../assets/velas.png';
import cuarzoImg  from '../assets/cuarzo.png';
import talismanImg from '../assets/talisman.png';

/**
 * TableProps — elementos de decoración de la mesa usando PNGs reales.
 * Velas (sup-izq), Cuarzo (sup-der), Talismán (sup-centro).
 * Las sombras simulan la luz de la vela proveniente del lado izquierdo.
 */
export default function TableProps() {
  return (
    <div className="table-props" aria-hidden="true">
      <img src={velasImg}    className="tp-item tp-velas"    alt="" draggable="false" />
      <img src={cuarzoImg}   className="tp-item tp-cuarzo"   alt="" draggable="false" />
      <img src={talismanImg} className="tp-item tp-talisman" alt="" draggable="false" />
    </div>
  );
}
