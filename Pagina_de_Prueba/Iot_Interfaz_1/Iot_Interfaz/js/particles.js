// Gestión de partículas y efectos visuales
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initTechGrid();
    initConnectionIndicator();
    updateProximityRadar();
});

// Inicializar partículas en el fondo
function initParticles() {
    const container = document.createElement('div');
    container.className = 'particles-container';
    document.body.appendChild(container);
    
    // Crear partículas
    for (let i = 0; i < 30; i++) {
        createParticle(container);
    }
}

// Crear una partícula individual
function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Configurar propiedades aleatorias
    const size = Math.random() * 10 + 5; // Entre 5px y 15px
    const posX = Math.random() * 100;    // Posición X en %
    const duration = Math.random() * 20 + 15; // Entre 15s y 35s
    const delay = Math.random() * 10;     // Retraso hasta 10s
    const opacity = Math.random() * 0.3 + 0.1; // Opacidad entre 0.1 y 0.4
    const shift = (Math.random() - 0.5) * 100; // Desplazamiento horizontal mientras sube
    
    // Aplicar estilos
    particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${posX}%;
        bottom: -50px;
        --duration: ${duration}s;
        --opacity: ${opacity};
        --shift: ${shift}px;
        animation-delay: ${delay}s;
    `;
    
    container.appendChild(particle);
    
    // Recrear la partícula cuando termine su animación
    setTimeout(() => {
        container.removeChild(particle);
        createParticle(container);
    }, (duration + delay) * 1000);
}

// Inicializar grid técnica
function initTechGrid() {
    const techGrid = document.createElement('div');
    techGrid.className = 'tech-grid';
    document.body.appendChild(techGrid);
    
    const hexGrid = document.createElement('div');
    hexGrid.className = 'hexagon-grid';
    document.body.appendChild(hexGrid);
}

// Inicializar indicador de conexión
function initConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'connection-indicator';
    indicator.title = 'Conectado';
    document.body.appendChild(indicator);
    
    // Simulación de estado de conexión
    setInterval(() => {
        const isConnected = Math.random() > 0.2; // 80% probabilidad de estar conectado
        indicator.className = isConnected ? 
            'connection-indicator' : 
            'connection-indicator disconnected';
        indicator.title = isConnected ? 'Conectado' : 'Desconectado';
    }, 5000);
}

// Actualizar radar de proximidad
function updateProximityRadar() {
    const proximityContainer = document.querySelector('.proximity-container');
    if (!proximityContainer) return;
    
    // Crear contenedor de radar si no existe
    if (!document.querySelector('.radar-proximity')) {
        const radarContainer = document.createElement('div');
        radarContainer.className = 'radar-proximity';
        
        const radarSweep = document.createElement('div');
        radarSweep.className = 'radar-sweep';
        
        const radarObject = document.createElement('div');
        radarObject.className = 'radar-object';
        radarObject.id = 'radarObject';
        
        radarContainer.appendChild(radarSweep);
        radarContainer.appendChild(radarObject);
        proximityContainer.prepend(radarContainer);
    }
    
    // Actualizar posición del objeto en el radar según el valor de proximidad
    setInterval(() => {
        const proximityValue = parseInt(document.getElementById('proximityValue').textContent);
        const radarObject = document.getElementById('radarObject');
        
        if (radarObject) {
            // Calcular posición basada en el valor de proximidad (0-100cm)
            const distance = Math.min(proximityValue, 100) / 100; // Normalizado entre 0 y 1
            const angle = (Math.random() * 20 - 10) * Math.PI / 180; // Ángulo aleatorio ±10°
            
            // Convertir a coordenadas polares - Aparecer más en el centro del radar
            const centerX = 50;
            const centerY = 40;  // Más arriba en el radar
            const radius = 40 * distance; // Radio dependiente de la distancia
            const x = centerX + Math.sin(angle) * radius;
            const y = centerY;
            
            // Aplicar posición
            radarObject.style.left = `${x}%`;
            radarObject.style.top = `${y}%`;
            
            // Ajustar tamaño y brillo basado en la proximidad
            const size = 5 + (1 - distance) * 3; // Entre 5px y 8px
            radarObject.style.width = `${size}px`;
            radarObject.style.height = `${size}px`;
            
            // Efecto de parpadeo/intensidad según proximidad
            const blinkSpeed = 0.8 + (1 - distance) * 1; // Entre 0.8s y 1.8s
            radarObject.style.animation = `blink ${blinkSpeed}s infinite alternate`;
            
            // Cambiar de verde a azul claro
            radarObject.style.backgroundColor = '#50b0e8'; // Azul claro en lugar de verde
            radarObject.style.boxShadow = '0 0 10px #50b0e8'; // Azul claro en lugar de verde
        }
    }, 1000);
}
