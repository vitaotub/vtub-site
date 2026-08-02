# 🌐 VitãoTub — Site Oficial & WebApp

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ativo-8b5cf6?style=flat-square&logo=github)](https://www.vitaotub.com)
[![PWA](https://img.shields.io/badge/PWA-instalável-ff0000?style=flat-square&logo=pwa)](https://www.vitaotub.com/feed/)
[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue?style=flat-square)](https://github.com/vitaotub/vtub-site)
[![Licença](https://img.shields.io/badge/licença-MIT-green?style=flat-square)](LICENSE)

> 🎮 **Tecnologia, Segurança Digital e Games de forma acessível.**  
> Site vitrine do canal [VitãoTub](https://www.youtube.com/@vitaotub) + WebApp PWA para fãs e inscritos.

---

## 👀 Visão Geral

Este repositório contém o código-fonte completo do site **vitaotub.com**, dividido em duas partes:

| Parte | Descrição | URL |
|-------|-----------|-----|
| 🏠 **Site Principal** | Apresentação do canal, estatísticas, vídeos populares e contato | [vitaotub.com](https://www.vitaotub.com) |
| 📱 **WebApp (Feed)** | App instalável com vídeos recentes, artigos e dicas | [vitaotub.com/feed/](https://www.vitaotub.com/feed/) |

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|------------|-----|
| **HTML5** | Estrutura semântica de todas as páginas |
| **CSS3** | Estilização, animações, responsividade (Flexbox, Grid) |
| **JavaScript (Vanilla)** | Toda a lógica — sem frameworks ou dependências |
| **PWA** | Manifest, Service Worker, cache offline, instalável |
| **RSS (rss2json)** | Feed automático dos últimos vídeos do YouTube |
| **OneSignal** | Push notifications |
| **Google Translate** | Tradução automática do site |
| **Font Awesome** | Ícones vetoriais |
| **Google Fonts** | Fontes Inter e Satoshi |
| **GitHub Pages** | Hospedagem gratuita |

---

## 🏠 Site Principal

A página inicial (`index.html`) serve como **vitrine do canal** e inclui:

- 🎬 **Vídeo em destaque** (hero section)
- 📊 **Estatísticas do canal** (inscritos, visualizações, demografia)
- 🎥 **Vídeos mais vistos** (grid com links para YouTube)
- 🌐 **Redes sociais** (YouTube, Instagram, TikTok, Twitch, Telegram, GitHub)
- 📬 **Formulário de contato** (abre cliente de e-mail)
- 🔒 **Política de Privacidade e Termos de Uso** (modais dinâmicos)
- 🍪 **Banner LGPD** (consentimento de cookies)
- 🌍 **Tradução automática** (PT, EN, ES)
- 📲 **Popup de instalação do PWA** (com memória de escolha)
- 📂 **Meus Projetos** — página com todos os projetos do criador

### Funcionalidades técnicas:

- ✅ Menu mobile hamburguer (≤850px)
- ✅ Modal de vídeo do YouTube
- ✅ Modal de projetos com swipe to close
- ✅ Scroll suave para âncoras
- ✅ Botão "Voltar ao topo"
- ✅ Animações de estatísticas (Intersection Observer)
- ✅ Totalmente responsivo

---

## 📱 WebApp (Feed)

O feed (`feed/index.html`) é um **PWA instalável** focado em conteúdo:

- 🎥 **Feed de vídeos** — últimos 15 vídeos do canal via RSS
- 📝 **Artigos** — sistema com scroll infinito, modal em tela cheia e compartilhamento
- 👤 **Sobre** — informações do criador
- 🎬 **Player em tela cheia** — abre vídeos com controles touch
- 🔗 **Compartilhamento** — link direto para artigos e vídeos
- 🔄 **Auto-update** — Service Worker verifica novas versões

### Sistema de Artigos:

- Template em `artigos-TEMPLATE.html` com estrutura padronizada
- Suporte para múltiplos arquivos (`artigos2.html`, `artigos3.html`...)
- Scroll infinito (20 artigos iniciais + 10 por scroll)
- Modal em tela cheia com redes sociais e compartilhamento
- Link direto com `#artigo-id` para compartilhar artigos específicos

---

## 📲 PWA — Instalar no Celular

O site é um **Progressive Web App** completo:

1. Acesse [vitaotub.com](https://www.vitaotub.com) pelo celular
2. O popup de instalação aparecerá automaticamente
3. Clique em **"Instalar App"**
4. O app será adicionado à tela inicial do seu celular
5. Acesse mesmo offline!

**Funcionalidades PWA:**

| Funcionalidade | Status |
|----------------|--------|
| Instalável (Android, iOS, Desktop) | ✅ |
| Cache offline (Service Worker) | ✅ |
| Auto-update (verifica novas versões) | ✅ |
| Modo standalone (sem barra do navegador) | ✅ |
| Notificações push (OneSignal) | 🚧 Em breve |

---

## 🚀 Como Rodar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/vitaotub/vtub-site.git

# 2. Entre na pasta
cd vtub-site

# 3. Abra com Live Server (VS Code)
# Ou simplesmente abra index.html no navegador
```

⚠️ Para testar o PWA e Service Worker, é necessário servir os arquivos via HTTP (não funciona com file://). Use Live Server no VS Code.

🌍 Deploy
O site é hospedado gratuitamente no GitHub Pages:

Branch: main (ou gh-pages)

Pasta raiz: / (não usa /docs)

Domínio personalizado: vitaotub.com (configurado no arquivo CNAME)

Toda vez que um push é feito para a branch principal, o GitHub Pages atualiza automaticamente o site.

🤝 Contribuindo
Contribuições são bem-vindas! Se você encontrou um bug, tem uma sugestão ou quer melhorar o código:

Faça um fork do projeto

Crie uma branch: git checkout -b minha-melhoria

Faça suas alterações e commit: git commit -m 'Adiciona X'

Push: git push origin minha-melhoria

Abra um Pull Request

📜 Licença
Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.



<p align="center"> <img src="logo-app.png" alt="VitãoTub" width="120"> <br> <strong>Feito com 💜 por Victor Lopes</strong> <br> <sub>Transformando tecnologia complexa em conhecimento acessível.</sub> </p> ```
