// Script para corregir errores y manejar el estilo de micrófonos

document.addEventListener('DOMContentLoaded', function() {
    // 1. Eliminar manejadores de error global
    window.onerror = function(msg, url, line) {
        console.log('Error capturado:', msg);
        return true; // Previene que se muestre el diálogo de error
    };
    
    // 2. Aplicar estilos directamente a los micrófonos
    function fixMicrophones() {
        const positions = {
            'micFront': { top: '-12px', left: '50%', transform: 'translateX(-50%)' },
            'micRight': { top: '50%', right: '-12px', transform: 'translateY(-50%)' },
            'micBack': { bottom: '-12px', left: '50%', transform: 'translateX(-50%)' },
            'micLeft': { top: '50%', left: '-12px', transform: 'translateY(-50%)' }
        };
        
        Object.keys(positions).forEach(id => {
            const mic = document.getElementById(id);
            if (mic) {
                // Aplicar estilos directamente
                Object.assign(mic.style, {
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid #1a7cb8',
                    boxShadow: '0 0 5px rgba(26, 124, 184, 0.5)',
                    position: 'absolute',
                    ...positions[id]
                });
                
                // Asegurar que el ícono sea visible
                const icon = mic.querySelector('i');
                if (icon) {
                    Object.assign(icon.style, {
                        color: '#1a7cb8',
                        fontSize: '12px'
                    });
                }
            }
        });
    }
    
    // 3. Corregir otros elementos con colores naranja
    function fixOtherElements() {
        // Cambiar todos los botones naranja a azul
        document.querySelectorAll('.btn-orange').forEach(btn => {
            btn.classList.remove('btn-orange');
            btn.classList.add('btn-primary');
            btn.style.backgroundColor = '#1a7cb8';
            btn.style.borderColor = '#0a4c7f';
        });
        
        // Cambiar los iconos con clase text-orange
        document.querySelectorAll('.text-orange').forEach(el => {
            el.classList.remove('text-orange');
            el.classList.add('text-info');
            el.style.color = '#1a7cb8';
        });
        
        // Arreglar el carro
        const carIcon = document.querySelector('.car-icon');
        if (carIcon) {
            carIcon.style.color = '#1a7cb8';
            carIcon.style.filter = 'drop-shadow(0 0 8px rgba(26, 124, 184, 0.8))';
            carIcon.style.fontSize = '40px';
        }
        
        const carOutline = document.querySelector('.car-outline');
        if (carOutline) {
            carOutline.style.border = '2px solid #1a7cb8';
            carOutline.style.boxShadow = '0 0 15px rgba(26, 124, 184, 0.3)';
            carOutline.style.position = 'relative';
            carOutline.style.width = '80%';
            carOutline.style.height = '50px';
            carOutline.style.margin = '0 auto';
            carOutline.style.borderRadius = '30px';
            carOutline.style.display = 'flex';
            carOutline.style.justifyContent = 'center';
            carOutline.style.alignItems = 'center';
        }
    }
    
    // 4. Reemplazar el método simulateSoundDetection
    window.simulateSoundDetection = function(micId) {
        console.log(`Simulando detección de sonido en: ${micId}`);
        const mic = document.getElementById(micId);
        if (!mic) return;
        
        // Activar el micrófono con una animación visible
        mic.setAttribute('data-active', 'true');
        mic.style.backgroundColor = 'rgba(10, 76, 127, 0.9)';
        mic.style.boxShadow = '0 0 8px rgba(26, 124, 184, 0.9)';
        mic.style.transform = mic.style.transform.includes('translate') ? 
            mic.style.transform.replace('scale(1)', 'scale(1.2)') : 
            (mic.style.transform + ' scale(1.2)');
        
        const icon = mic.querySelector('i');
        if (icon) {
            icon.style.color = '#50b0e8';
            icon.style.animation = 'pulse 0.5s infinite alternate';
        }
        
        // Desactivar después de un tiempo
        setTimeout(() => {
            mic.setAttribute('data-active', 'false');
            mic.style.backgroundColor = 'rgba(20, 20, 20, 0.8)';
            mic.style.boxShadow = '0 0 5px rgba(26, 124, 184, 0.5)';
            mic.style.transform = mic.style.transform.replace(' scale(1.2)', '');
            
            if (icon) {
                icon.style.color = '#1a7cb8';
                icon.style.animation = '';
            }
        }, 2000);
    };
    
    // Ejecutar las funciones de corrección
    setTimeout(() => {
        fixMicrophones();
        fixOtherElements();
        // Agregar animación @keyframes si no existe
        if (!document.querySelector('style#pulseAnimation')) {
            const style = document.createElement('style');
            style.id = 'pulseAnimation';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }, 500);
});