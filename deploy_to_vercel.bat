@echo off
title Vercel Deploy Helper
echo ==========================================
echo  ChromaCanvas Vercel Deploy Helper
echo ==========================================
echo.
echo [1/3] Vercel CLI를 실행합니다.
echo.
echo >> 처음 실행하신다면 이메일 인증(로그인)이 발생할 수 있습니다.
echo >> 질문이 나오면 엔터(Enter)만 누르셔도 기본값으로 배포됩니다.
echo.
npx vercel
echo.
echo ==========================================
echo 배포 프로세스가 완료되었습니다.
echo ==========================================
pause
