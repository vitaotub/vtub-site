// --- INTEGRAÇÃO ONESIGNAL PUSH ---
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

// --- INICIA O SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso!');
      })
      .catch(error => {
        console.log('Erro ao registrar o Service Worker:', error);
      });
  });
}

// --- AUTO-ATUALIZAÇÃO DO PWA ---
if ('serviceWorker' in navigator) {
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

// --- LÓGICA DO POPUP DE INSTALAÇÃO DO APP (APONTANDO PARA A PASTA FEED) ---
document.addEventListener("DOMContentLoaded", () => {
  const pwaPopup = document.getElementById('pwa-install-popup');
  const installBtn = document.getElementById('pwa-install-btn');
  const closeBtn = document.getElementById('pwa-close-btn');

  if (!pwaPopup) {
    return; 
  }

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPrompt = e; 
    pwaPopup.style.display = 'flex'; 
  });

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if (!isStandalone) {
    setTimeout(() => {
      if (pwaPopup.style.display !== 'flex') {
        pwaPopup.style.display = 'flex';
      }
    }, 2000);
  }

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        pwaPopup.style.display = 'none';
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') console.log('App instalado!');
        deferredPrompt = null;
      } else {
        // Redireciona para o novo local do app dentro da pasta feed
        window.location.href = '/feed/feed.html';
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      pwaPopup.style.display = 'none';
    });
  }
});

// 1. CONFIGURAÇÕES GERAIS
function lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    // Se o header for fixed, precisamos aplicar o padding nele também
    const header = document.querySelector('header');
    if (header) header.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    const header = document.querySelector('header');
    if (header) header.style.paddingRight = '';
}

const CONFIG = {
    modalId: 'video-modal',
    iframeTargetId: 'modal-iframe-target',
    toastContainerId: 'toast-overlay',
    privacyModalId: 'privacy-modal',
    privacyTargetId: 'privacy-content-target',
    scriptURL: 'https://script.google.com/macros/s/AKfycbwOnJ8aLNMfbOss06eRh_glZRNULpJ3j9HqeL7PCGPDfr80_vcCB5-hLEHkDddO-LFrqA/exec'
};

// 2. ANIMAÇÃO DE ESTATÍSTICAS
const observer = new IntersectionObserver((entries) => {
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

document.querySelectorAll('.stat-card, .demo-box, .demo-bar-item').forEach(el => observer.observe(el));

// 3. SISTEMA DE MODAL DE VÍDEO
function openVideo(videoId) {
    const modal = document.getElementById(CONFIG.modalId);
    const target = document.getElementById(CONFIG.iframeTargetId);
    if (modal && target) {
        target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        modal.classList.add('active');
        lockScroll(); // Substituído aqui
    }
}

function closeVideo() {
    const modal = document.getElementById(CONFIG.modalId);
    const target = document.getElementById(CONFIG.iframeTargetId);
    if (modal) {
        if (target) target.innerHTML = '';
        modal.classList.remove('active');
        unlockScroll(); // Substituído aqui
    }
}

// 4. MODAL DE PRIVACIDADE E TERMOS (Corrigido)
async function openPrivacyModal() {
    await loadModalContent('./politica-de-privacidade.html');
}

async function openTermsModal() {
    await loadModalContent('./termos-de-uso.html');
}

async function loadModalContent(filePath) {
    const modal = document.getElementById(CONFIG.privacyModalId);
    const target = document.getElementById(CONFIG.privacyTargetId);
    
    if (modal && target) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        lockScroll(); // Substituído aqui
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

function closePrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 300); 
        unlockScroll(); // Substituído aqui
    }
}

// 5. PROCESSAMENTO DO FORMULÁRIO
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const humanCheck = document.getElementById('human-check');
        if (!humanCheck || !humanCheck.checked) {
            alert("Por favor, confirme que você não é um robô.");
            return;
        }

        const nome = contactForm.querySelector('input[name="nome"]').value;
        const email = contactForm.querySelector('input[name="email"]').value;
        const mensagem = contactForm.querySelector('textarea[name="mensagem"]').value;

        const assunto = encodeURIComponent(`Contato via Site - ${nome}`);
        const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`);
        const mailtoLink = `mailto:vitaotub@gmail.com?subject=${assunto}&body=${corpo}`;

        window.location.href = mailtoLink;

        const toast = document.getElementById(CONFIG.toastContainerId);
        if (toast) {
            toast.classList.add('show');
            lockScroll(); // Substituído aqui
        }
        contactForm.reset();
    });
}

function closeToast() {
    const toast = document.getElementById(CONFIG.toastContainerId);
    if (toast) {
        toast.classList.remove('show');
        unlockScroll(); // Substituído aqui
    }
}

// EVENTOS DE TECLADO (ESC)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideo();
        closeToast();
        closePrivacyModal();
    }
});

// EVENTOS DE CLIQUE FORA DA MODAL
document.addEventListener('click', function(e) {
    if (e.target.id === CONFIG.modalId || e.target.classList.contains('modal-overlay') && e.target.closest('#video-modal')) {
        closeVideo();
    }
    if (e.target.id === CONFIG.toastContainerId || e.target.classList.contains('toast-close-btn')) {
        closeToast();
    }
    // Fechamento seguro do modal de privacidade/termos
    if (e.target.id === CONFIG.privacyModalId || 
        (e.target.classList.contains('modal-overlay') && e.target.closest('#privacy-modal')) || 
        e.target.classList.contains('modal-close')) {
        closePrivacyModal();
    }
});

const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initCookieBanner() {
    const banner = document.getElementById("lgpd-banner");
    const btnAccept = document.getElementById("lgpd-accept");
    const btnReject = document.getElementById("lgpd-reject");

    if (!banner) return;

    if (!localStorage.getItem("vitaotub_cookies_accepted")) {
        setTimeout(() => {
            banner.classList.add("show");
        }, 1000);
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