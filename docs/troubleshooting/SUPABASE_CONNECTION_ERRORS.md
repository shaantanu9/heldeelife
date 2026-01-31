# Supabase Connection Errors - Troubleshooting Guide

## Common Error: `ENOTFOUND` / `fetch failed`

### Error Message
```
TypeError: fetch failed
Error: getaddrinfo ENOTFOUND jwkduwxvxtggpxlzgyan.supabase.co
```

### What This Means
The DNS lookup for your Supabase hostname failed. The system cannot resolve the hostname to an IP address.

### Possible Causes

1. **Supabase Project is Paused**
   - Free tier projects pause after inactivity
   - Project may have been manually paused

2. **Incorrect SUPABASE_URL**
   - URL in `.env.local` is wrong
   - Project ID mismatch

3. **Network Connectivity Issues**
   - Internet connection problem
   - DNS server issue
   - Firewall blocking connection

4. **Supabase Project Deleted**
   - Project was deleted from Supabase dashboard

### Solutions

#### 1. Check Supabase Project Status

1. Go to https://supabase.com/dashboard
2. Check if your project is listed
3. Check project status (should be "Active")
4. If paused, click "Resume" or "Restore"

#### 2. Verify Environment Variables

Check your `.env.local` file:

```env
SUPABASE_URL=https://jwkduwxvxtggpxlzgyan.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://jwkduwxvxtggpxlzgyan.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
SUPABASE_ANON_KEY=your_key_here
```

**To get correct values:**
1. Go to Supabase Dashboard → Your Project
2. Settings → API
3. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Run Diagnostic Script

```bash
npm run check:supabase
```

This will:
- Check environment variables
- Test DNS resolution
- Test Supabase connection
- Provide specific error messages

#### 4. Test Network Connectivity

```bash
# Test DNS resolution
nslookup jwkduwxvxtggpxlzgyan.supabase.co

# Test HTTP connection
curl https://jwkduwxvxtggpxlzgyan.supabase.co
```

#### 5. Check Project in Supabase Dashboard

1. Visit: https://supabase.com/dashboard/project/jwkduwxvxtggpxlzgyan
2. Check project status
3. If paused, resume it
4. Verify API keys are correct

### Quick Fix Checklist

- [ ] Check Supabase dashboard - project is active
- [ ] Verify `.env.local` has correct `SUPABASE_URL`
- [ ] Verify API keys are correct
- [ ] Run `npm run check:supabase`
- [ ] Check internet connection
- [ ] Restart development server after fixing `.env.local`

### If Project is Paused

1. Go to Supabase Dashboard
2. Find your project
3. Click "Resume" or "Restore"
4. Wait for project to become active (1-2 minutes)
5. Try again

### If Project is Deleted

1. Create a new Supabase project
2. Update `.env.local` with new project URL and keys
3. Run migrations to recreate database schema
4. Re-seed data if needed

### Prevention

1. **Keep Free Tier Projects Active**
   - Use project regularly
   - Or upgrade to paid plan

2. **Backup Environment Variables**
   - Keep `.env.local` in secure location
   - Document project ID

3. **Monitor Project Status**
   - Check Supabase dashboard regularly
   - Set up alerts if possible

---

## Other Common Errors

### `ECONNREFUSED`
- Connection refused by server
- Usually means project is paused
- Solution: Resume project in dashboard

### `JWT` / Authentication Errors
- Invalid API keys
- Solution: Update keys in `.env.local`

### `relation does not exist`
- Table doesn't exist in database
- Solution: Run migrations or seed script

---

## Getting Help

If none of these solutions work:

1. Run diagnostic: `npm run check:supabase`
2. Check Supabase status page: https://status.supabase.com
3. Check Supabase Discord/Support
4. Review error logs for specific error codes

---

**Last Updated**: 2025-01-27







