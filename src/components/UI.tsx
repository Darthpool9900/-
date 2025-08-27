
export default function UI() {
  return (
    <div style={{
      position: 'fixed',
      top: 12, left: 12,
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.45)',
      color: 'white',
      borderRadius: 12,
      fontFamily: 'system-ui, sans-serif',
      userSelect: 'none'
    }}>
      <div><b>Controles</b></div>
      <div>WASD para mover, Espaço p/ pular, Shift p/ correr</div>
      <div>Clique para capturar o mouse (olhar em 1ª pessoa)</div>
    </div>
  );
}
