# Quick Start Guide

## Installation & First Use

### Option 1: Try It Now (Web App)

1. **Open the app**: [Ekskursje Reader](./index.html)
2. **Paste a URL**: Enter any WordPress blog post URL (e.g., `https://ekskursje.pl/...`)
3. **Analyze**: Click "Analyze & Load Comments"
4. **Explore**: Use the sidebar to browse threads

**That's it!** Your reading progress is saved automatically.

---

### Option 2: Bookmarklet (On Your Blog)

The easiest way to use Ekskursje Reader directly on any blog:

#### Setup (one-time) 

1. **Right-click your browser's bookmark bar** and select "Add Page"
2. **Enter this title**: `Ekskursje Reader`
3. **Paste this URL** (the entire thing):
   ```javascript
   javascript:(function(){const s=document.createElement('script');s.src='https://alfonsnawrocki.github.io/exkursjereader/bookmarklet.js';document.head.appendChild(s)})();
   ```
4. **Click Save**

#### Usage

1. Go to any WordPress blog post with comments
2. **Click the "Ekskursje Reader" bookmark** in your toolbar
3. A side panel appears showing all threads
4. Click any thread to highlight all its comments

**Tip**: The script works best with the newest comments loaded on the page.

---

### Option 3: Manual Deployment

Host the web app yourself:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000/index.html`

---

## Feature Tour

### 📊 Dashboard

When you analyze a blog post, you see:

- **Total Threads**: Number of conversation groups detected
- **Total Comments**: Total comments on the post
- **Unread Count**: How many you haven't read yet

### 🧵 Thread Sidebar

Lists all detected threads with:
- **Author name** (who started the thread)
- **Comment count** (total in thread)
- **Unread indicator** (yellow = has unread)

Click any thread to:
- ✨ Highlight all comments in that thread
- 🔽 Filter to show only that thread
- ↙️ Scroll to first comment

### 💬 Comments View

Each comment shows:
- **Author** and **date**
- **Color indicator**:
  - 🟡 Yellow = Unread
  - ⚪ Gray = Read
- **Thread info** (which thread it's in, position)
- **Mark Read/Unread button** (forces status)

### 🔍 Filters

- **All** - Everything
- **Unread Only** - Skip the boring stuff
- **Read** - Review what you've seen
- **Mark All Read** - Done with this thread!

---

## Tips & Tricks

### 💡 Pro Moves

1. **Fastest way to catch up**: Filter "Unread Only" and scan quickly

2. **Follow a conversation**: Click thread → read comments top to bottom

3. **Track your progress**: Yellow highlight shows what's left

4. **Pick up where you left off**: 
   - App remembers read/unread status
   - Different blog posts are tracked separately

5. **Reset for a thread**: 
   - Click thread → "Mark All Read"
   - Click "Unread Only" to see just new responses

### 🎯 Best Practices

- **Scroll through comments** instead of clicking mark buttons
  - They auto-detect viewing
  
- **Use "Unread Only" filter** to focus on new discussions

- **Read in thread order** rather than chronological
  - Easier to follow related ideas

- **Come back later** - Your progress is always saved!

---

## Troubleshooting

### "No comments found"

**Problem**: The app says no comments detected  
**Cause**: 
- You're on the homepage (not a post)
- Comments are disabled
- Comments are in an unusual format

**Solution**:
- Try a different post
- Make sure comments are visible on the page
- Check browser console for errors

### Comments not organized into threads

**Problem**: Everything seems like one big thread  
**Cause**: Comments might not have @ mentions or reply links

**Solution**:
- This is normal for some blogs!
- The app still shows read/unread status
- Read in the sidebar click shortcuts

### Reading status not saving

**Problem**: I marked a comment as read but it shows as unread  
**Cause**: Browser storage disabled or data cleared

**Solution**:
- Check browser privacy settings
- Allow cookies for this domain
- Try a different browser
- Storage is per-browser (not synced)

### Bookmarklet not working

**Problem**: Clicking the bookmark does nothing  
**Cause**:
- Bookmark not installed correctly
- JavaScript disabled
- CORS issues

**Solution**:
1. Delete and re-create the bookmark
2. Check browser console (F12) for errors
3. Copy the entire JS URL exactly
4. Try in an incognito/private window

---

## Understanding the Science

### How Thread Detection Works

The app uses three methods to find related comments:

1. **Reply Links** (if the blog supports it)
   - WordPress "in reply to" data
   - Most accurate!

2. **@ Mentions** 
   - `@Author I agree` patterns
   - Good accuracy

3. **Quoted Text**
   - Long indented blocks or `>` symbols
   - More experimental

The algorithms combine all three using "confidence scoring" to determine which comments belong together.

### Why No Manual Thread Selection?

You asked for algorithms that don't require clicking! The app tries its best to automatically group conversations. Most blog comments DO have enough signals (mentions, quotes, order) that the algorithms work well.

If grouping isn't perfect for your blog, it's likely due to:
- Unique comment syntax
- Polish language-specific patterns
- Custom WordPress theme

We can customize! Open an issue with a blog URL.

---

## Data Privacy

✅ **No tracking** - No analytics, no external services  
✅ **Local storage only** - Data stored in your browser  
✅ **No servers** - (Except fetching the blog page)  
✅ **No sync** - Progress not shared between devices  
✅ **Clear anytime** - Browser settings → Clear browsing data

Your reading list is private and never leaves your device.

---

## Use Cases

### Student/Academic Discussion

Track lengthy paper discussions:
> "I found an issue with the methodology. @Author1 did you consider limitation X?"
> 
> > "Limitation X is actually addressed in Table 3"
> 
> Thanks, I missed that. @Author2 do you agree?"

The app automatically links these together.

### Tech Blog Comments

Follow debugging sessions:
- Commenter A: "Getting error X"
- @Commenter A: "Try updating your deps"
- @Commenter B: "Worked! Here's what I found"

Thread view shows the full problem-solving arc.

### News Article Discussions

Navigate heated debates:
- Political/social articles often have multiple sub-conversations
- Threads organize by topic area
- Unread highlighting lets you see new rebuttals

---

## Keyboard Shortcuts

Currently disabled for simplicity, but could add:

- `j` / `k` - Navigate next/previous comment
- `r` - Mark current as read
- `u` - Mark current as unread  
- `t` - Focus thread list
- `?` - Show help

Let us know if you'd like these!

---

## Gallery Examples

### Example 1: Climate Discussion

```
🧵 Thread 1: Alice (5 comments)
   └─ Alice: What about CO2 levels?
   └─ Bob: @Alice Here's the data
   └─ Alice: Thanks, this context helps
   └─ Charlie: Worth noting recent studies show...
   └─ Bob: @Charlie Good addition

🧵 Thread 2: David (3 comments)
   └─ David: Separate question about solutions?
   └─ Elena: @David Yes, solar is promising
   └─ David: Thanks for the insights
```

### Example 2: Code Review

```
🧵 Thread 1: Dev1 (8 comments) ⚡ 3 unread
   └─ Dev1: Why use async here?
   └─ Reviewer: @Dev1 Can block the main thread
   └─ Dev1: Got it, refactoring to...
   └─ (continues detailed discussion)

🧵 Thread 2: Dev2 (4 comments)
   └─ Dev2: Question on performance trade-off
   └─ Reviewer: (quote) "This line is O(n²)"
   └─ Reviewer: Could use HashMap instead
```

---

## Feedback & Support

Found a bug or have ideas?

**For improvements:**
- Open an issue on GitHub
- Include the blog URL
- Screenshot of the problem

**For features:**
- Suggest in discussions
- Describe your use case
- Vote on others' ideas

---

## Next Steps

1. ✅ Try the web app with an ekskursje.pl URL
2. ✅ Install the bookmarklet
3. ✅ Report any themes that don't work
4. ✅ Share how it improves your reading!

Happy reading! 🎉

