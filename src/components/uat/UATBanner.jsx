export default function UATBanner() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: 'repeating-linear-gradient(45deg, #fbbf24 0px, #fbbf24 10px, #000 10px, #000 20px)',
      height: 6,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
        background: '#fbbf24', color: '#000', fontSize: 10, fontWeight: 800,
        letterSpacing: '0.12em', padding: '2px 14px', borderRadius: '0 0 6px 6px',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        UAT · MODO PRUEBA · STRIPE TEST
      </div>
    </div>
  );
}
