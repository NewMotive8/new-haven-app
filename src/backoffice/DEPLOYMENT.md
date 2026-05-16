# Deployment Guide for engagd-backoffice

This guide explains how to deploy the engagd-backoffice service with nginx and SSL.

## Prerequisites

- PM2 is installed and the service is running on port 3015
- Nginx is installed on the server
- Domain `backoffice.hintx.org` is pointing to your server's IP address
- Root or sudo access to the server

## Step 1: Copy Nginx Configuration

Copy the nginx configuration file to the nginx sites-available directory:

```bash
sudo cp nginx-backoffice.hintx.org.conf /etc/nginx/sites-available/backoffice.hintx.org
```

## Step 2: Enable the Site

Create a symbolic link to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/backoffice.hintx.org /etc/nginx/sites-enabled/
```

## Step 3: Test Nginx Configuration

Test the nginx configuration for syntax errors:

```bash
sudo nginx -t
```

If the test passes, reload nginx:

```bash
sudo systemctl reload nginx
```

## Step 4: Set Up SSL Certificate

### Option A: Using the Setup Script (Recommended)

1. Edit `setup-ssl.sh` and update the email address:
   ```bash
   EMAIL="your-email@example.com"  # Change this line
   ```

2. Make the script executable:
   ```bash
   chmod +x setup-ssl.sh
   ```

3. Run the script:
   ```bash
   sudo ./setup-ssl.sh
   ```

### Option B: Manual Setup

1. Install certbot (if not already installed):
   ```bash
   sudo apt-get update
   sudo apt-get install -y certbot python3-certbot-nginx
   ```

2. Create the certbot webroot directory:
   ```bash
   sudo mkdir -p /var/www/certbot
   ```

3. Obtain the SSL certificate:
   ```bash
   sudo certbot certonly --webroot \
     --webroot-path=/var/www/certbot \
     --email your-email@example.com \
     --agree-tos \
     --no-eff-email \
     --domains backoffice.hintx.org
   ```

4. Test and reload nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Step 5: Verify Deployment

1. Check that PM2 is running:
   ```bash
   pm2 list
   pm2 logs engagd-backoffice
   ```

2. Test HTTP redirect:
   ```bash
   curl -I http://backoffice.hintx.org
   ```
   Should return a 301 redirect to HTTPS.

3. Test HTTPS:
   ```bash
   curl -I https://backoffice.hintx.org
   ```
   Should return a 200 OK response.

4. Open in browser:
   Navigate to `https://backoffice.hintx.org` in your browser.

## SSL Certificate Auto-Renewal

Certbot automatically sets up a renewal timer. To verify:

```bash
sudo systemctl status certbot.timer
```

To test renewal manually:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### Nginx won't start
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify configuration: `sudo nginx -t`

### SSL certificate issues
- Ensure DNS is pointing to your server: `dig backoffice.hintx.org`
- Check firewall allows ports 80 and 443
- Verify certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### Service not accessible
- Verify PM2 is running: `pm2 status`
- Check if port 3015 is listening: `sudo netstat -tlnp | grep 3015`
- Check nginx access logs: `sudo tail -f /var/log/nginx/backoffice.hintx.org.access.log`

### 502 Bad Gateway
- Check if the Next.js app is running on port 3015
- Verify firewall allows localhost connections
- Check PM2 logs: `pm2 logs engagd-backoffice`

## Firewall Configuration

If you're using UFW, allow HTTP and HTTPS:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

## Maintenance

### Viewing Logs
- Nginx access logs: `sudo tail -f /var/log/nginx/backoffice.hintx.org.access.log`
- Nginx error logs: `sudo tail -f /var/log/nginx/backoffice.hintx.org.error.log`
- PM2 logs: `pm2 logs engagd-backoffice`

### Restarting Services
- Restart nginx: `sudo systemctl restart nginx`
- Restart PM2 app: `pm2 restart engagd-backoffice`

### Updating SSL Certificate
Certificates auto-renew, but you can manually renew:
```bash
sudo certbot renew
sudo systemctl reload nginx
```
