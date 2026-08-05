/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT UNIFICADO
 * Descrição: Lógica completa do site principal, bio, projetos
 * e feed (PWA) com modais, formulário, PWA, tema, tradução,
 * carregamento de vídeos e artigos
 * Versão: 3.2 - Scroll infinito corrigido + limpeza de memória ao trocar de aba
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES GERAIS ====================
const CONFIG = {
    modalId: 'video-modal',
    iframeTargetId: 'modal-iframe-target',
    toastContainerId: 'toast-container',
    privacyModalId: 'privacy-modal',
    privacyTargetId: 'privacy-content-target',
    scriptURL: 'https://script.google.com/macros/s/AKfycbwOnJ8aLNMfbOss06eRh_glZRNULpJ3j9HqeL7PCGPDfr80_vcCB5-hLEHkDddO-LFrqA/exec',
    channelID: 'UCUNyU0HewM1JQVVKMAEAfyQ',
    artigosFiles: ['artigos.html'],
    artigosPorVez: 20,
    artigosIncremento: 10,
    videosPorLote: 20
};

// ==================== 2. UTILITÁRIOS ====================
function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ==================== 3. SERVICE WORKER COM AUTO-UPDATE ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso!');
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 Nova versão do app disponível!');
                            if (confirm('🚀 Uma nova versão do app está disponível! Deseja atualizar agora?')) {
                                newWorker.postMessage({ action: 'skipWaiting' });
                                window.location.reload();
                            }
                        }
                    });
                });
                setInterval(() => { registration.update(); }, 30 * 60 * 1000);
                document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') registration.update(); });
            })
            .catch(error => console.log('Erro ao registrar o Service Worker:', error));
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

// ==================== 4. POPUP DE INSTALAÇÃO PWA (SITE PRINCIPAL) ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const popupContent = document.getElementById('pwa-popup-content');
    const pwaFloatingBtn = document.getElementById('pwa-floating-btn');
    
    if (!pwaPopup || !popupContent) return;
    
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) { 
        localStorage.setItem('vitaotub_pwa_installed', 'true'); 
        pwaPopup.style.display = 'none'; 
        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; 
        return; 
    }
    
    const jaEntendeu = localStorage.getItem('vitaotub_pwa_entendido');
    const jaInstalou = localStorage.getItem('vitaotub_pwa_installed');
    const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected');
    
    if (!isMobile) {
        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
        if (jaEntendeu) return;
        popupContent.innerHTML = `<h2>📱 App para Celular!</h2><img src="../logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img" onerror="this.style.display='none'"><p>Este site possui um <strong>App para celular</strong> com notícias, matérias e novidades. Acesse pelo seu próprio celular e o App estará disponível para instalação!</p><button id="pwa-desktop-ok-btn" class="pwa-btn-install">Entendi! 👍</button>`;
        setTimeout(() => { if (!localStorage.getItem('vitaotub_pwa_entendido')) pwaPopup.style.display = 'flex'; }, 2000);
        document.getElementById('pwa-desktop-ok-btn').addEventListener('click', () => { pwaPopup.style.display = 'none'; localStorage.setItem('vitaotub_pwa_entendido', 'true'); });
        return;
    }
    
    if (jaInstalou) { pwaPopup.style.display = 'none'; if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; return; }
    
    function preencherPopup(mensagem) {
        if (!popupContent) return;
        popupContent.innerHTML = mensagem;
    }
    
    function mostrarPopupPadrao() {
        if (jaRejeitou) {
            if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
            return;
        }
        preencherPopup(`
            <h2>Bem-Vindo!</h2>
            <img src="../logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img" onerror="this.style.display='none'">
            <p>Este site é a apresentação do canal. Se você quiser receber notificações direto no seu celular sobre novos vídeos, lives e artigos exclusivos, instale meu App oficial!</p>
            <button id="pwa-install-btn" class="pwa-btn-install">Instalar App</button>
            <button id="pwa-close-btn" class="pwa-btn-close">Agora não</button>
        `);
        pwaPopup.style.display = 'flex';
        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                pwaPopup.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('vitaotub_pwa_installed', 'true');
                    localStorage.removeItem('vitaotub_pwa_rejected');
                    if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
                } else {
                    localStorage.setItem('vitaotub_pwa_rejected', 'true');
                    if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
                }
                deferredPrompt = null;
            } else {
                alert('Para instalar, acesse as opções do seu navegador e selecione "Adicionar à tela inicial".');
                localStorage.setItem('vitaotub_pwa_rejected', 'true');
                pwaPopup.style.display = 'none';
                if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
            }
        });
        document.getElementById('pwa-close-btn').addEventListener('click', () => {
            pwaPopup.style.display = 'none';
            localStorage.setItem('vitaotub_pwa_rejected', 'true');
            if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
        });
    }
    
    let deferredPrompt = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log("beforeinstallprompt capturado!");
        if (!jaRejeitou) {
            preencherPopup(`
                <h2>Bem-Vindo!</h2>
                <img src="../logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img" onerror="this.style.display='none'">
                <p>Este site é a apresentação do canal. Se você quiser receber notificações direto no seu celular sobre novos vídeos, lives e artigos exclusivos, instale meu App oficial!</p>
                <button id="pwa-install-btn" class="pwa-btn-install">Instalar App</button>
                <button id="pwa-close-btn" class="pwa-btn-close">Agora não</button>
            `);
            pwaPopup.style.display = 'flex';
            document.getElementById('pwa-install-btn').addEventListener('click', async () => {
                if (deferredPrompt) {
                    pwaPopup.style.display = 'none';
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        localStorage.setItem('vitaotub_pwa_installed', 'true');
                        localStorage.removeItem('vitaotub_pwa_rejected');
                        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
                    } else {
                        localStorage.setItem('vitaotub_pwa_rejected', 'true');
                        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
                    }
                    deferredPrompt = null;
                }
            });
            document.getElementById('pwa-close-btn').addEventListener('click', () => {
                pwaPopup.style.display = 'none';
                localStorage.setItem('vitaotub_pwa_rejected', 'true');
                if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
            });
        } else if (jaRejeitou && pwaFloatingBtn) {
            pwaFloatingBtn.style.display = 'flex';
        }
    });
    
    if (jaRejeitou && pwaFloatingBtn) {
        pwaFloatingBtn.style.display = 'flex';
    }
    
    if (!jaRejeitou && !jaInstalou) {
        setTimeout(() => {
            if (pwaPopup.style.display !== 'flex' && !localStorage.getItem('vitaotub_pwa_rejected')) {
                console.log("Mostrando popup padrão (beforeinstallprompt não disparou)");
                mostrarPopupPadrao();
            }
        }, 3000);
    }
    
    if (pwaFloatingBtn) {
        pwaFloatingBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('vitaotub_pwa_installed', 'true');
                    localStorage.removeItem('vitaotub_pwa_rejected');
                    pwaFloatingBtn.style.display = 'none';
                }
                deferredPrompt = null;
            } else {
                alert('Para instalar, acesse as opções do seu navegador e selecione "Adicionar à tela inicial".');
            }
        });
    }
});

// ==================== 5. CONTROLE DE SCROLL (MODAIS) ====================
let scrollPosition = 0;
function lockScroll() { scrollPosition = window.scrollY; document.body.style.overflow = 'hidden'; }
function unlockScroll() { document.body.style.overflow = ''; window.scrollTo(0, scrollPosition); }

// ==================== 6. ANIMAÇÃO DE ESTATÍSTICAS ====================
const statsObserver = new IntersectionObserver((entries) => { 
    entries.forEach(entry => { 
        if (entry.isIntersecting) { 
            const fills = entry.target.querySelectorAll('.demo-bar-fill, .bar-fill'); 
            fills.forEach(fill => { 
                const targetWidth = fill.getAttribute('data-width') || fill.parentElement.getAttribute('data-width') || "100%"; 
                fill.style.width = targetWidth; 
            }); 
        } 
    }); 
}, { threshold: 0.1 });
document.querySelectorAll('.stat-card, .demo-box, .demo-bar-item').forEach(el => statsObserver.observe(el));

// ==================== 7. SISTEMA DE MODAL DE VÍDEO ====================
function openVideo(videoId) { 
    const modal = document.getElementById(CONFIG.modalId); 
    const target = document.getElementById(CONFIG.iframeTargetId); 
    if (modal && target) { 
        target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`; 
        modal.classList.add('active'); 
        lockScroll(); 
    } 
}
function closeVideo() { 
    const modal = document.getElementById(CONFIG.modalId); 
    const target = document.getElementById(CONFIG.iframeTargetId); 
    if (modal) { 
        if (target) target.innerHTML = ''; 
        modal.classList.remove('active'); 
        unlockScroll(); 
    } 
}

// ==================== 8. MODAL DE PRIVACIDADE E TERMOS ====================
async function openPrivacyModal() { await loadModalContent('./politica-de-privacidade.html'); }
async function openTermsModal() { await loadModalContent('./termos-de-uso.html'); }
async function loadModalContent(filePath) { 
    const modal = document.getElementById(CONFIG.privacyModalId); 
    const target = document.getElementById(CONFIG.privacyTargetId); 
    if (modal && target) { 
        modal.style.display = 'flex'; 
        modal.classList.add('active'); 
        lockScroll(); 
        target.innerHTML = '<p>Carregando conteúdo...</p>'; 
        try { 
            const response = await fetch(filePath); 
            if (!response.ok) throw new Error('Arquivo não encontrado'); 
            target.innerHTML = await response.text(); 
            initSwipeToClose(); 
        } catch (error) { 
            target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar o conteúdo.</p><p><a href="${filePath}" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>`; 
        } 
    } 
}
function closePrivacyModal() { 
    const modal = document.getElementById(CONFIG.privacyModalId); 
    if (modal) { 
        modal.classList.remove('active'); 
        setTimeout(() => { if (!modal.classList.contains('active')) modal.style.display = 'none'; }, 300); 
        unlockScroll(); 
    } 
    const content = document.getElementById('privacy-modal-content'); 
    if (content) { content.style.transform = ''; content.style.opacity = ''; } 
}
function initSwipeToClose() { 
    const modal = document.getElementById(CONFIG.privacyModalId); 
    const content = document.getElementById('privacy-modal-content'); 
    if (!modal || !content) return; 
    let startX = 0, currentX = 0, isDragging = false; 
    content.addEventListener('touchstart', (e) => { 
        startX = e.touches[0].clientX; 
        isDragging = true; 
        content.style.transition = 'none'; 
    }, { passive: true }); 
    content.addEventListener('touchmove', (e) => { 
        if (!isDragging) return; 
        currentX = e.touches[0].clientX; 
        const diffX = currentX - startX; 
        if (Math.abs(diffX) > 20) { 
            content.style.transform = `translateX(${diffX}px)`; 
            content.style.opacity = 1 - Math.abs(diffX) / 400; 
        } 
    }, { passive: true }); 
    content.addEventListener('touchend', () => { 
        if (!isDragging) return; 
        isDragging = false; 
        const diffX = currentX - startX; 
        content.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; 
        if (Math.abs(diffX) > 100) { 
            content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; 
            content.style.opacity = '0'; 
            setTimeout(() => { closePrivacyModal(); }, 300); 
        } else { 
            content.style.transform = ''; 
            content.style.opacity = ''; 
        } 
        currentX = 0; 
    }); 
}

// ==================== 9. PROCESSAMENTO DO FORMULÁRIO DE CONTATO ====================
const contactForm = document.getElementById('contact-form');
if (contactForm) { 
    contactForm.addEventListener('submit', function(e) { 
        e.preventDefault(); 
        const privacyCheck = document.getElementById('privacy-check'); 
        if (!privacyCheck || !privacyCheck.checked) { 
            alert("Por favor, confirme que você leu e concorda com a Política de Privacidade."); 
            return; 
        } 
        const nome = contactForm.querySelector('input[name="nome"]').value; 
        const email = contactForm.querySelector('input[name="email"]').value; 
        const mensagem = contactForm.querySelector('textarea[name="mensagem"]').value; 
        const assunto = encodeURIComponent(`Contato via Site - ${nome}`); 
        const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`); 
        window.location.href = `mailto:vitaotub@gmail.com?subject=${assunto}&body=${corpo}`; 
        const toast = document.getElementById(CONFIG.toastContainerId); 
        if (toast) { toast.classList.add('show'); lockScroll(); } 
        contactForm.reset(); 
    }); 
}
function closeToast() { 
    const toast = document.getElementById(CONFIG.toastContainerId); 
    if (toast) { toast.classList.remove('show'); unlockScroll(); } 
}

// ==================== 10. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') { 
        closeVideo(); 
        closeToast(); 
        closePrivacyModal(); 
        closeMobileMenu(); 
        fecharArtigoFullscreen(); 
        fecharVideoModal(); 
        fecharProjetoModal(); 
        fecharProjetoModalFeed();
        const translateDropdown = document.getElementById('translate-dropdown'); 
        if (translateDropdown) translateDropdown.classList.remove('active'); 
    } 
});

// ===== CONTROLE DO DROPDOWN DE TRADUÇÃO =====
document.addEventListener('click', function(e) {
    const translateDropdown = document.getElementById('translate-dropdown');
    const translateToggle = document.getElementById('translate-toggle');
    if (!translateDropdown || !translateToggle) return;
    if (!translateDropdown.contains(e.target) && e.target !== translateToggle) {
        setTimeout(() => {
            translateDropdown.classList.remove('active');
        }, 150);
    }
});

function toggleTranslateDropdown(e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const dropdown = document.getElementById('translate-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// ==================== 11. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) { 
    backToTopButton.addEventListener('click', function(e) { 
        e.preventDefault(); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }); 
}

// ==================== 12. BANNER DE COOKIES (LGPD) ====================
function initCookieBanner() { 
    const banner = document.getElementById("lgpd-banner"); 
    const btnAccept = document.getElementById("lgpd-accept"); 
    const btnReject = document.getElementById("lgpd-reject"); 
    if (!banner) return; 
    if (!localStorage.getItem("vitaotub_cookies_accepted")) { 
        setTimeout(() => { banner.classList.add("show"); }, 1000); 
    } 
    if (btnAccept) { 
        btnAccept.onclick = function() { 
            localStorage.setItem("vitaotub_cookies_accepted", "true"); 
            banner.classList.remove("show"); 
        }; 
    } 
    if (btnReject) { 
        btnReject.onclick = function() { 
            banner.classList.remove("show"); 
        }; 
    } 
}
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
    toggleBtn.removeEventListener('click', toggleTranslateDropdown);
    toggleBtn.addEventListener('click', toggleTranslateDropdown);
    setTimeout(() => {
        const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/);
        if (match && match[1]) updateActiveLanguage(match[1]);
    }, 1500);
}

// ==================== 14. BOTÃO DE TRADUÇÃO ARRASTÁVEL ====================
function initDraggableTranslate() {
    const widget = document.getElementById('translate-widget');
    const toggleBtn = document.getElementById('translate-toggle');
    if (!widget || !toggleBtn) return;
    if (localStorage.getItem('vitaotub_translate_hidden')) { widget.style.display = 'none'; return; }
    
    let isDragging = false;
    let hasDragged = false;
    let startX, startY, startLeft, startBottom;
    let dragTimeout = null;
    
    toggleBtn.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = widget.getBoundingClientRect();
        startLeft = rect.left;
        startBottom = window.innerHeight - rect.bottom;
        widget.style.transition = 'none';
        e.preventDefault();
    });
    
    toggleBtn.addEventListener('touchstart', (e) => {
        isDragging = true;
        hasDragged = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        const rect = widget.getBoundingClientRect();
        startLeft = rect.left;
        startBottom = window.innerHeight - rect.bottom;
        widget.style.transition = 'none';
    }, { passive: true });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        hasDragged = true;
        widget.style.left = `${startLeft + e.clientX - startX}px`;
        widget.style.bottom = `${startBottom - (e.clientY - startY)}px`;
        widget.style.right = 'auto';
        widget.style.top = 'auto';
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        hasDragged = true;
        widget.style.left = `${startLeft + e.touches[0].clientX - startX}px`;
        widget.style.bottom = `${startBottom - (e.touches[0].clientY - startY)}px`;
        widget.style.right = 'auto';
        widget.style.top = 'auto';
    }, { passive: true });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            widget.style.transition = '';
            clearTimeout(dragTimeout);
            dragTimeout = setTimeout(() => {
                hasDragged = false;
            }, 150);
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            widget.style.transition = '';
            clearTimeout(dragTimeout);
            dragTimeout = setTimeout(() => {
                hasDragged = false;
            }, 150);
        }
    });
    
    // === CLIQUE ===
    toggleBtn.addEventListener('click', function(e) {
        if (hasDragged) {
            hasDragged = false;
            return;
        }
        toggleTranslateDropdown(e);
    });
}

// ==================== 15. MENU MOBILE (HAMBURGUER) ====================
function toggleMobileMenu() { 
    const menuToggle = document.getElementById('menu-toggle'); 
    const mobileMenu = document.getElementById('mobile-menu'); 
    if (!menuToggle || !mobileMenu) return; 
    const isActive = mobileMenu.classList.contains('active'); 
    if (isActive) { 
        menuToggle.classList.remove('active'); 
        mobileMenu.classList.remove('active'); 
        menuToggle.setAttribute('aria-expanded', 'false'); 
        menuToggle.setAttribute('aria-label', 'Abrir menu'); 
        document.body.style.overflow = ''; 
    } else { 
        menuToggle.classList.add('active'); 
        mobileMenu.classList.add('active'); 
        menuToggle.setAttribute('aria-expanded', 'true'); 
        menuToggle.setAttribute('aria-label', 'Fechar menu'); 
    } 
}
function closeMobileMenu() { 
    const menuToggle = document.getElementById('menu-toggle'); 
    const mobileMenu = document.getElementById('mobile-menu'); 
    if (!menuToggle || !mobileMenu) return; 
    menuToggle.classList.remove('active'); 
    mobileMenu.classList.remove('active'); 
    menuToggle.setAttribute('aria-expanded', 'false'); 
    menuToggle.setAttribute('aria-label', 'Abrir menu'); 
    document.body.style.overflow = ''; 
}
function initMobileMenu() { 
    const menuToggle = document.getElementById('menu-toggle'); 
    if (!menuToggle) return; 
    menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleMobileMenu(); }); 
    document.addEventListener('click', (e) => { 
        const mobileMenu = document.getElementById('mobile-menu'); 
        if (!mobileMenu || !mobileMenu.classList.contains('active')) return; 
        if (!mobileMenu.contains(e.target) && e.target !== menuToggle) closeMobileMenu(); 
    }); 
    window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMobileMenu(); }); 
}
document.addEventListener("DOMContentLoaded", initMobileMenu);

// ==================== 16. BOTÃO DE TEMA (CLARO/ESCURO) ====================
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

// ==================== 17. BOTÃO DE TEMA ARRASTÁVEL ====================
function initDraggableTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) {
        console.warn('⚠️ Botão de tema não encontrado!');
        return;
    }
    console.log('✅ Botão de tema encontrado!');
    
    if (localStorage.getItem('vitaotub_theme_hidden')) { 
        themeBtn.style.display = 'none'; 
        return; 
    }
    
    // === LÓGICA DE ARRASTE ===
    let isDragging = false;
    let hasDragged = false;
    let startX, startY, startTop, startRight;
    let dragTimeout = null;
    
    themeBtn.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = themeBtn.getBoundingClientRect();
        startTop = rect.top;
        startRight = window.innerWidth - rect.right;
        themeBtn.style.transition = 'none';
        e.preventDefault();
    });
    
    themeBtn.addEventListener('touchstart', (e) => {
        isDragging = true;
        hasDragged = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        const rect = themeBtn.getBoundingClientRect();
        startTop = rect.top;
        startRight = window.innerWidth - rect.right;
        themeBtn.style.transition = 'none';
    }, { passive: true });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        hasDragged = true;
        themeBtn.style.top = `${startTop + e.clientY - startY}px`;
        themeBtn.style.right = `${startRight - (e.clientX - startX)}px`;
        themeBtn.style.left = 'auto';
        themeBtn.style.bottom = 'auto';
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        hasDragged = true;
        themeBtn.style.top = `${startTop + e.touches[0].clientY - startY}px`;
        themeBtn.style.right = `${startRight - (e.touches[0].clientX - startX)}px`;
        themeBtn.style.left = 'auto';
        themeBtn.style.bottom = 'auto';
    }, { passive: true });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            themeBtn.style.transition = '';
            clearTimeout(dragTimeout);
            dragTimeout = setTimeout(() => {
                hasDragged = false;
            }, 150);
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            themeBtn.style.transition = '';
            clearTimeout(dragTimeout);
            dragTimeout = setTimeout(() => {
                hasDragged = false;
            }, 150);
        }
    });
    
    // === CLIQUE ===
    themeBtn.addEventListener('click', function(e) {
        if (hasDragged) {
            hasDragged = false;
            return;
        }
        toggleTheme();
    });
}

// ==================== 18. MODAL DE PROJETOS (SITE PRINCIPAL) ====================
const projetosFiles = {
    1: 'projetos/projeto-1.html',
    2: 'projetos/projeto-2.html',
    3: 'projetos/projeto-3.html',
    4: 'projetos/projeto-4.html',
    5: 'projetos/projeto-5.html'
};

function openProjectModal(projectId) {
    const modal = document.getElementById('project-modal');
    const body = document.getElementById('project-modal-body');
    if (!modal || !body) return;
    document.body.style.overflow = 'hidden';
    const filePath = projetosFiles[projectId];
    if (!filePath) { body.innerHTML = '<p>Projeto não encontrado.</p>'; return; }
    body.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-dim);">Carregando...</p>';
    modal.classList.add('active');
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error('Arquivo não encontrado');
            return response.text();
        })
        .then(html => {
            body.innerHTML = html;
            initProjectSwipeToClose();
        })
        .catch(error => {
            body.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-dim);">Erro ao carregar o projeto. Tente novamente mais tarde.</p>`;
            console.error('Erro ao carregar projeto:', error);
        });
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initProjectSwipeToClose() {
    const modal = document.getElementById('project-modal');
    const content = document.querySelector('.project-modal-content');
    if (!modal || !content) return;
    let startX = 0, currentX = 0, isDragging = false;
    content.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        content.style.transition = 'none';
    }, { passive: true });
    content.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        if (Math.abs(diffX) > 20) {
            content.style.transform = `translateX(${diffX}px)`;
            content.style.opacity = 1 - Math.abs(diffX) / 400;
        }
    }, { passive: true });
    content.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX;
        content.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        if (Math.abs(diffX) > 100) {
            content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)';
            content.style.opacity = '0';
            setTimeout(() => { closeProjectModal(); content.style.transform = ''; content.style.opacity = ''; }, 300);
        } else {
            content.style.transform = '';
            content.style.opacity = '';
        }
        currentX = 0;
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeProjectModal(); }
});

document.addEventListener('click', function(e) {
    const modal = document.getElementById('project-modal');
    const content = document.querySelector('.project-modal-content');
    if (modal && modal.classList.contains('active') && content) {
        if (e.target === modal || e.target.classList.contains('project-modal-overlay')) {
            closeProjectModal();
        }
    }
});

// ==================== 19. FEED - NAVEGAÇÃO POR ABAS ====================
function mudarAba(aba) {
    const btnVideos = document.getElementById('btn-tab-videos');
    const btnArtigos = document.getElementById('btn-tab-artigos');
    const btnProjetos = document.getElementById('btn-tab-projetos');
    const btnSobre = document.getElementById('btn-tab-sobre');
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');
    const secaoProjetos = document.getElementById('secao-projetos');
    const secaoSobre = document.getElementById('secao-sobre');
    
    if (secaoVideos) secaoVideos.style.display = 'none';
    if (secaoArtigos) secaoArtigos.style.display = 'none';
    if (secaoProjetos) secaoProjetos.style.display = 'none';
    if (secaoSobre) secaoSobre.style.display = 'none';
    
    if (btnVideos) { btnVideos.classList.remove('active'); btnVideos.setAttribute('aria-pressed', 'false'); }
    if (btnArtigos) { btnArtigos.classList.remove('active'); btnArtigos.setAttribute('aria-pressed', 'false'); }
    if (btnProjetos) { btnProjetos.classList.remove('active'); btnProjetos.setAttribute('aria-pressed', 'false'); }
    if (btnSobre) { btnSobre.classList.remove('active'); btnSobre.setAttribute('aria-pressed', 'false'); }
    
    if (aba === 'videos') {
        if (btnVideos) { btnVideos.classList.add('active'); btnVideos.setAttribute('aria-pressed', 'true'); }
        if (secaoVideos) secaoVideos.style.display = 'block';
    } else if (aba === 'artigos') {
        if (btnArtigos) { btnArtigos.classList.add('active'); btnArtigos.setAttribute('aria-pressed', 'true'); }
        if (secaoArtigos) secaoArtigos.style.display = 'block';
        if (!artigosCarregados) carregarTodosArtigos();
    } else if (aba === 'projetos') {
        if (btnProjetos) { btnProjetos.classList.add('active'); btnProjetos.setAttribute('aria-pressed', 'true'); }
        if (secaoProjetos) secaoProjetos.style.display = 'block';
        if (!projetosCarregados) carregarProjetos();
    } else if (aba === 'sobre') {
        if (btnSobre) { btnSobre.classList.add('active'); btnSobre.setAttribute('aria-pressed', 'true'); }
        if (secaoSobre) secaoSobre.style.display = 'block';
    }
}

// ==================== 20. FEED - CARREGAR PROJETOS ====================
let projetosCarregados = false;

async function carregarProjetos() {
    const container = document.getElementById('projetos-feed-container');
    if (!container) return;
    
    const projetos = [
        { id: 1, nome: 'VitãoTub', plataforma: 'YouTube', descricao: 'Canal principal de tecnologia, segurança digital e games.', link: 'https://www.youtube.com/@vitaotub?sub_confirmation=1', imagem: '../projeto-001.jpg' },
        { id: 2, nome: 'Tutorials Insolentes', plataforma: 'YouTube', descricao: 'Canal secundário com tutoriais e dicas rápidas.', link: 'https://www.youtube.com/@tutoriaisinsolentes?sub_confirmation=1', imagem: '../projeto-002.jpg' },
        { id: 3, nome: 'Fedora Only Fans (FOF)', plataforma: 'GitHub', descricao: 'Aplicativo para tornar o Fedora Linux mais prático.', link: 'https://github.com/vitaotub/fedora-only-fans', imagem: '../projeto-003.jpg' },
        { id: 4, nome: 'Site VitãoTub', plataforma: 'GitHub', descricao: 'Site oficial com HTML, CSS e JavaScript puro.', link: 'https://github.com/vitaotub/vtub-site', imagem: '../projeto-004.jpg' },
        { id: 5, nome: 'WebApp VitãoTub', plataforma: 'GitHub', descricao: 'PWA com feed de vídeos e artigos.', link: 'https://github.com/vitaotub/vtub-app', imagem: '../projeto-005.jpg' }
    ];
    
    container.innerHTML = '';
    projetos.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'projeto-card-feed';
        card.onclick = function() { openProjectModalFeed(proj.id); };
        const isYoutube = proj.plataforma === 'YouTube';
        const platformClass = isYoutube ? 'platform-youtube' : 'platform-github';
        const platformIcon = isYoutube
            ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
            : '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
        card.innerHTML = `
            <div class="projeto-card-feed-image"><img src="${proj.imagem}" alt="${proj.nome}" loading="lazy"></div>
            <div class="projeto-card-feed-info">
                <h4 class="projeto-card-feed-nome">${proj.nome}</h4>
                <span class="projeto-card-feed-platform ${platformClass}">${platformIcon} ${proj.plataforma}</span>
                <p class="projeto-card-feed-descricao">${proj.descricao}</p>
                <a href="${proj.link}" target="_blank" rel="noopener" class="projeto-card-feed-link" onclick="event.stopPropagation();">Ver Projeto</a>
            </div>
        `;
        container.appendChild(card);
    });
    projetosCarregados = true;
}

// ==================== 21. FEED - MODAL DE PROJETOS ====================
function openProjectModalFeed(projectId) {
    const projetos = [
        { id: 1, nome: 'VitãoTub', plataforma: 'YouTube', descricao: 'Canal principal de tecnologia, segurança digital e games. Conteúdo diário sobre hardware, software, dicas de segurança e muito mais.', link: 'https://www.youtube.com/@vitaotub?sub_confirmation=1', imagem: '../projeto-001.jpg', inscritos: '16 mil+', videos: '200+' },
        { id: 2, nome: 'Tutorials Insolentes', plataforma: 'YouTube', descricao: 'Canal secundário com tutoriais e dicas rápidas para resolver problemas específicos de tecnologia.', link: 'https://www.youtube.com/@tutoriaisinsolentes?sub_confirmation=1', imagem: '../projeto-002.jpg', inscritos: '1 mil+', videos: '50+' },
        { id: 3, nome: 'Fedora Only Fans (FOF)', plataforma: 'GitHub', descricao: 'Aplicativo para tornar o Fedora Linux mais prático e acessível para usuários iniciantes e avançados.', link: 'https://github.com/vitaotub/fedora-only-fans', imagem: '../projeto-003.jpg', linguagem: 'Python', stars: '15' },
        { id: 4, nome: 'Site VitãoTub', plataforma: 'GitHub', descricao: 'Site oficial do canal com HTML, CSS e JavaScript puro. Design responsivo e otimizado para SEO.', link: 'https://github.com/vitaotub/vtub-site', imagem: '../projeto-004.jpg', linguagem: 'HTML/CSS/JS', stars: '8' },
        { id: 5, nome: 'WebApp VitãoTub', plataforma: 'GitHub', descricao: 'PWA com feed de vídeos e artigos, instalável em dispositivos móveis para acesso offline.', link: 'https://github.com/vitaotub/vtub-app', imagem: '../projeto-005.jpg', linguagem: 'HTML/CSS/JS', stars: '12' }
    ];
    
    const projeto = projetos.find(p => p.id === projectId);
    if (!projeto) return;
    
    const modalAntigo = document.getElementById('projeto-modal-feed');
    if (modalAntigo) modalAntigo.remove();
    
    const modal = document.createElement('div');
    modal.id = 'projeto-modal-feed';
    modal.className = 'projeto-modal-overlay-feed';
    
    const isYoutube = projeto.plataforma === 'YouTube';
    const platformIcon = isYoutube ? '<i class="fa-brands fa-youtube"></i>' : '<i class="fa-brands fa-github"></i>';
    
    modal.innerHTML = `
        <div class="projeto-modal-content-feed">
            <button class="projeto-modal-close-feed" onclick="fecharProjetoModalFeed()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
            <div class="projeto-modal-body-feed">
                <div class="projeto-modal-imagem-feed"><img src="${projeto.imagem}" alt="${projeto.nome}" loading="lazy" onerror="this.style.display='none'"></div>
                <h2 class="projeto-modal-titulo-feed">${projeto.nome}</h2>
                <div class="projeto-modal-platform-feed">${platformIcon} ${projeto.plataforma}</div>
                <p class="projeto-modal-descricao-feed">${projeto.descricao}</p>
                <div class="projeto-modal-info-feed">
                    ${projeto.inscritos ? `<span class="projeto-modal-tag-feed">📺 ${projeto.inscritos} inscritos</span>` : ''}
                    ${projeto.videos ? `<span class="projeto-modal-tag-feed">🎬 ${projeto.videos} vídeos</span>` : ''}
                    ${projeto.linguagem ? `<span class="projeto-modal-tag-feed">💻 ${projeto.linguagem}</span>` : ''}
                    ${projeto.stars ? `<span class="projeto-modal-tag-feed">⭐ ${projeto.stars} stars</span>` : ''}
                </div>
                <div class="projeto-modal-link-wrapper-feed">
                    <a href="${projeto.link}" target="_blank" rel="noopener" class="projeto-modal-link-feed">${isYoutube ? '▶️ Visitar Canal' : '🔗 Ver no GitHub'}</a>
                </div>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) { if (e.target === modal) fecharProjetoModalFeed(); });
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }, 50);
}

function fecharProjetoModalFeed() {
    const modal = document.getElementById('projeto-modal-feed');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => modal.remove(), 300);
    }
}

// ==================== 22. FEED - CARREGAR VÍDEOS DO JSON (SCROLL INFINITO COM CLEANUP) ====================
let todosOsVideos = [];
let videosCarregados = 0;
let estaCarregandoVideos = false;
let sentinelaObserver = null;
let secaoVideosAtiva = true;
let abaObserver = null;

// Verifica se o container existe e inicia o carregamento
const ytContainer = document.getElementById('youtube-feed-container');
if (ytContainer) { 
    carregarVideosDoJSON(); 
}

/**
 * Função principal: carrega os vídeos do arquivo videos.json
 */
async function carregarVideosDoJSON() {
    const container = document.getElementById('youtube-feed-container');
    if (!container) return;

    try {
        // Tenta buscar do cache primeiro (para PWA offline)
        let data = null;
        try {
            const cache = await caches.open('vitaotub-cache-v3.1-20260804');
            const cachedResponse = await cache.match('/videos.json');
            if (cachedResponse) {
                data = await cachedResponse.json();
            }
        } catch (e) {
            // Fallback para fetch normal
        }

        // Se não achou no cache, faz fetch normal
        if (!data) {
            const response = await fetch('/videos.json');
            if (!response.ok) throw new Error('Erro ao carregar vídeos');
            data = await response.json();
        }

        todosOsVideos = data.videos;

        if (!todosOsVideos || todosOsVideos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-dim);">Nenhum vídeo encontrado.</p>';
            return;
        }

        // Reinicia o estado
        videosCarregados = 0;
        container.innerHTML = '';
        estaCarregandoVideos = false;
        secaoVideosAtiva = true;

        // Remove observer anterior se existir
        if (sentinelaObserver) {
            sentinelaObserver.disconnect();
            sentinelaObserver = null;
        }

        // Carrega os primeiros 20 vídeos
        carregarProximosVideos();

        // Configura o scroll infinito (CORRIGIDO)
        configurarScrollInfinitoVideos();

        // Configura o cleanup ao mudar de aba
        configurarCleanupAoMudarAba();

    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        container.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro ao carregar vídeos. Tente novamente mais tarde.</p>';
    }
}

/**
 * Carrega o próximo lote de vídeos (20 por vez)
 */
function carregarProximosVideos() {
    const container = document.getElementById('youtube-feed-container');
    if (!container) return;

    // Verifica se já carregou todos
    if (videosCarregados >= todosOsVideos.length) {
        const sentinela = document.getElementById('scroll-sentinel-videos');
        if (sentinela) sentinela.remove();
        return;
    }

    // Previne carregamento duplicado
    if (estaCarregandoVideos) return;
    estaCarregandoVideos = true;

    // Pega o próximo lote
    const proximos = todosOsVideos.slice(videosCarregados, videosCarregados + CONFIG.videosPorLote);

    // Cria os cards
    proximos.forEach(video => {
        const card = criarCardVideo(video);
        container.appendChild(card);
    });

    videosCarregados += proximos.length;
    estaCarregandoVideos = false;

    // Posiciona os tooltips nos novos botões
    positionTooltips();

    // Se carregou todos, remove o sentinela
    if (videosCarregados >= todosOsVideos.length) {
        const sentinela = document.getElementById('scroll-sentinel-videos');
        if (sentinela) sentinela.remove();
    }
}

/**
 * Cria um card de vídeo no formato do feed
 */
function criarCardVideo(video) {
    const videoId = video.id;
    const titulo = video.title || 'Vídeo sem título';
    const dataPub = video.date || new Date().toLocaleDateString('pt-BR');
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const card = document.createElement('article');
    card.className = 'feed-card';

    card.innerHTML = `
        <div class="video-thumbnail-container" onclick="abrirVideoModal('${videoId}')" role="button" tabindex="0" aria-label="Assistir: ${escapeHtml(titulo)}">
            <img src="${thumbnailUrl}" alt="${escapeHtml(titulo)}" loading="lazy" class="video-thumbnail" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'">
            <div class="play-icon-overlay"><i class="fa-solid fa-circle-play"></i></div>
        </div>
        <div class="feed-content">
            <h2 class="video-title">${escapeHtml(titulo)}</h2>
            <div class="video-meta-wrapper">
                <div class="video-meta-left">
                    <span class="video-date">📅 ${escapeHtml(dataPub)}</span>
                    <span class="video-author">✍️ VitãoTub</span>
                </div>
                <div class="video-meta-right">
                    <button class="btn-video-share" onclick="event.stopPropagation(); compartilharVideoFeed('${videoId}')" data-tooltip="Compartilhar vídeo" aria-label="Compartilhar vídeo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </button>
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" class="btn-video-youtube" onclick="event.stopPropagation();" data-tooltip="Assistir no YouTube" aria-label="Assistir no YouTube">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                </div>
            </div>
        </div>
    `;

    return card;
}

/**
 * Configura o scroll infinito para os vídeos usando IntersectionObserver (CORRIGIDO)
 */
function configurarScrollInfinitoVideos() {
    const container = document.getElementById('youtube-feed-container');
    if (!container) return;

    // Remove sentinela anterior se existir
    const sentinelaAntigo = document.getElementById('scroll-sentinel-videos');
    if (sentinelaAntigo) sentinelaAntigo.remove();

    // Cria um elemento sentinela no final do container
    const sentinela = document.createElement('div');
    sentinela.id = 'scroll-sentinel-videos';
    sentinela.style.height = '1px';
    sentinela.style.width = '100%';
    sentinela.style.visibility = 'hidden';
    container.appendChild(sentinela);

    // Configura o observer com rootMargin maior para carregar ANTES de chegar no fim
    sentinelaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !estaCarregandoVideos && videosCarregados < todosOsVideos.length && secaoVideosAtiva) {
                console.log('🔄 Carregando mais vídeos... (sentinela visível)');
                carregarProximosVideos();
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px 50px 0px', // Começa a carregar 50px ANTES de chegar no fim
        threshold: 0.1
    });

    sentinelaObserver.observe(sentinela);
}

/**
 * Limpa os vídeos extras mantendo apenas os 20 primeiros
 */
function limparVideosCarregados() {
    const container = document.getElementById('youtube-feed-container');
    if (!container) return;

    const cards = container.querySelectorAll('.feed-card');
    if (cards.length > 20) {
        console.log('🧹 Limpando vídeos antigos da memória...');
        
        // Remove todos os cards EXCETO os 20 primeiros
        for (let i = 20; i < cards.length; i++) {
            cards[i].remove();
        }
        
        // Atualiza o contador para 20
        videosCarregados = 20;
        
        // Reconecta o sentinela para continuar o scroll
        const sentinela = document.getElementById('scroll-sentinel-videos');
        if (!sentinela) {
            configurarScrollInfinitoVideos();
        }
        
        console.log('✅ Memória limpa! Apenas 20 vídeos mantidos.');
    }
}

/**
 * Configura o cleanup automático quando o usuário troca de aba
 */
function configurarCleanupAoMudarAba() {
    const secaoVideos = document.getElementById('secao-videos');
    if (!secaoVideos) return;

    // Remove observer anterior se existir
    if (abaObserver) {
        abaObserver.disconnect();
        abaObserver = null;
    }

    // Observa mudanças no estilo display da seção de vídeos
    abaObserver = new MutationObserver(() => {
        const isActive = secaoVideos.style.display !== 'none';
        
        if (!isActive && secaoVideosAtiva) {
            // Usuário SAIU da aba de vídeos
            console.log('🚪 Usuário saiu da aba de vídeos');
            secaoVideosAtiva = false;
            
            // Limpa os vídeos extras (mantém apenas 20)
            limparVideosCarregados();
            
            // Desconecta o observer do scroll (economiza recursos)
            if (sentinelaObserver) {
                sentinelaObserver.disconnect();
                sentinelaObserver = null;
            }
        } else if (isActive && !secaoVideosAtiva) {
            // Usuário VOLTOU para a aba de vídeos
            console.log('🚪 Usuário voltou para a aba de vídeos');
            secaoVideosAtiva = true;
            
            // Reconecta o observer do scroll
            if (!sentinelaObserver) {
                configurarScrollInfinitoVideos();
            }
        }
    });

    // Observa mudanças no estilo display da seção de vídeos
    abaObserver.observe(secaoVideos, {
        attributes: true,
        attributeFilter: ['style']
    });
}

// ==================== 23. FEED - TOOLTIPS ====================
function positionTooltips() {
    const buttons = document.querySelectorAll('.btn-video-share, .btn-video-youtube');
    buttons.forEach(button => {
        button.removeEventListener('mouseenter', positionTooltip);
        button.removeEventListener('mouseleave', hideTooltip);
        button.addEventListener('mouseenter', positionTooltip);
        button.addEventListener('mouseleave', hideTooltip);
    });
}

function positionTooltip(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const TOOLTIP_HEIGHT = 36;
    const OFFSET = 10;
    const spaceAbove = rect.top - OFFSET;
    const spaceBelow = window.innerHeight - rect.bottom - OFFSET;
    let tooltipTop;
    if (spaceAbove >= TOOLTIP_HEIGHT) {
        tooltipTop = rect.top - OFFSET;
        button.style.setProperty('--tooltip-direction', 'above');
    } else if (spaceBelow >= TOOLTIP_HEIGHT) {
        tooltipTop = rect.bottom + OFFSET + TOOLTIP_HEIGHT;
        button.style.setProperty('--tooltip-direction', 'below');
    } else {
        tooltipTop = window.innerHeight / 2 - TOOLTIP_HEIGHT / 2;
        button.style.setProperty('--tooltip-direction', 'center');
    }
    button.style.setProperty('--tooltip-top', tooltipTop + 'px');
    button.style.setProperty('--tooltip-left', (rect.left + rect.width / 2) + 'px');
}

function hideTooltip(e) {
    const button = e.currentTarget;
    button.style.removeProperty('--tooltip-top');
    button.style.removeProperty('--tooltip-left');
    button.style.removeProperty('--tooltip-direction');
}

// ==================== 24. FEED - MODAL DE VÍDEO EM TELA CHEIA ====================
function abrirVideoModal(videoId) {
    let modal = document.getElementById('video-fullscreen-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'video-fullscreen-modal'; modal.className = 'video-fullscreen-modal';
        modal.innerHTML = `
            <button class="video-fullscreen-close" id="video-close-btn" aria-label="Fechar vídeo"><i class="fa-solid fa-xmark"></i></button>
            <div class="video-fullscreen-container" id="video-container"><iframe id="video-fullscreen-iframe" src="" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>
            <div class="video-tap-hint" id="video-tap-hint">Toque na tela para ver mais opções</div>
            <div class="video-actions-bar" id="video-actions-bar">
                <button class="btn-action-icon btn-share-icon" id="video-share-btn" title="Compartilhar" aria-label="Compartilhar vídeo"><i class="fa-solid fa-share-nodes"></i></button>
                <a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="btn-action-icon btn-subscribe-icon" id="video-subscribe-btn" title="Inscrever-se" rel="noopener noreferrer" aria-label="Inscrever-se no canal"><i class="fa-brands fa-youtube"></i></a>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) { if (e.target === modal) fecharVideoModal(); });
        modal.addEventListener('click', function() { const tapHint = document.getElementById('video-tap-hint'); if (tapHint) tapHint.classList.remove('visible'); });
        document.getElementById('video-share-btn').addEventListener('click', function(e) { e.stopPropagation(); const iframe = document.getElementById('video-fullscreen-iframe'); const currentSrc = iframe.src; const videoIdMatch = currentSrc.match(/embed\/([^?]+)/); if (videoIdMatch) compartilharVideoFeed(videoIdMatch[1]); });
        document.getElementById('video-close-btn').addEventListener('click', function(e) { e.stopPropagation(); fecharVideoModal(); });
    }
    const iframe = document.getElementById('video-fullscreen-iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
    modal.classList.add('active'); document.body.style.overflow = 'hidden';
    const tapHint = document.getElementById('video-tap-hint');
    if (tapHint) { tapHint.classList.add('visible'); setTimeout(() => { if (tapHint) tapHint.classList.remove('visible'); }, 4000); }
    verificarOrientacao(); window.addEventListener('orientationchange', verificarOrientacao);
    initVideoSwipeToClose();
}

function fecharVideoModal() {
    const modal = document.getElementById('video-fullscreen-modal');
    const iframe = document.getElementById('video-fullscreen-iframe');
    if (modal) { modal.classList.remove('active'); if (iframe) iframe.src = ''; document.body.style.overflow = ''; }
    window.removeEventListener('orientationchange', verificarOrientacao);
}

function verificarOrientacao() {
    const container = document.getElementById('video-container');
    if (!container) return;
    if (window.innerWidth > window.innerHeight) { container.classList.add('landscape'); container.classList.remove('portrait'); }
    else { container.classList.add('portrait'); container.classList.remove('landscape'); }
}

function initVideoSwipeToClose() {
    const modal = document.getElementById('video-fullscreen-modal'); if (!modal) return;
    let startX = 0, startY = 0, currentX = 0, currentY = 0, isDragging = false;
    modal.addEventListener('touchstart', (e) => {
        if (e.target === modal) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; isDragging = true; modal.style.transition = 'none'; }
    }, { passive: true });
    modal.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX; currentY = e.touches[0].clientY;
        const diffX = currentX - startX; const diffY = currentY - startY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 20) { modal.style.transform = `translateX(${diffX}px)`; modal.style.opacity = 1 - Math.abs(diffX) / 400; }
        } else if (diffY > 20) {
            modal.style.transform = `translateY(${diffY}px)`; modal.style.opacity = 1 - Math.abs(diffY) / 500;
        }
    }, { passive: true });
    modal.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX; const diffY = currentY - startY;
        modal.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        if (Math.abs(diffX) > 100 || diffY > 150) {
            if (Math.abs(diffX) > Math.abs(diffY)) { modal.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; }
            else { modal.style.transform = 'translateY(100%)'; }
            modal.style.opacity = '0';
            setTimeout(() => { fecharVideoModal(); modal.style.transform = ''; modal.style.opacity = ''; }, 300);
        } else { modal.style.transform = ''; modal.style.opacity = ''; }
        currentX = 0; currentY = 0;
    });
}

function compartilharVideoFeed(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const mensagem = `🎬 Vídeo publicado no Canal VitãoTub: ${videoUrl}`;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        navigator.share({ title: 'Vídeo do VitãoTub', text: 'Confira este vídeo no YouTube!', url: videoUrl })
            .catch((err) => { if (err.name !== 'AbortError') console.error('Erro ao compartilhar:', err); });
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mensagem)
            .then(() => { alert('✅ Link do vídeo copiado! Compartilhe com seus amigos.'); })
            .catch(() => { fallbackCopy(mensagem); });
    } else { fallbackCopy(mensagem); }
}

function fallbackCopy(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try { document.execCommand('copy'); alert('✅ Link do vídeo copiado! Compartilhe com seus amigos.'); } catch (e) { alert('❌ Não foi possível copiar o link. Tente manualmente.'); }
    document.body.removeChild(tempInput);
}

// ==================== 25. FEED - SISTEMA DE ARTIGOS ====================
let todosArtigos = [];
let artigosCarregados = false;
let artigosExibidos = 0;

async function carregarTodosArtigos() {
    const container = document.getElementById('artigos-feed-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: #aaa;">Carregando artigos...</p>';
    todosArtigos = [];
    for (const file of CONFIG.artigosFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) continue;
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const artigos = doc.querySelectorAll('.artigo-card');
            artigos.forEach(artigo => { todosArtigos.push({ element: artigo.cloneNode(true), data: new Date(artigo.getAttribute('data-data').split('/').reverse().join('-')), id: artigo.id }); });
        } catch (error) { console.warn(`Erro ao carregar ${file}:`, error); }
    }
    todosArtigos.sort((a, b) => b.data - a.data);
    if (todosArtigos.length > 0) { artigosCarregados = true; artigosExibidos = 0; container.innerHTML = ''; carregarMaisArtigos(); configurarScrollInfinitoArtigos(); initArtigoDestaque(); }
    else { container.innerHTML = '<p style="text-align: center; color: #aaa;">Nenhum artigo encontrado.</p>'; }
}

function carregarMaisArtigos() {
    const container = document.getElementById('artigos-feed-container');
    const loading = document.getElementById('artigos-loading');
    if (!container) return;
    const proximos = todosArtigos.slice(artigosExibidos, artigosExibidos + CONFIG.artigosIncremento);
    if (proximos.length === 0) { if (loading) loading.style.display = 'none'; return; }
    proximos.forEach(artigo => {
        const card = artigo.element;
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) { if (e.target.closest('button') || e.target.closest('a') || e.target.closest('iframe')) return; abrirArtigoFullscreen(artigo.id); });
        const btnLerMais = document.createElement('button'); btnLerMais.className = 'btn-ler-mais'; btnLerMais.innerHTML = '📖 Ler Artigo Completo';
        btnLerMais.addEventListener('click', function(e) { e.stopPropagation(); abrirArtigoFullscreen(artigo.id); });
        const meta = card.querySelector('.artigo-meta'); if (meta) { meta.after(btnLerMais); } else { card.appendChild(btnLerMais); }
        container.appendChild(card);
    });
    artigosExibidos += proximos.length;
    if (artigosExibidos >= todosArtigos.length && loading) { loading.style.display = 'none'; }
    initArtigoDestaque();
}

function configurarScrollInfinitoArtigos() {
    const loading = document.getElementById('artigos-loading');
    window.addEventListener('scroll', () => {
        const secaoArtigos = document.getElementById('secao-artigos'); if (!secaoArtigos || secaoArtigos.style.display === 'none') return;
        const scrollBottom = window.innerHeight + window.scrollY; const pageBottom = document.body.offsetHeight - 300;
        if (scrollBottom >= pageBottom && artigosExibidos < todosArtigos.length) {
            if (loading) loading.style.display = 'block';
            carregarMaisArtigos();
            if (artigosExibidos >= todosArtigos.length && loading) { loading.innerHTML = '<p>Todos os artigos foram carregados! 🎉</p>'; setTimeout(() => { loading.style.display = 'none'; }, 3000); }
        }
    });
}

function initArtigoDestaque() {
    const artigos = document.querySelectorAll('.artigo-card');
    if (artigos.length === 0) return;
    
    artigos.forEach(artigo => {
        artigo.classList.remove('artigo-destaque');
    });
    
    artigos.forEach(artigo => {
        artigo.addEventListener('mouseenter', function() {
            this.classList.add('artigo-destaque');
        });
        artigo.addEventListener('mouseleave', function() {
            this.classList.remove('artigo-destaque');
        });
        artigo.addEventListener('touchstart', function() {
            this.classList.add('artigo-destaque');
            setTimeout(() => {
                this.classList.remove('artigo-destaque');
            }, 800);
        }, { passive: true });
    });
}

function abrirArtigoFullscreen(artigoId) {
    const artigo = document.getElementById(artigoId);
    if (!artigo) return;
    
    const modal = document.getElementById('artigo-fullscreen-modal');
    const body = document.getElementById('artigo-fullscreen-body');
    if (!modal || !body) return;
    
    const conteudo = artigo.cloneNode(true);
    conteudo.style.cursor = 'default';
    conteudo.classList.remove('artigo-card');
    conteudo.classList.add('artigo-fullscreen-active');
    
    const btnLerMais = conteudo.querySelector('.btn-ler-mais');
    if (btnLerMais) btnLerMais.remove();
    
    const corpo = conteudo.querySelector('.artigo-corpo');
    if (corpo) {
        corpo.style.display = 'block';
        corpo.style.maxHeight = 'none';
        corpo.style.overflow = 'visible';
        corpo.style.padding = '15px 20px';
        corpo.style.textAlign = 'justify';
        corpo.style.textJustify = 'inter-word';
        corpo.style.wordBreak = 'break-word';
        corpo.style.overflowWrap = 'break-word';
        corpo.style.wordWrap = 'break-word';
        corpo.style.webkitHyphens = 'auto';
        corpo.style.mozHyphens = 'auto';
        corpo.style.msHyphens = 'auto';
        corpo.style.hyphens = 'auto';
        
        const paragrafos = corpo.querySelectorAll('p');
        paragrafos.forEach(p => {
            p.style.textAlign = 'justify';
            p.style.textJustify = 'inter-word';
            p.style.wordBreak = 'break-word';
            p.style.overflowWrap = 'break-word';
            p.style.wordWrap = 'break-word';
            p.style.webkitHyphens = 'auto';
            p.style.mozHyphens = 'auto';
            p.style.msHyphens = 'auto';
            p.style.hyphens = 'auto';
            p.style.marginBottom = '14px';
            p.style.textIndent = '1.5em';
        });
        
        corpo.classList.remove('hidden', 'oculto', 'fechado');
    }
    
    body.innerHTML = '';
    body.appendChild(conteudo);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
    window.scrollTo(0, 0);
    
    initArtigoSwipeToClose();
}

function fecharArtigoFullscreen() {
    const modal = document.getElementById('artigo-fullscreen-modal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function initArtigoSwipeToClose() {
    const modal = document.getElementById('artigo-fullscreen-modal');
    const content = document.querySelector('.artigo-fullscreen-content');
    if (!modal || !content) return;
    let startX = 0, currentX = 0, isDragging = false;
    content.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        content.style.transition = 'none';
    }, { passive: true });
    content.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        if (Math.abs(diffX) > 20) {
            content.style.transform = `translateX(${diffX}px)`;
            content.style.opacity = 1 - Math.abs(diffX) / 400;
        }
    }, { passive: true });
    content.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX;
        content.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        if (Math.abs(diffX) > 100) {
            content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)';
            content.style.opacity = '0';
            setTimeout(() => { fecharArtigoFullscreen(); content.style.transform = ''; content.style.opacity = ''; }, 300);
        } else { content.style.transform = ''; content.style.opacity = ''; }
        currentX = 0;
    });
}

function compartilharArtigo(artigoId, titulo) {
    const link = `https://www.vitaotub.com/feed/index.html#${artigoId}`;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        navigator.share({ title: titulo || 'Artigo do VitãoTub', text: 'Confira este artigo!', url: link }).catch(() => {});
    } else {
        navigator.clipboard.writeText(link)
            .then(() => { alert('Link do artigo copiado! Compartilhe com seus amigos.'); })
            .catch(() => { fallbackCopy(link); });
    }
}

function verificarArtigoNaUrl() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#artigo-')) {
        const artigoId = hash.substring(1);
        if (!artigosCarregados) { carregarTodosArtigos().then(() => { mudarAba('artigos'); setTimeout(() => { const artigo = document.getElementById(artigoId); if (artigo) abrirArtigoFullscreen(artigoId); }, 800); }); }
        else { mudarAba('artigos'); setTimeout(() => { const artigo = document.getElementById(artigoId); if (artigo) abrirArtigoFullscreen(artigoId); }, 800); }
    }
}

// ==================== 26. INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
    initTranslateWidget();
    initDraggableTranslate();
    initThemeToggle();
    initDraggableTheme();
    verificarArtigoNaUrl();
});

// ==================== 27. GOOGLE TRANSLATE INICIALIZAÇÃO ====================
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        includedLanguages: 'en,es,pt,it,fr,zh-CN,ja,hi',
        layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
        autoDisplay: false,
        multilanguagePage: true,
        gaTrack: false
    }, 'google_translate_element');
}