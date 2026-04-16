// BRA TTS ELITE 2026
(function(){
const p={aura1:{name:"Aura 1",enabled:!!localStorage.getItem("bra_tts_aura_key"),apiKey:localStorage.getItem("bra_tts_aura_key")||""},gemini:{name:"Gemini",enabled:!!localStorage.getItem("bra_tts_gemini_key"),apiKey:localStorage.getItem("bra_tts_gemini_key")||""},native:{name:"Nativo",enabled:"speechSynthesis"in window}};
let tts="true"===localStorage.getItem("bra_tts_enabled"),speaking=!1;
const style=document.createElement("style");
style.textContent="#bra-tts-btn{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#9d00ff,#00f5ff);border:none;color:#000;font-size:24px;cursor:pointer;z-index:99999;box-shadow:0 4px 20px rgba(157,0,255,.4)}#bra-tts-btn.muted{background:#333;color:#666}#bra-tts-panel{position:fixed;bottom:90px;right:20px;background:rgba(10,10,30,.95);border:1px solid rgba(157,0,255,.5);border-radius:16px;padding:16px;z-index:99998;min-width:220px;display:none}#bra-tts-panel.open{display:block}";
document.head.appendChild(style);
const btn=document.createElement("button");
btn.id="bra-tts-btn";
btn.innerHTML=tts?"🔊":"🔇";
btn.className=tts?"":"muted";
btn.onclick=()=>{tts=!tts;localStorage.setItem("bra_tts_enabled",tts);btn.innerHTML=tts?"🔊":"🔇";btn.className=tts?"":"muted";if(tts){const u=new SpeechSynthesisUtterance("BRA activado");u.lang="es-MX";speechSynthesis.speak(u)}};
let timer;
btn.onmousedown=()=>{timer=setTimeout(()=>document.getElementById("bra-tts-panel").classList.toggle("open"),800)};
btn.onmouseup=()=>clearTimeout(timer);
document.body.appendChild(btn);
const panel=document.createElement("div");
panel.id="bra-tts-panel";
panel.innerHTML='<h4 style="color:#00f5ff;margin:0 0 12px 0">⚡ BRA TTS Élite 2026</h4><select id="bra-tts-provider" style="width:100%;margin-bottom:8px"><option value="auto">Auto (Élite)</option><option value="native">Nativo</option></select><button id="bra-tts-save" style="width:100%">💾 Guardar</button>';
document.body.appendChild(panel);
document.getElementById("bra-tts-save").onclick=()=>{localStorage.setItem("bra_tts_provider",document.getElementById("bra-tts-provider").value);alert("Configurado")};
const obs=new MutationObserver(m=>{m.forEach(m=>{m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.textContent&&n.textContent.includes("BRA:")){const t=n.textContent.replace(/BRA:/i,"").trim();tts&&t&&speak(t)}})})});
const chat=document.querySelector("#chat-messages,.chat-messages,.messages,[id*=chat]");
chat&&obs.observe(chat,{childList:!0,subtree:!0});
function speak(t){if(!t||speaking)return;const c=t.replace(/[\u{1F300}-\u{1F9FF}]/gu,"").trim();if(!c)return;speaking=!0;const u=new SpeechSynthesisUtterance(c);u.lang="es-MX";u.onend=()=>{speaking=!1};speechSynthesis.speak(u)}
console.log("🔊 BRA TTS Élite 2026 activo")
})();