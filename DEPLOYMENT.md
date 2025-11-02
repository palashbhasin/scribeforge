# Deploying ScribeForge on Replit with Custom Domain

## Step 1: Push Your Code to GitHub/GitLab

1. Create a new repository on GitHub or GitLab
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## Step 2: Import to Replit

1. Go to [Replit](https://replit.com)
2. Click **"+ Create Repl"**
3. Select **"Import from GitHub"**
4. Paste your repository URL
5. Choose **"Node.js"** as the template
6. Click **"Import"**

## Step 3: Configure Replit Files

The following files should already be in your repo:
- `.replit` - Replit configuration
- `replit.nix` - Nix package configuration

## Step 4: Set Environment Variables

1. In Replit, click on the **"Secrets"** tab (lock icon) in the left sidebar
2. Add your OpenAI API key:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-openai-key-here`
3. Click **"Add Secret"**

## Step 5: Install Dependencies

Replit should auto-install, but if not:
1. Open the Shell/Console
2. Run: `npm install`

## Step 6: Update .replit for Production

The `.replit` file is already configured, but verify:
- `run = "npm run dev"` for development
- `[deploy].run` for production deployment

## Step 7: Connect Custom Domain (scribeforge.com)

### In Replit:

1. Click on the **"Webview"** tab
2. Look for **"Always On"** option and enable it (Replit Pro/Hacker plan)
3. Click on the **"Webview"** settings/gear icon
4. Look for **"Custom Domain"** or **"Domain"** settings
5. Enter: `scribeforge.com` and `www.scribeforge.com`

### DNS Configuration (At Your Domain Registrar):

Go to your domain registrar (where you bought scribeforge.com) and add these DNS records:

#### Option A: CNAME (Recommended for subdomains)
```
Type: CNAME
Name: www
Value: your-repl-name.your-username.repl.co
TTL: 3600
```

#### Option B: A Record (For root domain)
```
Type: A
Name: @
Value: [Replit IP Address] (get from Replit support)
TTL: 3600
```

#### Option C: CNAME for Root (If supported by registrar)
Some registrars (like Cloudflare) support CNAME for root:
```
Type: CNAME
Name: @
Value: your-repl-name.your-username.repl.co
TTL: 3600
```

**Note**: For the root domain (`scribeforge.com`), you may need to:
- Use Cloudflare (supports CNAME flattening)
- Or contact Replit support for A record IP addresses

## Step 8: Configure Next.js for Production Port

Replit provides a `PORT` environment variable. Update your start script:

The current setup should work, but verify `.replit` has:
```toml
[env]
PORT = "3000"
```

## Step 9: Deploy

1. In Replit, click the **"Deploy"** button (or use the Deploy tab)
2. Follow the deployment wizard
3. Enable **"Always On"** if available (Replit Pro/Hacker plan required)
4. Your app will build and deploy automatically

## Step 10: Verify Deployment

1. Visit `https://scribeforge.com` (may take a few minutes for DNS propagation)
2. Test the "Organize Text" feature
3. Test the "Analyze Characters" feature with your OpenAI API key

## Troubleshooting

### App Not Loading:
- Check Replit logs in the Console
- Verify `OPENAI_API_KEY` is set in Secrets
- Ensure Always On is enabled (for persistent hosting)

### Domain Not Working:
- Wait 24-48 hours for DNS propagation
- Verify DNS records at your registrar
- Check Replit's domain settings
- Try accessing via `your-repl-name.your-username.repl.co` first

### Build Errors:
- Check Node.js version (should be 18.x)
- Run `npm install` manually
- Check console for specific error messages

### Port Issues:
- Replit uses the `PORT` env var automatically
- Next.js will use it if available

## Replit Plans

- **Free**: Shared hosting, sleeps after inactivity
- **Hacker ($7/mo)**: Always On, faster, custom domains
- **Pro ($20/mo)**: More resources, priority support

**Note**: Custom domains and Always On typically require Hacker plan or higher.

## Alternative: Use Replit's Built-in Domain

If custom domain setup is complex, Replit provides:
- `your-repl-name.your-username.repl.co`
- Free SSL certificate
- No DNS configuration needed

---

For more help, check:
- [Replit Docs](https://docs.replit.com)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
