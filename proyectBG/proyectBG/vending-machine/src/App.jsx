import React, { useState, useEffect } from 'react';
import './App.css';

// Configuración de la API
const API_URL = 'http://10.92.16.17:3000'; // Ajusta según tu configuración

function App() {
  const [productos, setProductos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [seleccion, setSeleccion] = useState({});
  const [saldoUsuario, setSaldoUsuario] = useState(0);
  const [monedasInsertadas, setMonedasInsertadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar productos al iniciar
  useEffect(() => {
    cargarProductos();
    cargarMonedas();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/productos/disponibles`);
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setMensaje('Error al cargar productos');
    }
  };

  const cargarMonedas = async () => {
    try {
      const response = await fetch(`${API_URL}/monedas`);
      const data = await response.json();
      setMonedas(data);
    } catch (error) {
      console.error('Error cargando monedas:', error);
    }
  };

  // Calcular totales
  const productosSeleccionados = Object.entries(seleccion)
    .filter(([_, cantidad]) => cantidad > 0)
    .map(([id, cantidad]) => {
      const producto = productos.find(p => p.id === parseInt(id));
      return { ...producto, cantidadSeleccionada: cantidad };
    });

  const totalAPagar = productosSeleccionados.reduce(
    (acc, p) => acc + (p.precio * p.cantidadSeleccionada), 
    0
  );

  const cambio = saldoUsuario - totalAPagar;

  const modificarCantidad = (id, delta) => {
    const prod = productos.find(p => p.id === id);
    const actual = seleccion[id] || 0;
    const nueva = actual + delta;
    
    if (nueva >= 0 && nueva <= prod.cantidad) {
      setSeleccion({ ...seleccion, [id]: nueva });
    }
  };

  const insertarMoneda = (tipo) => {
    const valor = parseFloat(tipo);
    setSaldoUsuario(prev => Math.round((prev + valor) * 100) / 100);
    
    // Registrar la moneda insertada
    setMonedasInsertadas(prev => {
      const existente = prev.find(m => m.tipo === tipo);
      if (existente) {
        return prev.map(m => 
          m.tipo === tipo 
            ? { ...m, cantidad: m.cantidad + 1 } 
            : m
        );
      }
      return [...prev, { tipo, cantidad: 1 }];
    });
  };

  const procesarCompra = async () => {
  if (totalAPagar === 0) {
    setMensaje('⚠️ Selecciona al menos un producto');
    setTimeout(() => setMensaje(''), 3000);
    return;
  }

  if (saldoUsuario < totalAPagar) {
    setMensaje('⚠️ Saldo insuficiente');
    setTimeout(() => setMensaje(''), 3000);
    return;
  }

  setLoading(true);
  setMensaje('');

  try {
    // Realizar UNA SOLA compra con todo el monto
    const response = await fetch(`${API_URL}/ventas/comprar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto_id: productosSeleccionados[0].id,
        monto_pagado: saldoUsuario, // Enviar TODO el saldo
        monedas_insertadas: monedasInsertadas
      })
    });

    const resultado = await response.json();

    if (!resultado.exito) {
      throw new Error(resultado.mensaje);
    }

    // Mostrar cambio
    if (resultado.cambio > 0 && resultado.monedas_cambio) {
      const detalleCambio = resultado.monedas_cambio
        .map(m => `${m.cantidad}x $${parseFloat(m.tipo).toFixed(2)}`)
        .join('\n');
      
      alert(
        `✅ COMPRA EXITOSA\n\n` +
        `Producto: ${resultado.producto.nombre}\n` +
        `Precio: $${parseFloat(resultado.precio).toFixed(2)}\n` +
        `Pagado: $${parseFloat(resultado.monto_pagado).toFixed(2)}\n` +
        alert(
  `Cambio: $${resultado.cambio.toFixed(2)}\n\n` +
  resultado.monedas_cambio
    .map(m => `${m.cantidad}x $${Number(m.tipo).toFixed(2)}`)
    .join('\n')
)

        `MONEDAS DE CAMBIO:\n${detalleCambio}`
      );
    }

    setMensaje('✅ ¡Compra exitosa!');
    
    // Limpiar estado
    setSeleccion({});
    setSaldoUsuario(0);
    setMonedasInsertadas([]);
    
    // Recargar datos
    await cargarProductos();
    await cargarMonedas();

    setTimeout(() => setMensaje(''), 3000);
  } catch (error) {
    console.error('Error en compra:', error);
    setMensaje(`❌ Error: ${error.message}`);
    setTimeout(() => setMensaje(''), 5000);
  } finally {
    setLoading(false);
  }
};

  const mostrarCambio = (resultado) => {
    if (resultado.monedas_cambio && resultado.monedas_cambio.length > 0) {
      const detalleCambio = resultado.monedas_cambio
        .map(m => `${m.cantidad}x $${m.tipo}`)
        .join(', ');
      
      alert(`💰 Tu cambio: $${resultado.cambio.toFixed(2)}\n\nMonedas: ${detalleCambio}`);
    }
  };

  const limpiarTodo = () => {
    setSeleccion({});
    setSaldoUsuario(0);
    setMonedasInsertadas([]);
    setMensaje('');
  };

  // Obtener imagen por tipo de producto
  const getImagenPorTipo = (tipo, nombre) => {
    const imageMap = {
      'Bebida': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
      'Snack': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
      'Dulce': 'https://cdn-icons-png.flaticon.com/512/541/541732.png',
      'Saludable': 'https://cdn-icons-png.flaticon.com/512/3845/3845836.png'
    };
    
    // Imágenes específicas
    if (nombre.toLowerCase().includes('agua')) return 'https://cdn-icons-png.flaticon.com/512/3100/3100566.png';
    if (nombre.toLowerCase().includes('café') || nombre.toLowerCase().includes('cafe')) return 'https://cdn-icons-png.flaticon.com/512/924/924514.png';
    if (nombre.toLowerCase().includes('jugo')) return 'https://cdn-icons-png.flaticon.com/512/2442/2442019.png';
    if (nombre.toLowerCase().includes('coca')) return 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png';
    if (nombre.toLowerCase().includes('galleta')) return 'https://cdn-icons-png.flaticon.com/512/541/541732.png';
    if (nombre.toLowerCase().includes('papa')) return 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png';
    
    return imageMap[tipo] || 'https://cdn-icons-png.flaticon.com/512/3050/3050150.png';
  };

  // Denominaciones disponibles para insertar
  const denominacionesDisponibles = [
    { tipo: '0.05', label: '5¢' },
    { tipo: '0.10', label: '10¢' },
    { tipo: '0.25', label: '25¢' },
    { tipo: '0.50', label: '50¢' },
    { tipo: '1.00', label: '$1.00' },
    { tipo: '5.00', label: '$5.00' },
    { tipo: '10.00', label: '$10.00' }
  ];

  return (
    <div className="vending-app">
      <header className="vending-header">
        <h1>🏪 MÁQUINA EXPENDEDORA</h1>
        {mensaje && (
          <div className={`mensaje ${mensaje.includes('✅') ? 'exito' : 'error'}`}>
            {mensaje}
          </div>
        )}
      </header>

      <div className="main-content">
        {/* LADO IZQUIERDO: PRODUCTOS */}
        <div className="productos-grid">
          {productos.length === 0 ? (
            <div className="loading">Cargando productos...</div>
          ) : (
            productos.map(p => (
              <div key={p.id} className="card-producto">
                <div className="contenedor-foto">
                  <img 
                    src={getImagenPorTipo(p.tipo, p.nombre)} 
                    alt={p.nombre} 
                    className="producto-foto" 
                  />
                </div>
                <h3>{p.nombre}</h3>
                <span className="tipo-badge">{p.tipo}</span>
                <p className="precio">${p.precio}</p>
                <p className="stock">
                  Disponibles: {p.cantidad - (seleccion[p.id] || 0)}
                </p>
                <div className="controles">
                  <button 
                    onClick={() => modificarCantidad(p.id, -1)}
                    disabled={!seleccion[p.id] || seleccion[p.id] === 0}
                  >
                    -
                  </button>
                  <span className="cantidad-seleccionada">
                    {seleccion[p.id] || 0}
                  </span>
                  <button 
                    onClick={() => modificarCantidad(p.id, 1)}
                    disabled={p.cantidad <= (seleccion[p.id] || 0)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* LADO DERECHO: PANEL DE PAGO */}
        <div className="panel-pago">
          <div className="pantalla-digital">
            <label>TOTAL A PAGAR</label>
            <div className="numero">${totalAPagar.toFixed(2)}</div>
            {productosSeleccionados.length > 0 && (
              <div className="detalle-compra">
                {productosSeleccionados.map(p => (
                  <div key={p.id} className="item-compra">
                    {p.cantidadSeleccionada}x {p.nombre} 
                    <span>${(p.precio * p.cantidadSeleccionada).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pantalla-digital saldo">
            <label>TU SALDO</label>
            <div className="numero">${saldoUsuario.toFixed(2)}</div>
            {cambio > 0 && (
              <div className="cambio-display">
                Cambio: ${cambio.toFixed(2)}
              </div>
            )}
          </div>

          <div className="botones-monedas">
            <p>💵 Insertar Dinero:</p>
            <div className="monedas-grid">
              {denominacionesDisponibles.map(d => (
                <button 
                  key={d.tipo} 
                  onClick={() => insertarMoneda(d.tipo)}
                  className="btn-moneda"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="btn-pagar" 
            disabled={saldoUsuario < totalAPagar || totalAPagar === 0 || loading}
            onClick={procesarCompra}
          >
            {loading ? 'PROCESANDO...' : '💳 PAGAR AHORA'}
          </button>

          <button 
            className="btn-cancelar" 
            onClick={limpiarTodo}
            disabled={loading}
          >
            🗑️ LIMPIAR TODO
          </button>
        </div>
      </div>

      <footer className="vending-footer">
        <div className="footer-header">
          <h3>📊 INVENTARIO DE CAMBIO</h3>
          <span className={`status-indicator ${monedas.length > 0 ? 'online' : 'offline'}`}>
            {monedas.length > 0 ? '● CONECTADO' : '● DESCONECTADO'}
          </span>
        </div>
        
        <div className="inventario-container">
          {/* SECCIÓN MONEDAS */}
          <div className="inventario-seccion">
            <h4>💰 MONEDAS</h4>
            <div className="bandejas">
              {monedas
                .filter(m => parseFloat(m.tipo) < 1)
                .sort((a, b) => parseFloat(a.tipo) - parseFloat(b.tipo))
                .map(m => (
                  <div key={m.id} className="bandeja-simple">
                    <label>{parseFloat(m.tipo) < 1 ? `${(parseFloat(m.tipo) * 100).toFixed(0)}¢` : `$${m.tipo}`}</label>
                    <span className={`cantidad-badge ${m.cantidad < 10 ? 'bajo' : ''}`}>
                      {m.cantidad} unidades
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* SECCIÓN BILLETES */}
          <div className="inventario-seccion">
            <h4>💵 BILLETES</h4>
            <div className="bandejas">
              {monedas
                .filter(m => parseFloat(m.tipo) >= 1)
                .sort((a, b) => parseFloat(a.tipo) - parseFloat(b.tipo))
                .map(m => (
                  <div key={m.id} className="bandeja-simple">
                    <label>${m.tipo}</label>
                    <span className={`cantidad-badge bill ${m.cantidad < 5 ? 'bajo' : ''}`}>
                      {m.cantidad} unidades
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="inventario-stats">
          <div className="stat-item">
            <label>Total Productos:</label>
            <span>{productos.reduce((acc, p) => acc + p.cantidad, 0)} unidades</span>
          </div>
          <div className="stat-item">
            <label>Tipos Disponibles:</label>
            <span>{productos.length} productos</span>
          </div>
          <div className="stat-item">
            <label>Cambio Disponible:</label>
            <span>
              ${monedas.reduce((acc, m) => 
                acc + (parseFloat(m.tipo) * m.cantidad), 0
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;