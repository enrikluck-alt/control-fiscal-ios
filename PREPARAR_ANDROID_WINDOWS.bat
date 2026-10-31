@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo    CONTROL FISCAL - ANDROID DESDE WINDOWS
 echo ==========================================
echo.
where node >nul 2>&1 || (echo ERROR: instala Node.js 22 o superior. & pause & exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm no encontrado. & pause & exit /b 1)
echo Introduce el ID OAUTH de tipo Aplicacion WEB, no el de Android.
set /p WEBCLIENT=ID OAuth web: 
if "%WEBCLIENT%"=="" (echo ERROR: el ID es obligatorio. & pause & exit /b 1)
call npm install --no-audit --no-fund || goto :fail
call npm run configure:android -- "%WEBCLIENT%" || goto :fail
call npm test || goto :fail
call npm run build:google || goto :fail
call npm run build:contacts || goto :fail
call npm run build:pdf || goto :fail
if not exist "android\settings.gradle" (
  call npx cap add android || goto :fail
)
call npx cap sync android || goto :fail
call npm run patch:android || goto :fail
echo.
echo Proyecto Android preparado. Abriendo Android Studio...
call npx cap open android || goto :fail
echo.
echo En Android Studio abre Gradle y ejecuta signingReport para conocer el SHA-1.
echo Registra la credencial OAuth Android en Google Cloud antes de iniciar sesion.
pause
exit /b 0
:fail
echo.
echo ERROR: no se completo la preparacion. Revisa el mensaje anterior.
pause
exit /b 1
