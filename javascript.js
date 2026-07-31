/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT PRINCIPAL
 * Descrição: Lógica de interações, modais com botão X (✕) e
 * gesto de arraste, PWA com memória, formulário, OneSignal,
 * Service Worker, banner LGPD, botão de tradução arrastável
 * e fechável, botão de tema arrastável e fechável e menu mobile
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

// ==================== 3. SERVICE WORKER E PWA ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => { console.log('Service Worker registrado com sucesso!'); })
            .catch(error => { console.log('Erro ao registrar o Service Worker:', error); });
    });
    navigator.serviceWorker.ready.then(registration => {
        registration.update();
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Nova versão do app disponível. Atualizando...');
                    window.location.reload();
                }
            });
        });
    });
}

// ==================== 4. POPUP DE INSTALAÇÃO DO APP (PWA) COM MEMÓRIA ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const popupContent = document.getElementById('pwa-popup-content');
    const pwaFloatingBtn = document.getElementById('pwa-floating-btn');
    
    if (!pwaPopup || !popupContent) return;
    
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) { localStorage.setItem('vitaotub_pwa_installed', 'true'); pwaPopup.style.display = 'none'; if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; return; }
    
    const jaEntendeu = localStorage.getItem('vitaotub_pwa_entendido');
    const jaInstalou = localStorage.getItem('vitaotub_pwa_installed');
    const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected');
    
    if (!isMobile) {
        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
        if (jaEntendeu) return;
        popupContent.innerHTML = `<h2>📱 App para Celular!</h2><img src="logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img"><p>Este site possui um <strong>App para celular</strong> com notícias, matérias e novidades. Acesse pelo seu próprio celular e o App estará disponível para instalação!</p><button id="pwa-desktop-ok-btn" class="pwa-btn-install">Entendi! 👍</button>`;
        setTimeout(() => { if (!localStorage.getItem('vitaotub_pwa_entendido')) pwaPopup.style.display = 'flex'; }, 2000);
        document.getElementById('pwa-desktop-ok-btn').addEventListener('click', () => { pwaPopup.style.display = 'none'; localStorage.setItem('vitaotub_pwa_entendido', 'true'); });
        return;
    }
    
    if (jaInstalou) { pwaPopup.style.display = 'none'; if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; return; }
    
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if (!jaRejeitou) { popupContent.innerHTML = `<h2>Bem-vindo</h2><img src="logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img"><p>Este site é a apresentação do canal. Se você quiser receber notificações direto no seu celular sobre novos vídeos, lives e artigos exclusivos, instale meu App oficial!</p><button id="pwa-install-btn" class="pwa-btn-install">Instalar App</button><button id="pwa-close-btn" class="pwa-btn-close">Agora não</button>`; pwaPopup.style.display = 'flex';
        document.getElementById('pwa-install-btn').addEventListener('click', async () => { if (deferredPrompt) { pwaPopup.style.display = 'none'; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; } else { localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; } deferredPrompt = null; } });
        document.getElementById('pwa-close-btn').addEventListener('click', () => { pwaPopup.style.display = 'none'; localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; });
        } else if (jaRejeitou && pwaFloatingBtn) { pwaFloatingBtn.style.display = 'flex'; } });
    if (jaRejeitou && pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
    if (!jaRejeitou && !jaInstalou) { setTimeout(() => { if (pwaPopup.style.display !== 'flex' && !localStorage.getItem('vitaotub_pwa_rejected')) { popupContent.innerHTML = `<h2>Bem-vindo</h2><img src="logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img"><p>Este site é a apresentação do canal. Se você quiser receber notificações direto no seu celular sobre novos vídeos, lives e artigos exclusivos, instale meu App oficial!</p><button id="pwa-install-btn" class="pwa-btn-install">Instalar App</button><button id="pwa-close-btn" class="pwa-btn-close">Agora não</button>`; pwaPopup.style.display = 'flex';
        document.getElementById('pwa-install-btn').addEventListener('click', async () => { if (deferredPrompt) { pwaPopup.style.display = 'none'; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; } else { localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; } deferredPrompt = null; } });
        document.getElementById('pwa-close-btn').addEventListener('click', () => { pwaPopup.style.display = 'none'; localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; }); } }, 2000); }
    if (pwaFloatingBtn) { pwaFloatingBtn.addEventListener('click', async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); pwaFloatingBtn.style.display = 'none'; } deferredPrompt = null; } else { alert('Para instalar, acesse as opções do seu navegador ou visite a página do feed.'); } }); }
});

// ==================== 5. CONTROLE DE SCROLL (MODAIS) ====================
let scrollPosition = 0;
function lockScroll() { scrollPosition = window.scrollY; document.body.style.overflow = 'hidden'; }
function unlockScroll() { document.body.style.overflow = ''; window.scrollTo(0, scrollPosition); }

// ==================== 6. ANIMAÇÃO DE ESTATÍSTICAS ====================
const statsObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { const fills = entry.target.querySelectorAll('.demo-bar-fill, .bar-fill'); fills.forEach(fill => { const targetWidth = fill.getAttribute('data-width') || fill.parentElement.getAttribute('data-width') || "100%"; fill.style.width = targetWidth; }); } }); }, { threshold: 0.1 });
document.querySelectorAll('.stat-card, .demo-box, .demo-bar-item').forEach(el => statsObserver.observe(el));

// ==================== 7. SISTEMA DE MODAL DE VÍDEO ====================
function openVideo(videoId) { const modal = document.getElementById(CONFIG.modalId); const target = document.getElementById(CONFIG.iframeTargetId); if (modal && target) { target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`; modal.classList.add('active'); lockScroll(); } }
function closeVideo() { const modal = document.getElementById(CONFIG.modalId); const target = document.getElementById(CONFIG.iframeTargetId); if (modal) { if (target) target.innerHTML = ''; modal.classList.remove('active'); unlockScroll(); } }

// ==================== 8. MODAL DE PRIVACIDADE E TERMOS ====================
async function openPrivacyModal() { await loadModalContent('./politica-de-privacidade.html'); }
async function openTermsModal() { await loadModalContent('./termos-de-uso.html'); }
async function loadModalContent(filePath) { const modal = document.getElementById(CONFIG.privacyModalId); const target = document.getElementById(CONFIG.privacyTargetId); if (modal && target) { modal.style.display = 'flex'; modal.classList.add('active'); lockScroll(); target.innerHTML = '<p>Carregando conteúdo...</p>'; try { const response = await fetch(filePath); if (!response.ok) throw new Error('Arquivo não encontrado'); target.innerHTML = await response.text(); initSwipeToClose(); } catch (error) { target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar o conteúdo.</p><p><a href="${filePath}" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>`; } } }
function closePrivacyModal() { const modal = document.getElementById(CONFIG.privacyModalId); if (modal) { modal.classList.remove('active'); setTimeout(() => { if (!modal.classList.contains('active')) modal.style.display = 'none'; }, 300); unlockScroll(); } const content = document.getElementById('privacy-modal-content'); if (content) { content.style.transform = ''; content.style.opacity = ''; } }
function initSwipeToClose() { const modal = document.getElementById(CONFIG.privacyModalId); const content = document.getElementById('privacy-modal-content'); if (!modal || !content) return; let startX = 0, currentX = 0, isDragging = false; content.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; content.style.transition = 'none'; }, { passive: true }); content.addEventListener('touchmove', (e) => { if (!isDragging) return; currentX = e.touches[0].clientX; const diffX = currentX - startX; if (Math.abs(diffX) > 20) { content.style.transform = `translateX(${diffX}px)`; content.style.opacity = 1 - Math.abs(diffX) / 400; } }, { passive: true }); content.addEventListener('touchend', () => { if (!isDragging) return; isDragging = false; const diffX = currentX - startX; content.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; if (Math.abs(diffX) > 100) { content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; content.style.opacity = '0'; setTimeout(() => { closePrivacyModal(); }, 300); } else { content.style.transform = ''; content.style.opacity = ''; } currentX = 0; }); }

// ==================== 9. PROCESSAMENTO DO FORMULÁRIO DE CONTATO ====================
const contactForm = document.getElementById('contact-form');
if (contactForm) { contactForm.addEventListener('submit', function(e) { e.preventDefault(); const privacyCheck = document.getElementById('privacy-check'); if (!privacyCheck || !privacyCheck.checked) { alert("Por favor, confirme que você leu e concorda com a Política de Privacidade."); return; } const nome = contactForm.querySelector('input[name="nome"]').value; const email = contactForm.querySelector('input[name="email"]').value; const mensagem = contactForm.querySelector('textarea[name="mensagem"]').value; const assunto = encodeURIComponent(`Contato via Site - ${nome}`); const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`); window.location.href = `mailto:vitaotub@gmail.com?subject=${assunto}&body=${corpo}`; const toast = document.getElementById(CONFIG.toastContainerId); if (toast) { toast.classList.add('show'); lockScroll(); } contactForm.reset(); }); }
function closeToast() { const toast = document.getElementById(CONFIG.toastContainerId); if (toast) { toast.classList.remove('show'); unlockScroll(); } }

// ==================== 10. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeVideo(); closeToast(); closePrivacyModal(); closeMobileMenu(); const translateDropdown = document.getElementById('translate-dropdown'); if (translateDropdown) translateDropdown.classList.remove('active'); } });

// ===== CONTROLE DO DROPDOWN DE TRADUÇÃO =====
// Fecha o dropdown ao clicar fora, mas com delay para evitar fechamento acidental
document.addEventListener('click', function(e) {
    const translateDropdown = document.getElementById('translate-dropdown');
    const translateToggle = document.getElementById('translate-toggle');
    
    if (!translateDropdown || !translateToggle) return;
    
    // Se o clique NÃO for no dropdown E NÃO for no botão de toggle
    if (!translateDropdown.contains(e.target) && e.target !== translateToggle) {
        // Pequeno delay para evitar conflitos com o clique no botão
        setTimeout(() => {
            translateDropdown.classList.remove('active');
        }, 150);
    }
});

// ===== TOGGLE DO DROPDOWN COM PREVENÇÃO DE PROPAGAÇÃO =====
function toggleTranslateDropdown(e) {
    if (e) {
        e.stopPropagation(); // Impede que o clique no botão feche o dropdown
        e.preventDefault();
    }
    const dropdown = document.getElementById('translate-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// ==================== 11. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) { backToTopButton.addEventListener('click', function(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

// ==================== 12. BANNER DE COOKIES (LGPD) ====================
function initCookieBanner() { const banner = document.getElementById("lgpd-banner"); const btnAccept = document.getElementById("lgpd-accept"); const btnReject = document.getElementById("lgpd-reject"); if (!banner) return; if (!localStorage.getItem("vitaotub_cookies_accepted")) { setTimeout(() => { banner.classList.add("show"); }, 1000); } if (btnAccept) { btnAccept.onclick = function() { localStorage.setItem("vitaotub_cookies_accepted", "true"); banner.classList.remove("show"); }; } if (btnReject) { btnReject.onclick = function() { banner.classList.remove("show"); }; } }
document.addEventListener("DOMContentLoaded", initCookieBanner);

// ==================== 13. BOTÃO DE TRADUÇÃO FLUTUANTE ====================
function translatePage(lang) {
    if (lang === 'pt') {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'pt';
            select.dispatchEvent(new Event('change'));
            setTimeout(() => {
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;';
                window.location.reload();
            }, 300);
        } else {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;';
            window.location.reload();
        }
        const dropdown = document.getElementById('translate-dropdown');
        if (dropdown) dropdown.classList.remove('active');
        return;
    }
    setGoogleTranslateCookie(lang);
    const checkExist = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            clearInterval(checkExist);
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            const dropdown = document.getElementById('translate-dropdown');
            if (dropdown) dropdown.classList.remove('active');
            updateActiveLanguage(lang);
        }
    }, 100);
    setTimeout(() => {
        if (!document.querySelector('.goog-te-combo')) window.location.reload();
    }, 3000);
}

function setGoogleTranslateCookie(lang) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = date.toUTCString();
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = lang === 'pt' ? `googtrans=/pt/pt; expires=${expires}; path=/` : `googtrans=/pt/${lang}; expires=${expires}; path=/`;
}

function updateActiveLanguage(lang) {
    document.querySelectorAll('.translate-option').forEach(btn => {
        btn.classList.remove('active-lang');
        if (btn.getAttribute('data-lang') === lang) btn.classList.add('active-lang');
    });
}

function initTranslateWidget() {
    const toggleBtn = document.getElementById('translate-toggle');
    const dropdown = document.getElementById('translate-dropdown');
    if (!toggleBtn || !dropdown) return;
    
    // Remove qualquer listener anterior para evitar duplicação
    toggleBtn.removeEventListener('click', toggleTranslateDropdown);
    toggleBtn.addEventListener('click', toggleTranslateDropdown);
    
    setTimeout(() => {
        const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/);
        if (match && match[1]) updateActiveLanguage(match[1]);
    }, 1500);
}

// ==================== 13.5 BOTÃO DE TRADUÇÃO ARRASTÁVEL E FECHÁVEL ====================
function initDraggableTranslate() {
    const widget = document.getElementById('translate-widget');
    const toggleBtn = document.getElementById('translate-toggle');
    if (!widget || !toggleBtn) return;
    if (localStorage.getItem('vitaotub_translate_hidden')) { widget.style.display = 'none'; return; }
    let isDragging = false; let startX, startY, startLeft, startBottom;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'translate-close-btn'; closeBtn.innerHTML = '✕'; closeBtn.title = 'Esconder tradutor';
    closeBtn.style.cssText = 'display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#ff0000;color:#fff;border:none;border-radius:50%;font-size:12px;cursor:pointer;z-index:1000;line-height:1;';
    widget.appendChild(closeBtn);
    toggleBtn.addEventListener('mouseenter', () => { closeBtn.style.display = 'block'; });
    widget.addEventListener('mouseleave', () => { if (!closeBtn.dataset.forced) closeBtn.style.display = 'none'; });
    let clickTimeout;
    toggleBtn.addEventListener('click', (e) => { if (isDragging) return; if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; closeBtn.style.display = 'block'; closeBtn.dataset.forced = 'true'; setTimeout(() => { closeBtn.style.display = 'none'; closeBtn.dataset.forced = ''; }, 3000); } else { clickTimeout = setTimeout(() => { clickTimeout = null; toggleTranslateDropdown(e); }, 300); } });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); widget.style.display = 'none'; localStorage.setItem('vitaotub_translate_hidden', 'true'); });
    toggleBtn.addEventListener('mousedown', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.clientX; startY = e.clientY; const rect = widget.getBoundingClientRect(); startLeft = rect.left; startBottom = window.innerHeight - rect.bottom; widget.style.transition = 'none'; e.preventDefault(); });
    toggleBtn.addEventListener('touchstart', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; const rect = widget.getBoundingClientRect(); startLeft = rect.left; startBottom = window.innerHeight - rect.bottom; widget.style.transition = 'none'; }, { passive: true });
    document.addEventListener('mousemove', (e) => { if (!isDragging) return; widget.style.left = `${startLeft + e.clientX - startX}px`; widget.style.bottom = `${startBottom - (e.clientY - startY)}px`; widget.style.right = 'auto'; widget.style.top = 'auto'; });
    document.addEventListener('touchmove', (e) => { if (!isDragging) return; widget.style.left = `${startLeft + e.touches[0].clientX - startX}px`; widget.style.bottom = `${startBottom - (e.touches[0].clientY - startY)}px`; widget.style.right = 'auto'; widget.style.top = 'auto'; }, { passive: true });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; widget.style.transition = ''; } });
    document.addEventListener('touchend', () => { if (isDragging) { isDragging = false; widget.style.transition = ''; } });
}

// ==================== 14. MENU MOBILE (HAMBURGUER) ====================
function toggleMobileMenu() { const menuToggle = document.getElementById('menu-toggle'); const mobileMenu = document.getElementById('mobile-menu'); if (!menuToggle || !mobileMenu) return; const isActive = mobileMenu.classList.contains('active'); if (isActive) { menuToggle.classList.remove('active'); mobileMenu.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); document.body.style.overflow = ''; } else { menuToggle.classList.add('active'); mobileMenu.classList.add('active'); menuToggle.setAttribute('aria-expanded', 'true'); menuToggle.setAttribute('aria-label', 'Fechar menu'); } }
function closeMobileMenu() { const menuToggle = document.getElementById('menu-toggle'); const mobileMenu = document.getElementById('mobile-menu'); if (!menuToggle || !mobileMenu) return; menuToggle.classList.remove('active'); mobileMenu.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); document.body.style.overflow = ''; }
function initMobileMenu() { const menuToggle = document.getElementById('menu-toggle'); if (!menuToggle) return; menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleMobileMenu(); }); document.addEventListener('click', (e) => { const mobileMenu = document.getElementById('mobile-menu'); if (!mobileMenu || !mobileMenu.classList.contains('active')) return; if (!mobileMenu.contains(e.target) && e.target !== menuToggle) closeMobileMenu(); }); window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMobileMenu(); }); }
document.addEventListener("DOMContentLoaded", initMobileMenu);

// ==================== 15. BOTÃO DE TEMA (CLARO/ESCURO) ====================
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('vitaotub_theme', 'light');
        if (themeBtn) { themeBtn.innerHTML = '🌙'; themeBtn.title = 'Mudar para modo escuro'; }
    } else {
        localStorage.setItem('vitaotub_theme', 'dark');
        if (themeBtn) { themeBtn.innerHTML = '☀️'; themeBtn.title = 'Mudar para modo claro'; }
    }
}

function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    const savedTheme = localStorage.getItem('vitaotub_theme');
    if (savedTheme === 'light') { document.body.classList.add('light-mode'); themeBtn.innerHTML = '🌙'; themeBtn.title = 'Mudar para modo escuro'; }
    else { themeBtn.innerHTML = '☀️'; themeBtn.title = 'Mudar para modo claro'; }
}

// ==================== 15.5 BOTÃO DE TEMA ARRASTÁVEL E FECHÁVEL ====================
function initDraggableTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    if (localStorage.getItem('vitaotub_theme_hidden')) { themeBtn.style.display = 'none'; return; }
    let isDragging = false; let startX, startY, startTop, startRight;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'theme-close-btn'; closeBtn.innerHTML = '✕'; closeBtn.title = 'Esconder botão de tema';
    closeBtn.style.cssText = 'display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#ff0000;color:#fff;border:none;border-radius:50%;font-size:12px;cursor:pointer;z-index:1000;line-height:1;';
    themeBtn.appendChild(closeBtn);
    themeBtn.addEventListener('mouseenter', () => { closeBtn.style.display = 'block'; });
    themeBtn.addEventListener('mouseleave', () => { if (!closeBtn.dataset.forced) closeBtn.style.display = 'none'; });
    let clickTimeout;
    themeBtn.addEventListener('click', (e) => { if (isDragging) return; if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; closeBtn.style.display = 'block'; closeBtn.dataset.forced = 'true'; setTimeout(() => { closeBtn.style.display = 'none'; closeBtn.dataset.forced = ''; }, 3000); } else { clickTimeout = setTimeout(() => { clickTimeout = null; toggleTheme(); }, 300); } });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); themeBtn.style.display = 'none'; localStorage.setItem('vitaotub_theme_hidden', 'true'); });
    themeBtn.addEventListener('mousedown', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.clientX; startY = e.clientY; const rect = themeBtn.getBoundingClientRect(); startTop = rect.top; startRight = window.innerWidth - rect.right; themeBtn.style.transition = 'none'; e.preventDefault(); });
    themeBtn.addEventListener('touchstart', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; const rect = themeBtn.getBoundingClientRect(); startTop = rect.top; startRight = window.innerWidth - rect.right; themeBtn.style.transition = 'none'; }, { passive: true });
    document.addEventListener('mousemove', (e) => { if (!isDragging) return; themeBtn.style.top = `${startTop + e.clientY - startY}px`; themeBtn.style.right = `${startRight - (e.clientX - startX)}px`; themeBtn.style.left = 'auto'; themeBtn.style.bottom = 'auto'; });
    document.addEventListener('touchmove', (e) => { if (!isDragging) return; themeBtn.style.top = `${startTop + e.touches[0].clientY - startY}px`; themeBtn.style.right = `${startRight - (e.touches[0].clientX - startX)}px`; themeBtn.style.left = 'auto'; themeBtn.style.bottom = 'auto'; }, { passive: true });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; themeBtn.style.transition = ''; } });
    document.addEventListener('touchend', () => { if (isDragging) { isDragging = false; themeBtn.style.transition = ''; } });
}

// ==================== 16. INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => { initTranslateWidget(); initDraggableTranslate(); initThemeToggle(); initDraggableTheme(); });