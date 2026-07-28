/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT PRINCIPAL
 * Descrição: Lógica de interações, modais, PWA, formulário,
 * OneSignal, Service Worker e banner LGPD
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
OneSignalDeferred.push(function(OneSignal) {
    OneSignal.init({
        appId: "24dbec09-7c58-4193-9d90-8417abc8564e",
        safari_web_id: "SEU_ID_SAFARI_AQUI_SE_HOUVER",
        notifyButton: {
            enable: true,
        },
    });
});

// ==================== 3. SERVICE WORKER E PWA ====================
if ('serviceWorker' in navigator) {
    // Registro do Service Worker
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso!');
            })
            .catch(error => {
                console.log('Erro ao registrar o Service Worker:', error);
            });
    });

    // Auto-atualização do PWA
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

// ==================== 4. POPUP DE INSTALAÇÃO DO APP (PWA) ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');

    // Se o popup não existe no DOM, interrompe a execução
    if (!pwaPopup) return;

    let deferredPrompt = null;

    // Captura o evento de instalação do PWA (disparado pelo navegador)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        pwaPopup.style.display = 'flex';
    });

    // Verifica se o app já está instalado (modo standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Se não estiver instalado, exibe o popup após 2 segundos
    if (!isStandalone) {
        setTimeout(() => {
            if (pwaPopup.style.display !== 'flex') {
                pwaPopup.style.display = 'flex';
            }
        }, 2000);
    }

    // Botão de instalar
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                pwaPopup.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') console.log('App instalado!');
                deferredPrompt = null;
            } else {
                // Redireciona para o feed caso o prompt não esteja disponível
                window.location.href = '/feed/feed.html';
            }
        });
    }

    // Botão de fechar popup
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            pwaPopup.style.display = 'none';
        });
    }
});

// ==================== 5. CONTROLE DE SCROLL (MODAIS) ====================
/**
 * Bloqueia o scroll da página (usado ao abrir modais)
 * Compensa a largura da scrollbar para evitar saltos no layout
 */
function lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    // Aplica também no header fixo para evitar desalinhamento
    const header = document.querySelector('header');
    if (header) header.style.paddingRight = `${scrollbarWidth}px`;
}

/**
 * Restaura o scroll da página (usado ao fechar modais)
 */
function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    const header = document.querySelector('header');
    if (header) header.style.paddingRight = '';
}

// ==================== 6. ANIMAÇÃO DE ESTATÍSTICAS (INTERSECTION OBSERVER) ====================
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fills = entry.target.querySelectorAll('.demo-bar-fill, .bar-fill');
            fills.forEach(fill => {
                const targetWidth = fill.getAttribute('data-width') || 
                                    fill.parentElement.getAttribute('data-width') || 
                                    "100%";
                fill.style.width = targetWidth;
            });
        }
    });
}, { threshold: 0.1 });

// Observa elementos de estatísticas para animar quando visíveis
document.querySelectorAll('.stat-card, .demo-box, .demo-bar-item').forEach(el => statsObserver.observe(el));

// ==================== 7. SISTEMA DE MODAL DE VÍDEO ====================
/**
 * Abre o modal com um vídeo do YouTube
 * @param {string} videoId - ID do vídeo do YouTube
 */
function openVideo(videoId) {
    const modal = document.getElementById(CONFIG.modalId);
    const target = document.getElementById(CONFIG.iframeTargetId);
    if (modal && target) {
        target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        modal.classList.add('active');
        lockScroll();
    }
}

/**
 * Fecha o modal de vídeo e limpa o iframe
 */
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
/**
 * Abre o modal de Política de Privacidade
 */
async function openPrivacyModal() {
    await loadModalContent('./politica-de-privacidade.html');
}

/**
 * Abre o modal de Termos de Uso
 */
async function openTermsModal() {
    await loadModalContent('./termos-de-uso.html');
}

/**
 * Carrega conteúdo externo no modal de privacidade/termos
 * @param {string} filePath - Caminho do arquivo HTML a ser carregado
 */
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
            const htmlContent = await response.text();
            target.innerHTML = htmlContent;
        } catch (error) {
            target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar o conteúdo. Certifique-se de estar rodando o site através de um servidor local (Live Server).</p><p><a href="${filePath}" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>`;
        }
    }
}

/**
 * Fecha o modal de privacidade/termos
 */
function closePrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 300);
        unlockScroll();
    }
}

// ==================== 9. PROCESSAMENTO DO FORMULÁRIO DE CONTATO ====================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificação do checkbox de privacidade
        const privacyCheck = document.getElementById('privacy-check');
        if (!privacyCheck || !privacyCheck.checked) {
            alert("Por favor, confirme que você leu e concorda com a Política de Privacidade.");
            return;
        }

        // Obtém os valores dos campos
        const nome = contactForm.querySelector('input[name="nome"]').value;
        const email = contactForm.querySelector('input[name="email"]').value;
        const mensagem = contactForm.querySelector('textarea[name="mensagem"]').value;

        // Monta o link mailto
        const assunto = encodeURIComponent(`Contato via Site - ${nome}`);
        const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`);
        const mailtoLink = `mailto:vitaotub@gmail.com?subject=${assunto}&body=${corpo}`;

        // Abre o cliente de e-mail
        window.location.href = mailtoLink;

        // Exibe toast de confirmação
        const toast = document.getElementById(CONFIG.toastContainerId);
        if (toast) {
            toast.classList.add('show');
            lockScroll();
        }
        contactForm.reset();
    });
}

/**
 * Fecha o toast de notificação
 */
function closeToast() {
    const toast = document.getElementById(CONFIG.toastContainerId);
    if (toast) {
        toast.classList.remove('show');
        unlockScroll();
    }
}

// ==================== 10. EVENTOS GLOBAIS ====================

// Fechar modais com tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideo();
        closeToast();
        closePrivacyModal();
    }
});

// Fechar modais com clique fora
document.addEventListener('click', function(e) {
    // Fecha modal de vídeo
    if (e.target.id === CONFIG.modalId || 
        (e.target.classList.contains('modal-overlay') && e.target.closest('#video-modal'))) {
        closeVideo();
    }
    // Fecha toast
    if (e.target.id === CONFIG.toastContainerId || e.target.classList.contains('toast-close-btn')) {
        closeToast();
    }
    // Fecha modal de privacidade/termos
    if (e.target.id === CONFIG.privacyModalId || 
        (e.target.classList.contains('modal-overlay') && e.target.closest('#privacy-modal')) || 
        e.target.classList.contains('modal-close')) {
        closePrivacyModal();
    }
});

// ==================== 11. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== 12. BANNER DE COOKIES (LGPD) ====================
/**
 * Inicializa o banner de consentimento de cookies
 * Exibe apenas se o usuário ainda não aceitou
 */
function initCookieBanner() {
    const banner = document.getElementById("lgpd-banner");
    const btnAccept = document.getElementById("lgpd-accept");
    const btnReject = document.getElementById("lgpd-reject");

    if (!banner) return;

    // Exibe o banner se não houver consentimento salvo
    if (!localStorage.getItem("vitaotub_cookies_accepted")) {
        setTimeout(() => {
            banner.classList.add("show");
        }, 1000);
    }

    // Botão de aceitar cookies
    if (btnAccept) {
        btnAccept.onclick = function() {
            localStorage.setItem("vitaotub_cookies_accepted", "true");
            banner.classList.remove("show");
        };
    }

    // Botão de rejeitar cookies
    if (btnReject) {
        btnReject.onclick = function() {
            banner.classList.remove("show");
        };
    }
}

// Inicializa o banner quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", initCookieBanner);