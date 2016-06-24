
setlocal ENABLEDELAYEDEXPANSION

for /r %%i in (voxel*.js) do (
    Set "File=%%~nxi"
    copy /b %%i+end.txt %%i2
    copy %%i2 %%i
)
goto :EOF


call :doit %%i


goto :EOF

:doit
set xtmp =%1
set xtmp=!xtmp:voxel_nfo=voxel!
echo %xtmp%
goto :EOF


:EOF
