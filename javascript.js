/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT PRINCIPAL
 * Descrição: Lógica de interações, modais com botão X (✕) e
 * gesto de arraste, PWA com memória, formulário, OneSignal,
 * Service Worker, banner LGPD, botão de tradução e menu mobile
 * Organizado por seções para facilitar manutenção
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES GERAIS ====================
const CONFIG = {
    modalId: 'video-modal',
    iframeTargetId: 'modal-iframe-target',
    toastContainerId: 'toast-container',
    privacyModalId: 'privacy-modal',
    privacyTargetId: 'privacy-content-target',
    scriptURL: 'https://script.google.com/macros/s/AKfycbwOnJ8aLNMfbOss06eRh_glZRNULpJ3j9HqeL7PCGPDfr80_vcCB5-hLEHkDddO-LFrqA/exec'
};

// ==================== 2. INTEGRAÇÃO ONESIGNAL PUSH ====================
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(function(OneSignal) { OneSignal.init({ appId: "24dbec09-7c58-4193-9d90-8417abc8564e", safari_web_id: "SEU_ID_SAFARI_AQUI_SE_HOUVER", notifyButton: { enable: true } }); });

// ==================== 3. SERVICE WORKER E PWA ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/service-worker.js').then(registration => { console.log('Service Worker registrado com sucesso!'); }).catch(error => { console.log('Erro ao registrar o Service Worker:', error); }); });
    navigator.serviceWorker.ready.then(registration => { registration.update(); registration.addEventListener('updatefound', () => { const newWorker = registration.installing; newWorker.addEventListener('statechange', () => { if (newWorker.state === 'installed' && navigator.serviceWorker.controller) { console.log('Nova versão do app disponível. Atualizando...'); window.location.reload(); } }); }); });
}

// ==================== 4. POPUP DE INSTALAÇÃO DO APP (PWA) COM MEMÓRIA ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');
    const pwaFloatingBtn = document.getElementById('pwa-floating-btn');
    if (!pwaPopup) return;
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const jaInstalou = localStorage.getItem('vitaotub_pwa_installed'); const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected'); if (!jaInstalou && !jaRejeitou) { pwaPopup.style.display = 'flex'; } else if (jaRejeitou) { if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; } });
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) { localStorage.setItem('vitaotub_pwa_installed', 'true'); return; }
    const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected');
    if (jaRejeitou && pwaFloatingBtn) { pwaFloatingBtn.style.display = 'flex'; }
    const jaInstalou = localStorage.getItem('vitaotub_pwa_installed');
    if (!isStandalone && !jaRejeitou && !jaInstalou) { setTimeout(() => { if (pwaPopup.style.display !== 'flex' && !localStorage.getItem('vitaotub_pwa_rejected')) pwaPopup.style.display = 'flex'; }, 2000); }
    if (installBtn) { installBtn.addEventListener('click', async () => { if (deferredPrompt) { pwaPopup.style.display = 'none'; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { console.log('App instalado!'); localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; } else { localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; } deferredPrompt = null; } else { window.location.href = '/feed/feed.html'; } }); }
    if (closeBtn) { closeBtn.addEventListener('click', () => { pwaPopup.style.display = 'none'; localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; }); }
    if (pwaFloatingBtn) { pwaFloatingBtn.addEventListener('click', async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { console.log('App instalado!'); localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); pwaFloatingBtn.style.display = 'none'; } deferredPrompt = null; } else { alert('Para instalar, acesse as opções do seu navegador ou visite a página do feed.'); } }); }
});

// ==================== 5. CONTROLE DE SCROLL (MODAIS) ====================
function lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add('modal-open');
    const header = document.querySelector('header');
    if (header) header.style.paddingRight = `${scrollbarWidth}px`;
    const fixedElements = document.querySelectorAll('.back-to-top, .translate-widget, .pwa-floating-btn');
    fixedElements.forEach(el => { el.style.marginRight = `${scrollbarWidth}px`; });
}
function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.classList.remove('modal-open');
    const header = document.querySelector('header');
    if (header) header.style.paddingRight = '';
    const fixedElements = document.querySelectorAll('.back-to-top, .translate-widget, .pwa-floating-btn');
    fixedElements.forEach(el => { el.style.marginRight = ''; });
}

// ==================== 6. ANIMAÇÃO DE ESTATÍSTICAS ====================
const statsObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { const fills = entry.target.querySelectorAll('.demo-bar-fill, .bar-fill'); fills.forEach(fill => { const targetWidth = fill.getAttribute('data-width') || fill.parentElement.getAttribute('data-width') || "100%"; fill.style.width = targetWidth; }); } }); }, { threshold: 0.1 });
document.querySelectorAll('.stat-card, .demo-box, .demo-bar-item').forEach(el => statsObserver.observe(el));

// ==================== 7. SISTEMA DE MODAL DE VÍDEO ====================
function openVideo(videoId) { const modal = document.getElementById(CONFIG.modalId); const target = document.getElementById(CONFIG.iframeTargetId); if (modal && target) { target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`; modal.classList.add('active'); lockScroll(); } }
function closeVideo() { const modal = document.getElementById(CONFIG.modalId); const target = document.getElementById(CONFIG.iframeTargetId); if (modal) { if (target) target.innerHTML = ''; modal.classList.remove('active'); unlockScroll(); } }

// ==================== 8. MODAL DE PRIVACIDADE E TERMOS ====================
async function openPrivacyModal() { await loadModalContent('./politica-de-privacidade.html'); }
async function openTermsModal() { await loadModalContent('./termos-de-uso.html'); }
async function loadModalContent(filePath) {
    const modal = document.getElementById(CONFIG.privacyModalId);
    const target = document.getElementById(CONFIG.privacyTargetId);
    if (modal && target) { modal.style.display = 'flex'; modal.classList.add('active'); lockScroll(); target.innerHTML = '<p>Carregando conteúdo...</p>'; try { const response = await fetch(filePath); if (!response.ok) throw new Error('Arquivo não encontrado'); target.innerHTML = await response.text(); initSwipeToClose(); } catch (error) { target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar o conteúdo.</p><p><a href="${filePath}" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>`; } }
}
function closePrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    if (modal) { modal.classList.remove('active'); setTimeout(() => { if (!modal.classList.contains('active')) modal.style.display = 'none'; }, 300); unlockScroll(); }
    const content = document.getElementById('privacy-modal-content');
    if (content) { content.style.transform = ''; content.style.opacity = ''; }
}
function initSwipeToClose() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    const content = document.getElementById('privacy-modal-content');
    if (!modal || !content) return;
    let startX = 0, currentX = 0, isDragging = false;
    content.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; content.style.transition = 'none'; }, { passive: true });
    content.addEventListener('touchmove', (e) => { if (!isDragging) return; currentX = e.touches[0].clientX; const diffX = currentX - startX; if (Math.abs(diffX) > 20) { content.style.transform = `translateX(${diffX}px)`; content.style.opacity = 1 - Math.abs(diffX) / 400; } }, { passive: true });
    content.addEventListener('touchend', () => { if (!isDragging) return; isDragging = false; const diffX = currentX - startX; content.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; if (Math.abs(diffX) > 100) { content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; content.style.opacity = '0'; setTimeout(() => { closePrivacyModal(); }, 300); } else { content.style.transform = ''; content.style.opacity = ''; } currentX = 0; });
}

// ==================== 9. PROCESSAMENTO DO FORMULÁRIO DE CONTATO ====================
const contactForm = document.getElementById('contact-form');
if (contactForm) { contactForm.addEventListener('submit', function(e) { e.preventDefault(); const privacyCheck = document.getElementById('privacy-check'); if (!privacyCheck || !privacyCheck.checked) { alert("Por favor, confirme que você leu e concorda com a Política de Privacidade."); return; } const nome = contactForm.querySelector('input[name="nome"]').value; const email = contactForm.querySelector('input[name="email"]').value; const mensagem = contactForm.querySelector('textarea[name="mensagem"]').value; const assunto = encodeURIComponent(`Contato via Site - ${nome}`); const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`); window.location.href = `mailto:vitaotub@gmail.com?subject=${assunto}&body=${corpo}`; const toast = document.getElementById(CONFIG.toastContainerId); if (toast) { toast.classList.add('show'); lockScroll(); } contactForm.reset(); }); }
function closeToast() { const toast = document.getElementById(CONFIG.toastContainerId); if (toast) { toast.classList.remove('show'); unlockScroll(); } }

// ==================== 10. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeVideo(); closeToast(); closePrivacyModal(); closeMobileMenu(); const translateDropdown = document.getElementById('translate-dropdown'); if (translateDropdown) translateDropdown.classList.remove('active'); } });
document.addEventListener('click', function(e) { if (e.target.id === CONFIG.modalId || (e.target.classList.contains('modal-overlay') && e.target.closest('#video-modal'))) closeVideo(); if (e.target.id === CONFIG.toastContainerId || e.target.classList.contains('toast-close-btn')) closeToast(); if (e.target.id === CONFIG.privacyModalId || (e.target.classList.contains('modal-overlay') && e.target.closest('#privacy-modal')) || e.target.classList.contains('modal-close')) closePrivacyModal(); const translateDropdown = document.getElementById('translate-dropdown'); const translateToggle = document.getElementById('translate-toggle'); if (translateDropdown && translateToggle) { if (!translateDropdown.contains(e.target) && e.target !== translateToggle) translateDropdown.classList.remove('active'); } });

// ==================== 11. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) { backToTopButton.addEventListener('click', function(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

// ==================== 12. BANNER DE COOKIES (LGPD) ====================
function initCookieBanner() { const banner = document.getElementById("lgpd-banner"); const btnAccept = document.getElementById("lgpd-accept"); const btnReject = document.getElementById("lgpd-reject"); if (!banner) return; if (!localStorage.getItem("vitaotub_cookies_accepted")) { setTimeout(() => { banner.classList.add("show"); }, 1000); } if (btnAccept) { btnAccept.onclick = function() { localStorage.setItem("vitaotub_cookies_accepted", "true"); banner.classList.remove("show"); }; } if (btnReject) { btnReject.onclick = function() { banner.classList.remove("show"); }; } }
document.addEventListener("DOMContentLoaded", initCookieBanner);

// ==================== 13. BOTÃO DE TRADUÇÃO FLUTUANTE ====================
function toggleTranslateDropdown() { const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.toggle('active'); }
function translatePage(lang) { if (lang === 'pt') { const select = document.querySelector('.goog-te-combo'); if (select) { select.value = 'pt'; select.dispatchEvent(new Event('change')); setTimeout(() => { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;'; window.location.reload(); }, 300); } else { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;'; window.location.reload(); } const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.remove('active'); return; } setGoogleTranslateCookie(lang); const checkExist = setInterval(() => { const select = document.querySelector('.goog-te-combo'); if (select) { clearInterval(checkExist); select.value = lang; select.dispatchEvent(new Event('change')); const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.remove('active'); updateActiveLanguage(lang); } }, 100); setTimeout(() => { if (!document.querySelector('.goog-te-combo')) window.location.reload(); }, 3000); }
function setGoogleTranslateCookie(lang) { const date = new Date(); date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); const expires = date.toUTCString(); document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = lang === 'pt' ? `googtrans=/pt/pt; expires=${expires}; path=/` : `googtrans=/pt/${lang}; expires=${expires}; path=/`; }
function updateActiveLanguage(lang) { document.querySelectorAll('.translate-option').forEach(btn => { btn.classList.remove('active-lang'); if (btn.getAttribute('data-lang') === lang) btn.classList.add('active-lang'); }); }
function initTranslateWidget() { const toggleBtn = document.getElementById('translate-toggle'); const dropdown = document.getElementById('translate-dropdown'); if (!toggleBtn || !dropdown) return; toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTranslateDropdown(); }); setTimeout(() => { const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/); if (match && match[1]) updateActiveLanguage(match[1]); }, 1500); }
document.addEventListener("DOMContentLoaded", initTranslateWidget);

// ==================== 14. MENU MOBILE (HAMBURGUER) ====================
function toggleMobileMenu() { const menuToggle = document.getElementById('menu-toggle'); const mobileMenu = document.getElementById('mobile-menu'); if (!menuToggle || !mobileMenu) return; const isActive = mobileMenu.classList.contains('active'); if (isActive) { menuToggle.classList.remove('active'); mobileMenu.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); document.body.style.overflow = ''; } else { menuToggle.classList.add('active'); mobileMenu.classList.add('active'); menuToggle.setAttribute('aria-expanded', 'true'); menuToggle.setAttribute('aria-label', 'Fechar menu'); } }
function closeMobileMenu() { const menuToggle = document.getElementById('menu-toggle'); const mobileMenu = document.getElementById('mobile-menu'); if (!menuToggle || !mobileMenu) return; menuToggle.classList.remove('active'); mobileMenu.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); document.body.style.overflow = ''; }
function initMobileMenu() { const menuToggle = document.getElementById('menu-toggle'); if (!menuToggle) return; menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleMobileMenu(); }); document.addEventListener('click', (e) => { const mobileMenu = document.getElementById('mobile-menu'); if (!mobileMenu || !mobileMenu.classList.contains('active')) return; if (!mobileMenu.contains(e.target) && e.target !== menuToggle) closeMobileMenu(); }); window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMobileMenu(); }); }
document.addEventListener("DOMContentLoaded", initMobileMenu);