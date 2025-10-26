#!/bin/bash

# 安全处理服务器端Git冲突的脚本
echo "========================================"
echo "以太坊考勤系统 - Git冲突处理工具"
echo "========================================"
echo "此脚本用于解决服务器端有本地修改无法pull的问题"
echo ""

# 检查当前目录是否为git仓库
if [ ! -d ".git" ]; then
    echo "错误：当前目录不是Git仓库！"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

# 检查有哪些文件被修改
echo "服务器端当前修改的文件："
git status --porcelain

# 提供选项
echo ""
echo "请选择处理方式："
echo "1) 保存本地修改到临时分支，然后强制更新"
echo "2) 暂存(stash)本地修改，更新后再恢复"
echo "3) 放弃所有本地修改，强制更新（谨慎使用！）"
echo "4) 退出，不做任何操作"

echo ""
read -p "请输入选项编号 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "选项1：保存本地修改到临时分支..."
        
        # 创建临时分支
        TEMP_BRANCH="local-changes-$(date +%Y%m%d-%H%M%S)"
        echo "创建临时分支: $TEMP_BRANCH"
        
        git branch "$TEMP_BRANCH"
        
        # 切换到临时分支并提交本地更改
        echo "在临时分支上保存本地修改..."
        git checkout "$TEMP_BRANCH"
        git add .
        git commit -m "保存服务器端本地修改 $(date +%Y-%m-%d)"
        
        # 切回master分支并强制更新
        echo "切回master分支并强制更新..."
        git checkout master
        git fetch --all
        git reset --hard origin/master
        
        echo ""
        echo "✅ 操作完成！"
        echo "- 您的本地修改已保存到分支: $TEMP_BRANCH"
        echo "- master分支已更新到最新版本"
        echo "- 如需合并本地修改，请使用: git merge $TEMP_BRANCH"
        ;;
    
    2)
        echo ""
        echo "选项2：使用stash暂存本地修改..."
        
        # 暂存本地更改
        echo "暂存本地修改..."
        git stash
        
        # 拉取最新代码
        echo "拉取最新代码..."
        git pull origin master
        
        # 恢复本地修改
        echo "恢复本地修改..."
        git stash apply
        
        echo ""
        echo "✅ 操作完成！"
        echo "- 本地修改已恢复并与最新代码合并"
        echo "- 请检查是否有合并冲突并手动解决"
        ;;
    
    3)
        echo ""
        echo "⚠️  警告：选项3将永久放弃所有本地修改！"
        read -p "确定要继续吗？(y/n): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo "放弃本地修改并强制更新..."
            
            # 放弃所有未跟踪的文件和目录
            git clean -fd
            
            # 强制重置到远程master
            git fetch --all
            git reset --hard origin/master
            
            echo ""
            echo "✅ 操作完成！"
            echo "- 所有本地修改已被放弃"
            echo "- 代码已更新到远程仓库的最新版本"
        else
            echo "操作已取消"
        fi
        ;;
    
    4)
        echo ""
        echo "已取消操作，无任何更改"
        exit 0
        ;;
    
    *)
        echo ""
        echo "无效的选项，请重新运行脚本"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "处理完成！请检查项目状态并进行必要的调整"
echo "========================================"