const CONFIG = {
    updateInterval: 2000,
    chartMaxPoints: 20,
    proximityThresholds: {
        danger: 20,
        warning: 50,
    },
    esp32Url: "http://192.168.1.7",
    wsUrl: "ws://192.168.1.7/ws"
};

let temperatureData = [];
let humidityData = [];
let temperatureChart;
let humidityChart;
let isAudioPlaying = false;
let isMuted = false;
let activeControls = new Set();
let isWheelForward = true;
let ws;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando interfaz del Carrito Explorador...');
    
    initControlButtons();
    initServoButtons();
    initRangeSliders();
    initAudioButtons();
    initMicToggles();
    initHistoryPanel();
    initWheelToggleButton();
    initCharts();
    initCameraControls();
    
    initWebSocket();
    setInterval(updateSensorData, CONFIG.updateInterval);
    updateSensorStyles();
});

function initWebSocket() {
    console.log(`Intentando conectar WebSocket a: ${CONFIG.wsUrl}`);
    ws = new WebSocket(CONFIG.wsUrl);
    ws.onopen = () => {
        console.log('WebSocket conectado');
    };
    ws.onmessage = (event) => {
        console.log('Mensaje recibido:', event.data);
        if (event.data === "Subir Rueda" || event.data === "Bajar Rueda") {
            document.getElementById('toggleWheel').innerHTML = event.data === "Subir Rueda" ?
                '<i class="fas fa-circle-down fa-2x"></i>' :
                '<i class="fas fa-circle-up fa-2x"></i>';
        } else if (event.data === "Motor detenido") {
            console.log('Motor 3 detenido en la interfaz');
        } else if (event.data.includes("Servo:")) {
            document.getElementById('servoStatus').textContent = event.data.replace("Servo: ", "");
        }
    };
    ws.onclose = () => {
        console.log('WebSocket desconectado, intentando reconectar en 5 segundos...');
        setTimeout(initWebSocket, 5000);
    };
    ws.onerror = (error) => {
        console.error('Error WebSocket:', error);
    };
}

function initControlButtons() {
    const controlButtons = document.querySelectorAll('.control-btn:not(#servoClockwise):not(#servoCounterclockwise):not(#servoStop):not(#toggleWheel)');
    
    controlButtons.forEach(button => {
        ['mousedown', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                const direction = button.id;
                activeControls.add(direction);
                button.classList.add('control-active');
                
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-beat');
                }
                
                sendControlCommand(direction, true);
            });
        });
        
        ['mouseup', 'touchend', 'mouseleave'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                const direction = button.id;
                if (activeControls.has(direction)) {
                    activeControls.delete(direction);
                    button.classList.remove('control-active');
                    
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-beat');
                    }
                    
                    sendControlCommand('stop', true);
                }
            });
        });
    });
    
    document.getElementById('stop').addEventListener('click', () => {
        activeControls.forEach(control => {
            document.getElementById(control).classList.remove('control-active');
        });
        activeControls.clear();
        sendControlCommand('stop', true);
    });
}

function initServoButtons() {
    const servoButtons = ['servoClockwise', 'servoCounterclockwise', 'servoStop'];
    
    servoButtons.forEach(id => {
        const button = document.getElementById(id);
        if (!button) {
            console.error(`Botón ${id} no encontrado`);
            return;
        }
        
        ['mousedown', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                const direction = id.replace('servo', '').toLowerCase();
                button.classList.add('control-active');
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-beat');
                }
                sendServoCommand(direction, document.getElementById('servoSpeedRange').value);
            });
        });
        
        ['mouseup', 'touchend', 'mouseleave'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                button.classList.remove('control-active');
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-beat');
                }
                sendServoCommand('stopServo', 0);
            });
        });
    });
}

function initWheelToggleButton() {
    const toggleWheelButton = document.getElementById('toggleWheel');
    if (!toggleWheelButton) {
        console.error('Botón toggleWheel no encontrado');
        return;
    }
    
    toggleWheelButton.addEventListener('click', () => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log('Enviando comando toggleWheel');
            ws.send('toggleWheel');
            isWheelForward = !isWheelForward;
        } else {
            console.error('WebSocket no está conectado');
        }
    });
}

function initRangeSliders() {
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');
    
    speedRange.addEventListener('input', () => {
        const value = speedRange.value;
        speedValue.textContent = value;
        sendSpeedCommand(value);
    });
    
    const servoSpeedRange = document.getElementById('servoSpeedRange');
    const servoSpeedValue = document.getElementById('servoSpeedValue');
    
    servoSpeedRange.addEventListener('input', () => {
        const value = servoSpeedRange.value;
        servoSpeedValue.textContent = value;
        if (activeControls.has('servoClockwise') || activeControls.has('servoCounterclockwise')) {
            sendServoCommand(
                activeControls.has('servoClockwise') ? 'clockwise' : 'counterclockwise',
                value
            );
        }
    });
    
    const volumeRange = document.getElementById('volumeRange');
    const volumeValue = document.getElementById('volumeValue');
    
    volumeRange.addEventListener('input', () => {
        const value = volumeRange.value;
        volumeValue.textContent = value;
        setAudioVolume(value);
    });
}

function initAudioButtons() {
    const startButton = document.getElementById('audioStart');
    const stopButton = document.getElementById('audioStop');
    const muteButton = document.getElementById('audioMute');
    
    startButton.addEventListener('click', () => {
        isAudioPlaying = true;
        startAudio();
        startButton.disabled = true;
        stopButton.disabled = false;
    });
    
    stopButton.addEventListener('click', () => {
        isAudioPlaying = false;
        stopAudio();
        startButton.disabled = false;
        stopButton.disabled = true;
    });
    
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        setAudioMute(isMuted);
        muteButton.innerHTML = isMuted ? 
            '<i class="fas fa-volume-up"></i> Activar Sonido' : 
            '<i class="fas fa-volume-mute"></i> Silenciar';
    });
    
    stopButton.disabled = true;
}

function simulateSoundDetection(micId) {
    const mic = document.getElementById(micId);
    if (!mic) return;
    
    mic.setAttribute('data-active', 'true');
    setTimeout(() => {
        mic.setAttribute('data-active', 'false');
    }, 2000);
}

function initMicToggles() {
    document.querySelectorAll('.mic-toggles .form-check-input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const micId = this.id.replace('toggle', 'mic');
            const isActive = this.checked;
            document.getElementById(micId).setAttribute('data-active', isActive);
            sendMicCommand(micId, isActive);
        });
    });
}

function initHistoryPanel() {
    const toggleBtn = document.getElementById('toggleHistory');
    const historyPanel = document.querySelector('.history-panel');
    
    toggleBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('collapsed');
        const isCollapsed = historyPanel.classList.contains('collapsed');
        toggleBtn.innerHTML = isCollapsed ? 
            '<i class="fas fa-chevron-up"></i>' : 
            '<i class="fas fa-chevron-down"></i>';
    });
}

function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        scales: {
            x: { display: false },
            y: { beginAtZero: false }
        },
        elements: {
            line: { tension: 0.4 },
            point: { radius: 3 }
        },
        plugins: {
            legend: { display: true, position: 'top' }
        }
    };
    
    const temperatureCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(temperatureCtx, {
        type: 'line',
        data: {
            labels: Array(CONFIG.chartMaxPoints).fill(''),
            datasets: [{
                label: 'Temperatura (°C)',
                data: Array(CONFIG.chartMaxPoints).fill(null),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: { beginAtZero: false, suggestedMin: 15, suggestedMax: 40 }
            }
        }
    });
    
    const humidityCtx = document.getElementById('humidityChart').getContext('2d');
    humidityChart = new Chart(humidityCtx, {
        type: 'line',
        data: {
            labels: Array(CONFIG.chartMaxPoints).fill(''),
            datasets: [{
                label: 'Humedad (%)',
                data: Array(CONFIG.chartMaxPoints).fill(null),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: { beginAtZero: false, suggestedMin: 0, suggestedMax: 100 }
            }
        }
    });
}

function updateSensorData() {
    fetch(`${CONFIG.esp32Url}/sensors`, { timeout: 5000 })
        .then(response => {
            if (!response.ok) throw new Error('Error al obtener datos de sensores: ' + response.statusText);
            return response.json();
        })
        .then(data => {
            let rainStatus = 'No detectada';
            if (data.lluvia < 1000) rainStatus = 'Detectada';
            else if (data.lluvia < 2000) rainStatus = 'Lluvia';
            
            let smokeStatus = 'Normal';
            if (data.humo > 4200) smokeStatus = 'Detectado';
            
            updateTemperature(data.temperatura || 0);
            updateHumidity(data.humedad || 0);
            updateSmokeDetection(smokeStatus);
            updateRainDetection(rainStatus);
            updateProximity(data.proximidad || 0);
        })
        .catch(error => {
            console.error('Error al actualizar sensores:', error);
            updateTemperature(0);
            updateHumidity(0);
            updateSmokeDetection('Error');
            updateRainDetection('Error');
            updateProximity(0);
        });
}

function updateTemperature(value) {
    const tempElement = document.getElementById('temperatureValue');
    tempElement.textContent = value ? `${value.toFixed(1)}°C` : 'Error';
    
    const scaleBar = document.querySelector('.temperature-scale');
    if (scaleBar) {
        const percentage = Math.max(0, Math.min(100, (value / 50) * 100));
        scaleBar.style.width = `${percentage}%`;
        const brightness = Math.max(0.7, Math.min(1.3, value / 25));
        scaleBar.style.filter = `brightness(${brightness})`;
        scaleBar.style.animation = (value > 30 || value < 10) ? 'scalePulse 1s infinite alternate' : 'none';
    }
    
    tempElement.classList.remove('sensor-critical');
    if (value > 30 || value < 10) {
        tempElement.classList.add('sensor-critical');
    }
    
    const time = new Date().toLocaleTimeString();
    temperatureChart.data.labels.push(time);
    temperatureChart.data.datasets[0].data.push(value);
    if (temperatureChart.data.labels.length > CONFIG.chartMaxPoints) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
    }
    temperatureChart.update();
}

function updateHumidity(value) {
    const humElement = document.getElementById('humidityValue');
    humElement.textContent = value ? `${value.toFixed(0)}%` : 'Error';
    
    const scaleBar = document.querySelector('.humidity-scale');
    if (scaleBar) {
        scaleBar.style.width = `${value}%`;
        scaleBar.style.filter = value < 30 ? 'hue-rotate(-20deg) saturate(1.2)' :
                               value > 70 ? 'hue-rotate(20deg) saturate(1.2)' : 'none';
        scaleBar.style.animation = (value > 85 || value < 20) ? 'scalePulse 1s infinite alternate' : 'none';
    }
    
    humElement.classList.remove('sensor-critical');
    if (value > 85 || value < 20) {
        humElement.classList.add('sensor-critical');
    }
    
    const time = new Date().toLocaleTimeString();
    humidityChart.data.labels.push(time);
    humidityChart.data.datasets[0].data.push(value);
    if (humidityChart.data.labels.length > CONFIG.chartMaxPoints) {
        humidityChart.data.labels.shift();
        humidityChart.data.datasets[0].data.shift();
    }
    humidityChart.update();
}

function updateSmokeDetection(status) {
    const smokeElement = document.getElementById('smokeValue');
    smokeElement.textContent = status;
    
    smokeElement.classList.remove('sensor-critical', 'sensor-pulse');
    if (status !== 'Normal') {
        smokeElement.classList.add('sensor-critical', 'sensor-pulse');
    }
}

function updateRainDetection(status) {
    const rainElement = document.getElementById('rainValue');
    rainElement.textContent = status;
    
    rainElement.classList.remove('sensor-critical', 'sensor-pulse');
    if (status !== 'No detectada') {
        rainElement.classList.add('sensor-pulse');
    }
}

function updateProximity(value) {
    const proximityElement = document.getElementById('proximityValue');
    const proximityBar = document.getElementById('proximityBar');
    
    proximityElement.textContent = value ? `${value} cm` : 'Error';
    
    const barWidth = value ? Math.max(5, Math.min(90, 100 - value)) : 0;
    proximityBar.style.width = `${barWidth}%`;
    
    if (value <= CONFIG.proximityThresholds.danger) {
        proximityBar.style.background = 'linear-gradient(90deg, #d73a49, #e85c33)';
        proximityElement.style.color = '#d73a49';
    } else if (value <= CONFIG.proximityThresholds.warning) {
        proximityBar.style.background = 'linear-gradient(90deg, #1a7cb8, #50b0e8)';
        proximityElement.style.color = '#50b0e8';
    } else {
        proximityBar.style.background = 'linear-gradient(90deg, #0a4c7f, #1a7cb8)';
        proximityElement.style.color = '#1a7cb8';
    }
    
    updateRadarVisualization(value);
}

function updateRadarVisualization(proximityValue) {
    const radarObject = document.getElementById('radarObject');
    if (!radarObject) return;
    
    const normalizedValue = Math.min(100, proximityValue) / 100;
    const angle = Math.PI / 2;
    const distance = (1 - (normalizedValue * 0.8)) * 80;
    const x = 50 + Math.cos(angle) * distance;
    const y = 100 - Math.sin(angle) * distance;
    
    radarObject.style.transition = "left 0.5s ease, top 0.5s ease";
    radarObject.style.left = `${x}%`;
    radarObject.style.top = `${y}%`;
    
    const glow = 5 + (1 - normalizedValue) * 15;
    radarObject.style.boxShadow = `0 0 ${glow}px #50b0e8`;
    const opacity = 0.7 + (1 - normalizedValue) * 0.3;
    radarObject.style.opacity = opacity.toString();
}

function updateSensorStyles() {
    document.querySelectorAll('.sensor-scale').forEach(scale => {
        scale.style.boxShadow = '0 0 8px rgba(80, 176, 232, 0.5)';
    });
}

function sendControlCommand(direction, isActive) {
    if (!isActive) direction = 'stop';
    fetch(`${CONFIG.esp32Url}/control?direction=${direction}`, { timeout: 5000 })
        .then(response => {
            if (!response.ok) throw new Error('Error al enviar comando: ' + response.statusText);
            console.log(`Comando enviado: ${direction}`);
        })
        .catch(error => console.error(`Error al enviar comando: ${error}`));
}

function sendServoCommand(direction, speed) {
    fetch(`${CONFIG.esp32Url}/controlServo?direction=${direction}&speed=${speed}`, { timeout: 5000 })
        .then(response => {
            if (!response.ok) throw new Error('Error al enviar comando de servo: ' + response.statusText);
            console.log(`Comando de servo enviado: ${direction}, velocidad: ${speed}%`);
        })
        .catch(error => console.error(`Error al enviar comando de servo: ${error}`));
}

function sendSpeedCommand(speed) {
    fetch(`${CONFIG.esp32Url}/control?speed=${speed}`, { timeout: 5000 })
        .then(response => {
            if (!response.ok) throw new Error('Error al enviar velocidad: ' + response.statusText);
            console.log(`Velocidad enviada: ${speed}%`);
        })
        .catch(error => console.error(`Error al enviar velocidad: ${error}`));
}

function startAudio() {
    console.log('Iniciando transmisión de audio');
}

function stopAudio() {
    console.log('Deteniendo transmisión de audio');
}

function setAudioVolume(volume) {
    console.log(`Volumen establecido: ${volume}%`);
}

function setAudioMute(muted) {
    console.log(`Audio ${muted ? 'silenciado' : 'activado'}`);
}

function sendMicCommand(micId, isEnabled) {
    console.log(`Micrófono ${micId}: ${isEnabled ? 'Activado' : 'Desactivado'}`);
}

function startDemoMode() {
    console.log('Modo demostración desactivado; usando datos reales del ESP32');
}

const CAMERA_CONFIG = {
    defaultIP: '192.168.1.8',
    streamPath: '/stream',
    flashPath: '/flash',
    capturePath: '/capture',
    reconnectInterval: 10000
};

function initCameraControls() {
    const btnConnect = document.getElementById('connectCamera');
    const inpIP = document.getElementById('cameraIP');
    const imgStream = document.getElementById('cameraStream');
    const placeholder = document.getElementById('videoPlaceholder');
    const btnFlash = document.getElementById('toggleFlash');
    const btnCapture = document.getElementById('capturePhoto');

    if (!btnConnect || !inpIP || !imgStream || !placeholder || !btnFlash || !btnCapture) {
        console.error('[ERROR] Uno o más elementos HTML no encontrados');
        return;
    }

    let flashOn = false;
    const savedIP = localStorage.getItem('cameraIP');
    inpIP.value = savedIP || CAMERA_CONFIG.defaultIP;

    btnConnect.onclick = () => {
        const ip = inpIP.value.trim();
        if (!ip) return alert('Debe indicar IP.');
        console.log('[CONNECT] Conectando a IP: ' + ip);
        localStorage.setItem('cameraIP', ip);
        connectToCamera(ip, imgStream, placeholder);
    };

    btnFlash.onclick = async () => {
        const ip = inpIP.value.trim();
        if (!ip) return alert('Conecta primero.');
        console.log('[FLASH] Enviando solicitud');
        const result = await toggleFlash(ip, imgStream);
        if (result !== null) {
            flashOn = result;
            btnFlash.innerHTML = flashOn
                ? `<i class="fas fa-lightbulb"></i> Apagar Flash`
                : `<i class="fas fa-lightbulb"></i> Encender Flash`;
            console.log('[FLASH] Botón actualizado a: ' + (flashOn ? 'Apagar' : 'Encender'));
        }
    };

    btnCapture.onclick = async () => {
        const ip = inpIP.value.trim();
        if (!ip) return alert('Conecta primero.');
        console.log('[CAPTURE] Enviando solicitud');
        await capturePhoto(ip, imgStream);
    };

    if (savedIP) {
        console.log('[INIT] Conexión automática a IP guardada: ' + savedIP);
        connectToCamera(savedIP, imgStream, placeholder);
    }
}

function connectToCamera(ip, imgEl, ph) {
    const url = `http://${ip}${CAMERA_CONFIG.streamPath}?t=${Date.now()}`;
    console.log('[→] Conectando a stream: ' + url);
    imgEl.src = url;
    imgEl.style.visibility = 'hidden';
    ph.style.display = 'flex';

    imgEl.onload = () => {
        imgEl.style.visibility = 'visible';
        ph.style.display = 'none';
        console.log('[✔] Stream cargado correctamente: ' + url);
    };

    imgEl.onerror = (e) => {
        imgEl.style.visibility = 'hidden';
        ph.style.display = 'flex';
        console.error('[ERR] Error en stream: ' + url, e);
        setTimeout(() => connectToCamera(ip, imgEl, ph), CAMERA_CONFIG.reconnectInterval);
    };
}

function resumeStream(imgEl, ip) {
    const url = `http://${ip}${CAMERA_CONFIG.streamPath}?t=${Date.now()}`;
    console.log('[→] Reanudando stream: ' + url);
    imgEl.src = url;
}

async function toggleFlash(ip, imgEl) {
    const originalSrc = imgEl.src;
    imgEl.src = '';
    try {
        console.log('[→] toggleFlash');
        const url = `http://${ip}${CAMERA_CONFIG.flashPath}?t=${Date.now()}`;
        console.log('[FLASH] Solicitud enviada a: ' + url);
        const res = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store', timeout: 5000 });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const txt = await res.text();
        console.log('[FLASH] Respuesta: ' + txt);
        return !/^Flash apagado/i.test(txt);
    } catch (e) {
        console.error('[FLASH] Error: ', e);
        alert('No se pudo cambiar el flash. Verifica la conexión.');
        return null;
    } finally {
        setTimeout(() => resumeStream(imgEl, ip), 500);
    }
}

async function capturePhoto(ip, imgEl) {
    const originalSrc = imgEl.src;
    imgEl.src = '';
    try {
        console.log('[→] Captura');
        const url = `http://${ip}${CAMERA_CONFIG.capturePath}?t=${Date.now()}`;
        console.log('[CAPTURE] Solicitud enviada a: ' + url);
        const res = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store', timeout: 5000 });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const blob = await res.blob();
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        console.log('[CAPTURE] Timestamp para foto: ' + ts);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `photo-${ts}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        console.log('[✔] Foto descargada');
        return true;
    } catch (e) {
        console.error('[CAPTURE] Error: ', e);
        alert('No se pudo capturar la foto. Verifica la conexión.');
        return false;
    } finally {
        setTimeout(() => resumeStream(imgEl, ip), 500);
    }
}

console.log('Conexión con ESP32 iniciada');