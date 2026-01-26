# 🔍 RESOLVER DEBUG GUIDE

## Issue Description
Public URL returns "Not Found" instead of displaying links based on priority.

## Potential Causes

### 1. Hub Not Found
- Hub doesn't exist in database
- Hub `isActive` is false
- Slug mismatch (case sensitivity already handled)

### 2. No Active Links
- All links have `isActive = false`
- Links exist but are filtered out by rules

### 3. Rules Filtering Too Aggressively
- Time rules excluding all links
- Device rules not matching visitor device
- Geo rules blocking visitor country
- Performance rules requiring minimum clicks

### 4. Frontend API Call Issues
- Wrong API URL
- CORS blocking request
- Response parsing error

## Debug Steps

### Step 1: Check Database
```sql
-- Check if hub exists and is active
SELECT id, slug, title, is_active FROM hubs WHERE slug = 'your-slug';

-- Check links for that hub
SELECT id, title, url, is_active, priority_score FROM links WHERE hub_id = YOUR_HUB_ID;

-- Check rules for those links
SELECT r.id, r.link_id, r.type, r.value 
FROM rules r 
JOIN links l ON r.link_id = l.id 
WHERE l.hub_id = YOUR_HUB_ID;
```

### Step 2: Check Backend Logs
Look for these console.log messages:
- `🔍 Resolver Service - Incoming Request`
- `✅ Hub found`
- `📊 Raw links from database`
- `🔍 Evaluating link`
- `🎯 Filtered and sorted links`

### Step 3: Check Frontend Network Tab
- API call to `/api/resolve/:slug`
- Response status (200, 404, 500)
- Response body structure

### Step 4: Test with No Rules
Create a test link with:
- `isActive = true`
- No rules attached
- Should always show

## Common Issues & Fixes

### Issue: All links filtered out by rules
**Symptom**: Backend logs show links in database but 0 after filtering
**Fix**: 
1. Check if rules are too restrictive
2. Temporarily remove all rules to test
3. Check device detection (mobile vs desktop)
4. Check country detection (VPN might cause issues)

### Issue: Hub not found
**Symptom**: Backend returns 404
**Fix**:
1. Verify hub exists: `SELECT * FROM hubs WHERE slug = 'your-slug'`
2. Check `is_active` field
3. Verify slug matches exactly (case-insensitive)

### Issue: Links exist but not showing
**Symptom**: Backend returns empty links array
**Fix**:
1. Check `is_active` on links
2. Check if rules are filtering them out
3. Look at backend logs for rule evaluation

### Issue: Frontend shows "Not Found"
**Symptom**: PublicHub shows 404 even though backend returns data
**Fix**:
1. Check API URL in frontend
2. Check CORS configuration
3. Check response parsing in PublicHub.tsx
4. Check browser console for errors

## Quick Test Script

Run this in your database to create a test hub with a simple link:

```sql
-- Create test hub
INSERT INTO hubs (user_id, slug, title, is_active) 
VALUES ('your-user-id', 'test-hub', 'Test Hub', true);

-- Create test link (no rules)
INSERT INTO links (hub_id, url, title, is_active, priority_score)
VALUES (
  (SELECT id FROM hubs WHERE slug = 'test-hub'),
  'https://example.com',
  'Test Link',
  true,
  100
);
```

Then visit: `http://localhost:5173/h/test-hub`

## Expected Behavior

1. **Backend receives request**: `/api/resolve/test-hub`
2. **Backend finds hub**: Logs "✅ Hub found"
3. **Backend finds links**: Logs "📊 Raw links from database"
4. **Backend evaluates rules**: Logs "🔍 Evaluating link" for each
5. **Backend returns filtered links**: Logs "🎯 Filtered and sorted links"
6. **Frontend receives response**: `{ success: true, data: { hub, links } }`
7. **Frontend displays links**: Shows link cards

## Current Implementation Check

### Rules Engine Logic
- **No rules**: Link shows by default ✅
- **Time rules**: Checks HH:mm range
- **Device rules**: Checks mobile/desktop/tablet
- **Geo rules**: Checks country (skips if unknown)
- **Performance rules**: Checks click count

### Default Behavior
- Links with NO rules should ALWAYS show
- Links with rules must pass ALL rules to show
- If ALL links filtered out, returns "No links currently active for your context"

## Action Items

1. [ ] Check backend logs when accessing public URL
2. [ ] Verify hub exists and is active in database
3. [ ] Verify links exist and are active
4. [ ] Check if rules are filtering links
5. [ ] Test with a link that has no rules
6. [ ] Check frontend network tab for API response
7. [ ] Check browser console for errors
