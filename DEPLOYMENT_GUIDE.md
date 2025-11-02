# Step-by-Step Guide: Deploy ScribeForge to Replit with scribeforge.com

## Part 1: Prepare Your Code for Replit

### Step 1.1: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click "Sign up" and create a free account
3. Verify your email

### Step 1.2: Upload Your Code to GitHub

#### Option A: Using GitHub Website (Easiest for Beginners)

1. **Create a new repository:**
   - Go to https://github.com/new
   - Repository name: `scribeforge` (or any name you want)
   - Make it **Public** or **Private** (your choice)
   - Click "Create repository"

2. **Upload your files:**
   - Scroll down to "uploading an existing file"
   - OR click the "upload files" button
   - Drag and drop ALL files from your `scribeforge` folder into the upload area
   - Important files to include:
     - All files in `app/` folder
     - All files in `components/` folder
     - `package.json`
     - `next.config.js`
     - `.replit`
     - `replit.nix`
     - `store.ts`
     - `tailwind.config.js`
     - `tsconfig.json`
     - `app/globals.css`
     - Any other files in your project
   
3. **Commit:**
   - Scroll to bottom
   - Type a message like "Initial commit"
   - Click "Commit changes"

#### Option B: Using Git (Command Line)

Open PowerShell in your `scribeforge` folder and run:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/scribeforge.git
git push -u origin main
```

(Replace `YOUR-USERNAME` with your actual GitHub username)

---

## Part 2: Import to Replit

### Step 2.1: Create Replit Account
1. Go to https://replit.com
2. Click "Sign up" (can use GitHub to sign up)
3. Complete registration

### Step 2.2: Import Your Repository
1. **In Replit dashboard, click the big "+" button** (top right) or "Create Repl"
2. **Click "Import from GitHub"** (look for the GitHub logo/icon)
3. **Find your repository:**
   - If connected to GitHub, you'll see a list of your repos
   - OR paste the URL: `https://github.com/YOUR-USERNAME/scribeforge`
4. **Select template:**
   - Choose "Node.js" from the template dropdown
5. **Name your Repl:**
   - Name: `scribeforge` (or whatever you want)
6. **Click "Import"**
7. Wait for Replit to import your code (this takes 1-2 minutes)

---

## Part 3: Configure Environment Variables

### Step 3.1: Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Log in to your OpenAI account
3. Click "Create new secret key"
4. Give it a name like "ScribeForge"
5. Copy the key (starts with `sk-`) - **YOU WON'T SEE IT AGAIN!**

### Step 3.2: Add API Key to Replit
1. **In Replit, look at the left sidebar** - find the lock icon 🔒 (labeled "Secrets" or "Environment variables")
2. **Click the lock icon**
3. **Click "New secret"** or the "+" button
4. **Fill in:**
   - **Key**: Type exactly: `OPENAI_API_KEY`
   - **Value**: Paste your OpenAI key (the `sk-...` one you copied)
5. **Click "Add secret"**
6. **Verify:** You should see `OPENAI_API_KEY` in the list

---

## Part 4: Install Dependencies & Test

### Step 4.1: Install Packages
1. **In Replit, look at the bottom panel** (the Console/Terminal)
2. **Type this command and press Enter:**
   ```
   npm install
   ```
3. **Wait** for it to finish (takes 1-2 minutes)
4. You should see "added X packages"

### Step 4.2: Test Your App
1. **Click the green "Run" button** (top center of Replit)
2. **Wait** for it to start (you'll see "ready" in the console)
3. **Look for the Webview tab** - a preview window should open
4. **Click the Webview** to see your app running
5. **Test it:**
   - Create a project
   - Paste some text
   - Click "Organize Text"
   - Try "Analyze Characters"

---

## Part 5: Deploy to Production

### Step 5.1: Enable Always On (Required for Custom Domain)
1. **Click the "Deploy" button** (top bar, next to Run)
2. **You'll see deployment options**
3. **Enable "Always On"** (if available)
   - Note: This requires Replit Hacker plan ($7/month)
   - Free accounts can't keep apps running 24/7

### Step 5.2: Build and Deploy
1. **In the Deploy section, click "Deploy"** or "Create deploy"
2. **Wait** for the build (takes 2-5 minutes)
3. You'll see a URL like: `scribeforge.your-username.repl.co`
4. **Click that URL** to test your deployed app

---

## Part 6: Connect Custom Domain (scribeforge.com)

### Step 6.1: Upgrade to Replit Hacker Plan (Required)
1. **In Replit, click your profile icon** (top right)
2. **Click "Billing" or "Upgrade"**
3. **Select "Hacker" plan** ($7/month)
4. **Complete payment**

### Step 6.2: Add Custom Domain in Replit

**Method 1: Through Webview Settings**
1. **Click the Webview tab** (where your app preview shows)
2. **Look for a gear icon ⚙️** or settings button
3. **Click "Custom domain"** or "Domain settings"
4. **Enter:** `scribeforge.com`
5. **Also add:** `www.scribeforge.com`
6. **Click "Save" or "Add"**

**Method 2: Through Deploy Settings**
1. **Click "Deploy" tab**
2. **Look for "Custom domain"** section
3. **Click "Add domain"**
4. **Enter:** `scribeforge.com`
5. **Click "Add"**

Replit will give you DNS instructions - **COPY THESE!**

### Step 6.3: Configure DNS at Your Domain Registrar

**Where did you buy scribeforge.com?** Go to that website (GoDaddy, Namecheap, Google Domains, etc.)

1. **Log in** to your domain registrar
2. **Find "DNS Settings"** or "DNS Management"
   - Might be under "Domains" → "Manage" → "DNS"
   - Or "Domain Settings" → "DNS Records"

3. **Add DNS Records:**

   **If using Cloudflare (Recommended - Free):**
   - Add your domain to Cloudflare first
   - Change your domain's nameservers to Cloudflare's
   - In Cloudflare DNS:
     ```
     Type: CNAME
     Name: www
     Target: your-repl-name.your-username.repl.co
     Proxy: ON (orange cloud)
     ```
     ```
     Type: CNAME
     Name: @
     Target: your-repl-name.your-username.repl.co
     Proxy: ON (orange cloud)
     ```

   **If using regular registrar:**
   - Add these records:
     ```
     Type: CNAME
     Name: www
     Value: your-repl-name.your-username.repl.co
     TTL: 3600
     ```
   - For root domain (`@`), contact Replit support or use Cloudflare

4. **Save** the DNS records

### Step 6.4: Wait for DNS Propagation
- **Wait 10 minutes to 48 hours** for DNS to update
- Check if it works: visit `https://scribeforge.com`
- Use https://dnschecker.org to see if DNS has propagated worldwide

---

## Troubleshooting

### "App not found" error
- Make sure you clicked "Run" or "Deploy"
- Check the Console for error messages
- Verify `npm install` completed successfully

### "OpenAI API key not configured"
- Check Secrets tab - is `OPENAI_API_KEY` spelled exactly right?
- Make sure you copied the ENTIRE key (starts with `sk-`)
- Try stopping and restarting the app

### Domain not working
- Wait longer (DNS can take up to 48 hours)
- Check DNS records at your registrar
- Verify domain is added in Replit
- Try `www.scribeforge.com` vs `scribeforge.com`

### App sleeps/stops working
- Free Replit accounts sleep after inactivity
- Upgrade to Hacker plan ($7/month) for Always On
- Or manually wake it up by clicking "Run"

---

## Summary Checklist

- [ ] Code pushed to GitHub
- [ ] Repl created in Replit
- [ ] OpenAI API key added to Secrets
- [ ] `npm install` completed
- [ ] App runs successfully (tested in Webview)
- [ ] Deployed to production
- [ ] Upgraded to Hacker plan (for custom domain)
- [ ] Custom domain added in Replit
- [ ] DNS records configured at registrar
- [ ] DNS propagated (wait 24-48 hours)
- [ ] https://scribeforge.com works!

---

## Quick Reference Links

- **GitHub**: https://github.com
- **Replit**: https://replit.com
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Cloudflare** (Free DNS): https://cloudflare.com
- **DNS Checker**: https://dnschecker.org

---

## Need Help?

If you get stuck:
1. Check the Console/Terminal in Replit for error messages
2. Take a screenshot of the error
3. Check Replit docs: https://docs.replit.com
4. Check Next.js docs: https://nextjs.org/docs

---

**Remember:** Custom domains and Always On require Replit Hacker plan ($7/month). The free plan will work, but the app will sleep after inactivity and you can only use Replit's provided URL (your-repl.repl.co).

