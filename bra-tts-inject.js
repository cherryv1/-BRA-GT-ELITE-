// BRA TTS ELITE 2026 - Zero Touch Integration
(function() {
  'use strict';
  
  const providers = {
    aura1: { name: 'Aura 1', enabled: false, apiKey: localStorage.getItem('bra_tts_aura_key') || '' },
    gemini: { name: 'Gemini', enabled: false, apiKey: localStorage.getItem('bra_tts_gemini_key') || '' },
    native: { name: 'Nativo', enabled: 'speechSynthesis' in window }
  };
  
  if (providers.aura1.apiKey) providers.aura1.enabled = true;
  if (providers.gemini.apiKey) providers.gemini.enabled = true;
  
  let ttsEnabled = localStorage.getItem('bra_tts_enabled') === 'true';
  let isSpeaking = false;
  
  // CSS
  const style = document.createElement('style');
  style.textContent = `
    #bra-tts-btn { position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #9d00ff, #00f5ff); border: none; color: #000; font-size: 24px; cursor: pointer; z-index: 99999; box-shadow: 0 4px 20px rgba(157,0,255,0.4); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; }
    #bra-tts-btn.muted { background: #333; color: #666; box-shadow: none; }
    #bra-tts-btn.speaking { animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 20px rgba(157,0,255,0.6); } 50% { box-shadow: 0 0 40px rgba(0,245,255,0.8); } }
    #bra-tts-panel { position: fixed; bottom: 90px; right: 20px; background: rgba(10,10,30,0.95); border: 1px solid rgba(157,0,255,0.5); border-radius: 16px; padding: 16px; z-index: 99998; min-width: 220px; display: none; backdrop-filter: blur(10px); }
    #bra-tts-panel.open { display: block; }
    #bra-tts-panel h4 { margin: 0 0 12px 0; color: #00f5ff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    #bra-tts-panel select, #bra-tts-panel input { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,245,255,0.3); color: #fff; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 12px; }
    #bra-tts-panel button { width: 100%; background: linear-gradient(90deg, #00f5ff, #9d00ff); border: none; color: #000; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; }
  `;
  document.head.appendChild(style);
  
  // Botón
  const btn = document.createElement('button');
  btn.id = 'bra-tts-btn';
  btn.innerHTML = ttsEnabled ? '🔊' : '🔇';
  btn.className = ttsEnabled ? '' : 'muted';
  btn.title = 'BRA TTS - Click largo para config';
  
  btn.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    localStorage.setItem('bra_tts_enabled', ttsEnabled);
    btn.innerHTML = ttsEnabled ? '🔊' : '🔇';
    btn.className = ttsEnabled ? '' : 'muted';
    if (ttsEnabled) speakNative('BRA activado');
  });
  
  let pressTimer;
  btn.addEventListener('mousedown', () => { pressTimer = setTimeout(() => togglePanel(), 800); });
  btn.addEventListener('mouseup', () => clearTimeout(pressTimer));
  btn.addEventListener('touchstart', () => { pressTimer = setTimeout(() => togglePanel(), 800); });
  btn.addEventListener('touchend', () => clearTimeout(pressTimer));
  
  document.body.appendChild(btn);
  
  // Panel
  const panel = document.createElement('div');
  panel.id = 'bra-tts-panel';
  panel.innerHTML = `
    <h4>⚡ BRA TTS Élite 2026</h4>
    <select id="bra-tts-provider">
      <option value="auto">Auto (Élite)</option>
      <option value="native">Nativo (siempre)</option>
    </select>
    <input type="password" id="bra-tts-aura-key" placeholder="Deepgram API Key (opcional)">
    <input type="password" id="bra-tts-gemini-key" placeholder="Gemini API Key (opcional)">
    <button id="bra-tts-save">💾 Guardar Config</button>
  `;
  document.body.appendChild(panel);
  
  function togglePanel() { panel.classList.toggle('open'); }
  
  document.getElementById('bra-tts-save').addEventListener('click', () => {
    localStorage.setItem('bra_tts_aura_key', document.getElementById('bra-tts-aura-key').value);
    localStorage.setItem('bra_tts_gemini_key', document.getElementById('bra-tts-gemini-key').value);
    localStorage.setItem('bra_tts_provider', document.getElementById('bra-tts-provider').value);
    alert('✅ Configuración guardada');
    panel.classList.remove('open');
  });
  
  // Observar mensajes de BRA
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.textContent && node.textContent.includes('BRA:')) {
          const text = node.textContent.replace(/BRA:/i, '').trim();
          if (ttsEnabled && text) speak(text);
        }
      });
    });
  });
  
  const chatContainer = document.querySelector('#chat-messages, .chat-messages, .messages, [id*="chat"]');
  if (chatContainer) observer.observe(chatContainer, { childList: true, subtree: true });
  
  // Hook fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data && (data.bra_response || data.response || data.message)) {
        const text = data.bra_response || data.response || data.message;
        if (ttsEnabled && typeof text === 'string') setTimeout(() => speak(text), 100);
      }
    } catch(e) {}
    return response;
  };
  
  function speak(text) {
    if (!text || isSpeaking) return;
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    if (!cleanText) return;
    speakNative(cleanText);
  }
  
  function speakNative(text) {
    isSpeaking = true;
    btn.classList.add('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es'));
    if (esVoice) utterance.voice = esVoice;
    utterance.onend = () => { isSpeaking = false; btn.classList.remove('speaking'); };
    window.speechSynthesis.speak(utterance);
  }
  
  window.BRA_TTS = {
    enable: () => { ttsEnabled = true; btn.innerHTML = '🔊'; btn.className = ''; },
    disable: () => { ttsEnabled = false; btn.innerHTML = '🔇'; btn.className = 'muted'; }
  };
  
  console.log('🔊 BRA TTS Élite 2026 cargado');
})();