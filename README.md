# 🎨 ChromaCanvas - Palette Extractor

**ChromaCanvas**는 이미지에서 시맨틱 색상(Background, Key Color, Sub Colors)을 지능적으로 추출하고, 이를 5가지 종류의 Dense UI 템플릿(Landing Page, SaaS Dashboard 등)에 실시간으로 적용하여 디자인 조합을 볼 수 있는 프리미엄 색상 추출 피커 웹 애플리케이션입니다.

---

## 🚀 실시간 배포 결과
*   **Vercel 배포 주소**: `https://chroma-canvas.vercel.app` (또는 사용자님의 Vercel 링크)
*   **Git 저장소**: `https://github.com/hammarbae/chroma-canvas`

---

## 🌟 주요 기능 (Key Features)

### 1. 지능형 색상 추출 & 연계
*   **드래그 앤 드롭 지원**: 이미지를 화면에 던져 넣으면 즉각 분석합니다.
*   **컬러 카테고라이징**: 배경(Background), 강조(Key Color), 보조(Sub Color) 색상을 스마트 알고리즘으로 분리합니다.
*   **실시간 카테고리 스왑**: 추출된 색상의 레이블을 드래그하여 서로 위치를 바꾸면 UI 조합이 즉각 갱신됩니다.

### 2. Live UI 템플릿 미리보기 (5종)
*   **구조**: Landing Page, SaaS Dashboard, Commerce, Digital Magazine, Analytics
*   **퀄리티**: 더 빽빽하고 사실적인 Dense 텍스트 데이터와 그리드 구조로 실제 운영되는 사이트 같은 리얼리티를 유지합니다.

### 3. 글로벌 & 피드백 시스템 (AUX)
*   **다국어 지원(i18n)**: 한국어/영어 즉시 전환 버튼 지원.
*   **비동기 피드백 모달**: n8n Webhook 연동을 통해 전송 시 화면 유지 & 하단 비동기 알림 트랩 기능 탑재.
*   **후원 기능**: Buy Me a Coffee / Ko-Fi 링크 연계 구조 마련.

---

## ⚙️ 연동 백엔드 구조 (n8n & Vercel)

### 📊 피드백 자동화 파이프라인
*   **흐름**: 웹사이트 모달 폼 ➡️ n8n Webhook (`POST`) ➡️ **Google Sheets** ( Append Row )
*   **결과**: 방문자가 피드백을 남기면 사용자님의 구글 시트 데이터베이스에 실시간으로 백업 적층됩니다.

---

## 📂 프로젝트 파일 구조

```text
├── index.html       # 메인 정적 HTML 구조 (모달, 템플릿, 컨트롤러 등)
├── style.css       # 메인 CSS 스타일 디자인 (다크모드 오로라 글래스모피즘 등)
├── script.js        # 피커 연산 로직, 다국어 처리, AJAX 피드백 전송 전용 스크립트
├── favicon.png      # 3D 렌더링을 활용한 메인 파비콘 아이콘
└── README.md        # 배포 및 연동 상태 요약 가이드 (본 문서)
```

---

## 🛠️ 개발 관리자 가이드

앞으로 코드를 수정하고 실시간으로 배포 주소에 업데이트하려면, 폴더 내부의 **배치 파일**을 활용하실 수 있습니다.

1.  수정 후 **`github_push_helper.bat`** 파일을 더블 클릭하면 자동으로 GitHub 업데이트가 가동됩니다.
2.  GitHub에 올라가는 즉시 **Vercel 자동 배포가 유도**되어 10초 뒤 도메인 사이트에 즉각 반영됩니다.
