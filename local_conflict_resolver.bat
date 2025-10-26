@echo off

REM 本地Git冲突解决脚本
REM 使用方法：双击运行此脚本，按照提示操作

color 0A
echo ===============================================
echo         本地Git冲突解决助手
 echo ===============================================
echo 此脚本将帮助您解决本地与远程仓库的Git冲突
 echo 完成后，服务器端将可以直接执行 git pull
 echo ===============================================

REM 检查是否在项目根目录
if not exist ".git" (
    echo 错误：请在项目根目录下运行此脚本！
    pause
    exit 1
)

:main_menu
echo.
echo 请选择操作：
echo 1. 方法一：使用Git Stash（推荐）
echo 2. 方法二：备份并重置本地修改
echo 3. 查看当前Git状态
echo 4. 退出

echo.
set /p choice=请输入选择 (1-4): 

if "%choice%"=="1" goto method_stash
if "%choice%"=="2" goto method_backup
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto exit_script

echo 无效的选择，请重新输入！
pause
goto main_menu

:method_stash
cls
echo ===============================================
echo            方法一：使用Git Stash
 echo ===============================================

echo 步骤1：保存本地更改到stash...
git stash save "临时保存本地配置更改"

if errorlevel 1 (
    echo 错误：保存stash失败！
    pause
    goto main_menu
)

echo 步骤2：拉取最新代码...
git pull

if errorlevel 1 (
    echo 错误：拉取代码失败！
    pause
    goto main_menu
)

echo 步骤3：应用stash中的更改...
git stash pop

if errorlevel 1 (
    echo 警告：应用stash时发生冲突，需要手动解决！
    echo 请使用编辑器打开冲突文件并解决冲突。
    echo 冲突文件可能包括：
    echo - docker-compose.yml
    echo - server/.env.example
    echo.
    echo 解决冲突后，请手动执行：
    echo git add docker-compose.yml
    echo git add server/.env.example
    echo git commit -m "解决本地与远程的配置文件冲突"
    echo git push
    pause
    goto main_menu
)

echo 步骤4：查看当前状态...
git status

echo.
echo 成功！是否立即推送到远程仓库？(Y/N)
set /p push_choice=

if /i "%push_choice%"=="Y" (
    echo 正在推送到远程仓库...
    git push
    if errorlevel 1 (
        echo 错误：推送失败！
    ) else (
        echo 推送成功！服务器现在可以直接执行 git pull
    )
    pause
) else (
    echo 请稍后手动执行 git push 将更改推送到远程仓库
    pause
)

goto main_menu

:method_backup
cls
echo ===============================================
echo        方法二：备份并重置本地修改
 echo ===============================================

REM 修复时间格式问题，确保小时数不会有空格
set "hour=%time:~0,2%"
if "%hour:~0,1%"==" " set "hour=0%hour:~1%"
mkdir backup_%date:~0,4%%date:~5,2%%date:~8,2%_%hour%%time:~3,2% 2>nul
set backup_dir=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%hour%%time:~3,2%

if exist "docker-compose.yml" (
    echo 备份 docker-compose.yml...
    copy "docker-compose.yml" "%backup_dir%\docker-compose.yml.backup"
)

if exist "server\.env.example" (
    echo 备份 server/.env.example...
    mkdir "%backup_dir%\server" 2>nul
    copy "server\.env.example" "%backup_dir%\server\.env.example.backup"
)

echo 步骤1：重置本地修改...
git checkout -- docker-compose.yml
if exist "server\.env.example" (
    git checkout -- server/.env.example
)

echo 步骤2：拉取最新代码...
git pull

if errorlevel 1 (
    echo 错误：拉取代码失败！
    pause
    goto main_menu
)

echo 步骤3：请手动合并配置
if exist "%backup_dir%" (
    echo 备份文件已保存在 %backup_dir% 目录
    echo 请使用文本编辑器比较备份文件和最新文件
    echo 并手动将需要的配置复制到新文件中
    pause
)

echo 合并完成后，请手动执行：
git add docker-compose.yml
if exist "server\.env.example" (
    echo git add server/.env.example
)
echo git commit -m "合并备份的配置到最新版本"
echo git push

echo.
pause
goto main_menu

:check_status
cls
echo ===============================================
echo             当前Git状态
 echo ===============================================
git status
echo.
pause
goto main_menu

:exit_script
echo 感谢使用Git冲突解决助手！
pause
color 07
exit 0