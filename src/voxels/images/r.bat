
setlocal ENABLEDELAYEDEXPANSION

for /r %%i in (voxel*.png) do (
    Set "File=%%~nxi"
    call :doit %%i !File!
    echo rename %%i 
)
goto :EOF


call :doit %%i


goto :EOF

:doit
echo %1 %2
set xtmp=%2
set xtmp=%xtmp:voxeltexture=voxel%
rename %1 !xtmp!
goto :EOF


:EOF
