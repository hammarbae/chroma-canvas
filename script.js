document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const blurBg = document.getElementById('blur-bg');
    const categoriesGrid = document.getElementById('categories-grid');
    const mockupContainer = document.getElementById('mockup-container');
    const toast = document.getElementById('toast');

    // Click trigger input
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImage(file);
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, () => dropZone.classList.remove('active'));
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleImage(file);
    });

    function handleImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            // Update backdrop immediately
            blurBg.style.backgroundImage = `url(${e.target.result})`;
            
            // Wait for image to load to extract colors
            imagePreview.onload = () => {
                extractColors(imagePreview);
            };
        };
        reader.readAsDataURL(file);
    }

    // Color Extraction & Sorting
    function extractColors(imgElement) {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(imgElement, 12); // get 12 colors for better pool
        
        const analyzedColors = palette.map(color => {
            const [r, g, b] = color;
            const hex = rgbToHex(r, g, b);
            const hsl = rgbToHsl(r, g, b);
            return { rgb: color, hex, hsl };
        });

        const categories = categorizeColors(analyzedColors);
        renderPalette(categories);
        applyToMockup(categories);
    }

    // Categorization Algorithm
    function categorizeColors(colors) {
        const sortedBySat = [...colors].sort((a, b) => b.hsl[1] - a.hsl[1]);
        const dominant = colors[0];

        // 1. Background
        let background = colors.find(c => c.hsl[2] > 75 || c.hsl[2] < 25) || dominant;
        if (!background) background = [...colors].sort((a,b) => a.hsl[1] - b.hsl[1])[0];

        // 2. Key Color
        let keyColor = sortedBySat[0];
        if (keyColor.hex === background.hex && sortedBySat[1]) {
            keyColor = sortedBySat[1];
        }

        // 3. Sub Colors (Multiple candidate items, up to 3)
        const subColors = [];
        for (let c of sortedBySat) {
            if (c.hex !== background.hex && c.hex !== keyColor.hex) {
                // Hue difference check to avoid 3 exact duplicates (Hue diff > 15)
                const isDistinct = subColors.every(sc => Math.abs(sc.hsl[0] - c.hsl[0]) > 15);
                if (isDistinct) {
                    subColors.push(c);
                }
                if (subColors.length === 3) break;
            }
        }
        // Fallbacks backends if array sparse
        if (subColors.length === 0) subColors.push(sortedBySat[1] || dominant);

        return {
            background: { name: 'Background', color: background },
            key: { name: 'Key Color', color: keyColor },
            sub: { name: 'Sub Color', colors: subColors } // Array Node
        };
    }

    function renderPalette(categoryMap) {
        categoriesGrid.innerHTML = ''; // clear
        window.currentCategoryMap = categoryMap; // global bind for updates

        Object.keys(categoryMap).forEach(key => {
            const item = categoryMap[key];
            const isArray = !!item.colors;
            const colorList = isArray ? item.colors : [item.color];

            // 1. Category Bar Layout (Sketch Style)
            const bar = document.createElement('div');
            bar.className = 'category-bar';
            bar.innerHTML = `
                <span class="bar-title">${item.name}</span>
                <button class="bar-copy-btn"><i class="fa-solid fa-copy"></i> Copy</button>
            `;

            // 2. Swatches container
            const swatchesContainer = document.createElement('div');
            swatchesContainer.className = 'swatches-container';

            colorList.forEach((c) => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch-box';
                swatch.style.backgroundColor = c.hex;
                
                swatch.innerHTML = `
                    <div class="swatch-overlay"><i class="fa-solid fa-pencil"></i></div>
                `;

                // Edit Click Event
                swatch.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEditPopup(swatch, c);
                });

                swatchesContainer.appendChild(swatch);
            });

            // Append to Main Grid
            categoriesGrid.appendChild(bar);
            categoriesGrid.appendChild(swatchesContainer);

            // Copy Bar contents listener
            bar.querySelector('.bar-copy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const copyText = colorList.map(c => c.hex).join(', ');
                copyToClipboard(copyText);
            });
        });
    }

    // Editable Popup Tooltip Logic
    function showEditPopup(swatch, colorObj) {
        const oldPopup = document.querySelector('.editable-popup');
        if (oldPopup) oldPopup.remove();

        const popup = document.createElement('div');
        popup.className = 'editable-popup';
        popup.innerHTML = `
            <div class="popup-arrow"></div>
            <input type="text" class="popup-input" value="${colorObj.hex.toUpperCase()}" placeholder="#FFFFFF">
        `;
        document.body.appendChild(popup);

        // Position
        const rect = swatch.getBoundingClientRect();
        popup.style.top = `${rect.top - 55 + window.scrollY}px`;
        popup.style.left = `${rect.left + rect.width/2 - 65}px`;

        const input = popup.querySelector('.popup-input');
        input.focus();
        input.select();

        const updateTrigger = () => {
            let val = input.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                colorObj.hex = val;
                swatch.style.backgroundColor = val;
                // Refresh mockup based on edited map
                if (window.currentCategoryMap) {
                    applyToMockup(window.currentCategoryMap);
                }
            }
        };

        input.addEventListener('input', updateTrigger);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                updateTrigger();
                popup.remove();
            }
        });

        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && e.target !== swatch) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    }

    function applyToMockup(categoryMap) {
        const bgHex = categoryMap.background.color.hex;
        const keyHex = categoryMap.key.color.hex;
        // Use first sub if array, fallback same
        const subColorsList = categoryMap.sub.colors || [categoryMap.sub.color];
        const subHex = subColorsList[0].hex;
        const subHex2 = subColorsList[1] ? subColorsList[1].hex : subColorsList[0].hex;

        const isBgDark = getContrastYIQ(categoryMap.background.color.rgb || [0,0,0]) <= 128;
        const textColor = isBgDark ? '#ffffff' : '#1e293b';

        mockupContainer.style.setProperty('--mock-bg', bgHex);
        mockupContainer.style.setProperty('--mock-sidebar', isBgDark ? lightenColor(bgHex, 5) : darkenColor(bgHex, 5));
        mockupContainer.style.setProperty('--mock-text', textColor);
        mockupContainer.style.setProperty('--mock-key', keyHex);
        mockupContainer.style.setProperty('--mock-sub', subHex);
        mockupContainer.style.setProperty('--mock-sub-alternative', subHex2);
        
        const textOnKey = getContrastYIQ(categoryMap.key.color.rgb || [100,100,100]) > 128 ? '#000000' : '#ffffff';
        mockupContainer.style.setProperty('--mock-text-on-key', textOnKey);
    }

    // Helper functions
    function rgbToHex(r, g, b) {
        const toHex = c => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) { h = s = 0; } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }

    function getContrastYIQ(rgb) {
        const [r, g, b] = rgb;
        return ((r * 299) + (g * 587) + (b * 114)) / 1000;
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            toast.innerText = `${text} 복사 완료! 🎉`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        });
    }

    // Mute helper for mockup sub elements
    function lightenColor(color, percent) {
        return adjustBrightness(color, percent);
    }
    function darkenColor(color, percent) {
        return adjustBrightness(color, -percent);
    }

    function adjustBrightness(color, percent) {
        let R = parseInt(color.substring(1,3),16);
        let G = parseInt(color.substring(3,5),16);
        let B = parseInt(color.substring(5,7),16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R<255)?R:255;  
        G = (G<255)?G:255;  
        B = (B<255)?B:255;  

        R = (R<0)?0:R;
        G = (G<0)?0:G;
        B = (B<0)?0:B;

        const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
        const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
        const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

        return "#"+RR+GG+BB;
    }
    // =======================================================
    // 📩 Feedback Modal & 🌐 다국어 지원 (i18n)
    // =======================================================

    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const closeModal = document.getElementById('close-modal');

    if (feedbackBtn && feedbackModal && closeModal) {
        feedbackBtn.addEventListener('click', () => feedbackModal.classList.add('active'));
        closeModal.addEventListener('click', () => feedbackModal.classList.remove('active'));
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) feedbackModal.classList.remove('active');
        });
    }

    // 📩 Dynamic Form Submit (AJAX/Fetch)
    const feedbackForm = document.querySelector('.feedback-form');
    const toastMessage = (msg) => {
        if (typeof showToast === 'function') {
            showToast(msg);
        } else {
            alert(msg);
        }
    };

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = '전송 중...';
            submitBtn.disabled = true;

            const formData = new FormData(feedbackForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(feedbackForm.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    toastMessage('소중한 피드백이 전송되었습니다!');
                    feedbackForm.reset();
                    if (feedbackModal) feedbackModal.classList.remove('active');
                } else {
                    toastMessage('전송 에러가 발생했습니다. n8n 워크플로우 활성화(Active) 상태와 인증을 확인해 주세요!');
                }
            } catch (err) {
                toastMessage('서버 연동 전송 중 에러가 발생했습니다. n8n 옵션을 확인해 주세요.');
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // 🌐 Translation Dictionary
    const translations = {
        ko: {
            tagline: "이미지에서 시맨틱 컬러를 추출하고 UI를 미리보세요.",
            ctrl_feedback: "의견 보내기",
            ctrl_support: "커피 후원하기",
            modal_title: "의견 보내기",
            modal_desc: "ChromaCanvas를 이용해 보신 소감이나 개선 사항을 전해 주시면 큰 도움이 됩니다!",
            form_name: "성함 (선택)",
            form_email: "받을 이메일",
            form_msg: "개선 요청 및 메시지",
            form_submit: "의견 전송하기",
            // 메인 UI 일부 번역 추가 가능
            drop_title: "이미지를 업로드 하세요",
            drop_sub: "또는 여기로 드래그 앤 드롭 하세요.",
            drop_btn: "파일 선택"
        },
        en: {
            tagline: "Extract semantic colors from images and preview UI immediately.",
            ctrl_feedback: "Send Feedback",
            ctrl_support: "Buy me a Coffee",
            modal_title: "Send Feedback",
            modal_desc: "Your thoughts and improvement requests help us grow significantly!",
            form_name: "Name (Optional)",
            form_email: "Your Email",
            form_msg: "Message / Suggestions",
            form_submit: "Send Message",
            drop_title: "Upload an Image",
            drop_sub: "or Drag & Drop here.",
            drop_btn: "Choose File"
        }
    };

    const langBtn = document.getElementById('lang-btn');
    const langText = document.getElementById('lang-text');
    let currentLang = localStorage.getItem('chroma_lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en');

    function updateLanguage() {
        if (langText) langText.innerText = currentLang === 'ko' ? 'English' : '한국어';
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang] && translations[currentLang][key]) {
                el.innerText = translations[currentLang][key];
            }
        });

        // 폼 인풋 placeholder 번역 대응
        if (currentLang === 'en') {
            document.getElementById('fb-name')?.setAttribute('placeholder', 'Your Name');
            document.getElementById('fb-email')?.setAttribute('placeholder', 'example@gmail.com');
            document.getElementById('fb-message')?.setAttribute('placeholder', 'Type your layout demands here...');
        } else {
            document.getElementById('fb-name')?.setAttribute('placeholder', 'Name');
            document.getElementById('fb-email')?.setAttribute('placeholder', 'example@gmail.com');
            document.getElementById('fb-message')?.setAttribute('placeholder', '메시지를 입력해 주세요...');
        }
    }

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ko' ? 'en' : 'ko';
            localStorage.setItem('chroma_lang', currentLang);
            updateLanguage();
        });
    }

    // 초기 언어 로드
    updateLanguage();

    // Tab Switching for Mockup
    const tabButtons = document.querySelectorAll('.tab-btn');
    const mockupFrames = document.querySelectorAll('.mockup-frame');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.getAttribute('data-target');
            mockupFrames.forEach(frame => {
                frame.classList.remove('active');
                if (frame.id === `tpl-${target}`) {
                    frame.classList.add('active');
                }
            });
        });
    });
});
