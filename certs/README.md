# HTTPS 证书存放目录

将你的 SSL 证书放在这里：

- `private.key` - 你的私钥文件
- `certificate.crt` - 你的证书文件
- `ca-bundle.crt` - CA 证书链文件（可选，某些提供商需要）

## 使用 Let's Encrypt 免费证书（推荐）

如果你有域名，可以使用 Certbot 申请免费证书：

```bash
# 安装 Certbot（CentOS/RHEL）
sudo dnf install certbot

# 申请证书（替换成你的域名）
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到这里
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./private.key
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certificate.crt
sudo cp /etc/letsencrypt/live/your-domain.com/chain.pem ./ca-bundle.crt

# 重启服务即可启用 HTTPS
```

## 环境变量（可选）

如果你想使用其他路径的证书，可以设置环境变量：

```bash
export SSL_KEY_PATH=/path/to/your/private.key
export SSL_CERT_PATH=/path/to/your/certificate.crt
export SSL_CA_PATH=/path/to/your/ca-bundle.crt
```

证书放置好后，重启服务就会自动检测并启用 HTTPS。
