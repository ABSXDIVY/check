# 解决Git Pull冲突问题的详细步骤

## 问题分析

当执行 `git pull` 命令时出现以下错误：

```
error: Your local changes to the following files would be overwritten by merge:
        docker-compose.yml
        server/.env.example
Please commit your changes or stash them before you merge.
Aborting
```

这表明您的本地对这些文件进行了修改，而远程仓库也有新的更改，Git 无法自动合并这些更改。

## 解决方案

以下是几种处理方法，请按照步骤执行：

### 方法1：使用Git Stash（推荐）

```bash
# 1. 备份当前修改到stash
cd /opt/ethereum-attendance/check
git stash

# 2. 拉取最新代码
git pull

# 3. 查看stash中的更改
git stash list

# 4. 尝试应用stash中的更改（可能需要解决冲突）
git stash apply

# 5. 解决冲突（如果有）
# 使用编辑器查看并修改冲突文件
# 冲突部分会显示为：<<<<<<< Updated upstream 和 >>>>>>> Stashed changes 之间的内容

# 6. 标记冲突已解决并提交
git add docker-compose.yml server/.env.example
git commit -m "解决合并冲突，合并本地修改和远程更改"
```

### 方法2：保存本地修改为备份文件

如果您不想使用stash，可以先保存本地修改为备份文件：

```bash
# 1. 备份本地修改的文件
cd /opt/ethereum-attendance/check
cp docker-compose.yml docker-compose.yml.local_backup
cp server/.env.example server/.env.example.local_backup

# 2. 放弃本地修改，使用远程版本
git checkout -- docker-compose.yml
git checkout -- server/.env.example

# 3. 拉取最新代码
git pull

# 4. 手动合并您需要的修改
# 例如：比较备份文件和新文件的差异
# diff -u docker-compose.yml docker-compose.yml.local_backup

# 5. 根据需要，手动修改文件内容
nano docker-compose.yml
nano server/.env.example

# 6. 提交您的修改（如果需要）
git add docker-compose.yml server/.env.example
git commit -m "手动合并本地修改到最新代码"
```

## 继续部署流程

解决Git冲突后，继续按照之前的部署步骤进行：

```bash
# 1. 确保环境变量文件格式正确
cp .env.example .env
cp server/.env.example server/.env

# 2. 配置Docker镜像加速器（如果还没配置）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://registry.cn-hangzhou.aliyuncs.com", "https://docker.mirrors.ustc.edu.cn", "https://hub-mirror.c.163.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# 3. 运行修复部署脚本
chmod +x fix-deployment.sh
./fix-deployment.sh
```

## 注意事项

1. **保留重要配置**：确保在合并过程中不会丢失您的重要配置（如端口设置、数据库连接等）

2. **环境变量优先级**：
   - `.env` 文件（实际使用的配置）的优先级高于 `.env.example` 文件
   - 如果您已经正确配置了 `.env` 文件，可以不必担心 `.env.example` 的冲突

3. **备份重要数据**：在执行任何Git操作前，建议备份重要的配置文件和数据

4. **冲突解决技巧**：
   - 仔细检查冲突内容，理解本地修改和远程修改的区别
   - 保留您认为重要的配置，同时合并远程仓库的改进
   - 对于配置文件，通常最好使用远程仓库的新版本，然后手动添加您的特定配置

如果在解决冲突过程中遇到任何问题，请随时参考此文档或联系技术支持。