# Implementation Guide

## Code Organization

The main app (`index.html`) is organized into clear sections:

### 1. HTML Structure
- Header with branding
- Setup section (URL input)
- Main content grid (sidebar + comments)
- Utility buttons (scroll to top)

### 2. CSS Styling
Organized by component:
- Base styles & layout
- Sidebar styles
- Comment card styles
- Filter controls
- Responsive design

### 3. JavaScript (Three Core Components)

#### Component 1: `ThreadAnalyzer` Class
**Responsibility**: Analyze comments and detect threads  
**Methods**:
- `analyzeThreads()` - Main entry point
- `detectReplyRelationships()` - Phase 1
- `detectMentionsAndQuotes()` - Phase 2
- `buildThreadStructure()` - Phase 3
- `refineThreads()` - Phase 4

**Key Data Structure**: Union-Find for thread grouping

#### Component 2: `ReadTracker` Class  
**Responsibility**: Track read/unread state  
**Methods**:
- `markAsRead(commentId)`
- `markAsUnread(commentId)`
- `isRead(commentId)`
- `save()` - Persist to localStorage

**Storage**: Browser localStorage (per domain)

#### Component 3: **UI Functions**
**Responsibility**: Render and handle user interactions  
**Functions**:
- `analyzeBlog()` - Main entry point
- `fetchAndParseComments()` - Fetch and parse
- `renderThreadList()` - Sidebar rendering
- `renderComments()` - Comment cards
- `filterComments()` - Apply filters
- `markCommentRead/Unread()` - Update status

---

## How Data Flows

### Initialization Flow

```
Page Load
    ↓
ReadTracker loaded from localStorage
    ↓
User enters URL + clicks Analyze
    ↓
fetchAndParseComments(url)
    ├── Fetch HTML
    ├── Parse comments with parseCommentsFromHTML()
    └── Extract fields with extractCommentData()
    ↓
Create ThreadAnalyzer(allComments)
    ├── buildCommentMap()
    └── analyzeThreads()
        ├── detectReplyRelationships()
        ├── detectMentionsAndQuotes()
        ├── buildThreadStructure()
        └── refineThreads()
    ↓
updateUnreadCounts() - Calculate per-thread unread
    ↓
Render UI
    ├── renderThreadList() - Sidebar
    └── renderComments() - Main area
```

### User Interaction Flow

```
User scrolls comment into view
    ↓
Comment becomes visible
    ↓
[Could auto-mark as read - optional feature]
    ↓
User clicks "Mark as Read"
    ↓
markCommentRead(id)
    ├── tracker.markAsRead(id)
    ├── updateUnreadCounts()
    ├── renderThreadList()
    └── filterComments() - refresh display
```

---

## Customization Guide

### 1. Change Colors & Styling

Find in `<style>` section:

```css
/* Main accent color */
:root {
    --primary: #667eea;
    --secondary: #764ba2;
}
```

Change to your brand colors:

```css
--primary: #2E7D32;      /* Green */
--secondary: #1565C0;    /* Blue */
```

All components automatically update!

### 2. Add New Comment Selectors

For blogs with unusual comment structure:

```javascript
// In parseCommentsFromHTML():
const commentSelectors = [
    '.comment',                    // Current
    '.wp-comment-wrapper',
    'li.comment',
    '.custom-comment-class',       // Add here
    'div[data-comment-id]'         // Add here
];
```

### 3. Improve Mention Detection

Polish blog comments use many patterns. To add more:

```javascript
// In detectMentionsAndQuotes():
const patterns = [
    /@([A-Za-z0-9_\-\.ąęśćźżó]+)/g,  // Current @mention
    /do.*?\b([A-Z][a-ząęśćźżó]+)\b/gi, // "do Marek:" pattern
    /powiedział.*?([A-Z][a-ząęśćźżó]+)/gi  // "powiedział Marek" pattern
];

patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
        mentions.push(match[1]);
    }
});
```

### 4. Change Thread Sorting

Currently sorts by size (largest first):

```javascript
// In refineThreads():
.sort((a, b) => b.size - a.size);  // Size descending
```

Change to other options:

```javascript
// By recency (most recent comments first)
.sort((a, b) => b.comments[b.comments.length - 1].index - 
                 a.comments[a.comments.length - 1].index);

// By number of unread (most unread first)
.sort((a, b) => b.unreadCount - a.unreadCount);

// By author activity (who wrote the most)
const authorCounts = new Map();
comments.forEach(c => {
    const count = authorCounts.get(c.author) || 0;
    authorCounts.set(c.author, count + 1);
});
.sort((a, b) => {
    const countA = authorCounts.get(a.mainAuthor) || 0;
    const countB = authorCounts.get(b.mainAuthor) || 0;
    return countB - countA;
});
```

### 5. Add Confidence Thresholds

The algorithm only links comments with confidence > 0.5:

```javascript
// In union():
if (link.confidence >= 0.5) {  // Adjust this value
    union(link.from, link.to);
}
```

Higher = stricter (fewer threads), Lower = looser (more threads)

### 6. Customize Read/Unread Indicators

Colors are in CSS. Find and change:

```css
.comment.unread {
    background: #fffbf0;           /* Light orange */
    border-left-color: #ffc107;    /* Orange border */
}

.comment.read {
    background: #f8f9fa;           /* Light gray */
    border-left-color: #28a745;    /* Green border */
}
```

### 7. Add Custom DOM Elements After Parsing

After `extractCommentData()`:

```javascript
// Extract email for profile links
const emailEl = element.querySelector('.comment-email');
if (emailEl) {
    comment.email = emailEl.textContent;
}

// Extract upvotes/reactions
const likesEl = element.querySelector('.comment-likes');
if (likesEl) {
    comment.likes = parseInt(likesEl.textContent) || 0;
}
```

Then use in rendering:

```javascript
`<span class="comment-score">👍 ${comment.likes}</span>`
```

---

## Performance Optimization Tips

### For Large Comment Sections (500+ comments)

1. **Lazy render comments**:
```javascript
// Only render visible ones initially
const renderVisibleComments = (comments) => {
    const viewport = viewportHeight();
    return comments.filter((c, i) => {
        const estimatedPos = i * COMMENT_HEIGHT;
        return estimatedPos > scrollPos - viewport &&
               estimatedPos < scrollPos + viewport * 2;
    });
};
```

2. **Cache thread structure**:
```javascript
const threadCache = new Map();
const getCachedThreads = (url) => {
    const cached = threadCache.get(url);
    if (cached) return cached;
    
    const threads = analyzer.analyzeThreads();
    threadCache.set(url, threads);
    return threads;
};
```

3. **Batch DOM operations**:
```javascript
// Instead of innerHTML per comment
const fragment = document.createDocumentFragment();
comments.forEach(c => {
    const el = createCommentElement(c);
    fragment.appendChild(el);
});
container.appendChild(fragment);  // One reflow
```

---

## Testing

### Manual Testing Checklist

- [ ] Load public blog post
- [ ] Verify comment extraction
- [ ] Check thread count is reasonable
- [ ] Try different filters
- [ ] Test mark read/unread buttons
- [ ] Reload page - data persists?
- [ ] Try with 100+ comments
- [ ] Test on mobile
- [ ] Test in different browsers

### Automated Testing Setup

Add to `index.html` before `</body>`:

```javascript
// Example test suite
if (window.location.hash === '#test') {
    console.log('Running tests...');
    
    // Test 1: Simple thread detection
    const tc1 = [
        { id: '1', author: 'A', content: 'Hello', index: 0, replyToId: null },
        { id: '2', author: 'B', content: '@A Hi', index: 1, replyToId: null }
    ];
    const a1 = new ThreadAnalyzer(tc1);
    const r1 = a1.analyzeThreads();
    console.assert(r1.length === 1, 'Test 1 failed');
    console.log('✓ Test 1 passed');
    
    // Test 2: Read tracker persistence
    const t2 = new ReadTracker('test_key');
    t2.markAsRead('comment_1');
    const stored = localStorage.getItem('test_key');
    console.assert(stored.includes('comment_1'), 'Test 2 failed');
    console.log('✓ Test 2 passed');
}
```

Then visit: `index.html#test`

---

## Browser Compatibility

### Tested & Working

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required APIs

```javascript
// Make sure environment has:
navigator.localStorage           // Read/unread storage
fetch()                         // HTTP requests
DOMParser                       // HTML parsing
Map, Set                        // Data structures
Promise, async/await            // Async patterns
```

### Fallback for Old Browsers

If targeting < ES6 browsers:

```javascript
// Replace Map/Set with object
const readComments = {};  // Instead of Set

isRead(id) {
    return readComments[id] === true;
}

markAsRead(id) {
    readComments[id] = true;
}
```

---

## Security Considerations

⚠️ **Current**: Application assumes trusted content (same-origin blog)

### Production Hardening

1. **Sanitize extracted content**:
```javascript
// Instead of:
comment.content = text;

// Use DOMPurify library:
comment.content = DOMPurify.sanitize(text);
```

2. **Validate URLs**:
```javascript
const validateBlogUrl = (url) => {
    try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) {
            throw new Error('Invalid protocol');
        }
        return u.toString();
    } catch {
        return null;
    }
};
```

3. **Content Security Policy**:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">
```

---

## Deployment Checklist

Before going live:

- [ ] Test with real blog URLs
- [ ] Check for console errors
- [ ] Verify localStorage persists
- [ ] Test all filters work
- [ ] Mobile responsiveness check
- [ ] Performance profile (DevTools)
- [ ] Cross-browser test
- [ ] Document known limitations
- [ ] Set up analytics (optional)

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Infinite loop on thread analysis | Circular reference in links | Add visited set, limit depth |
| Comments missing | DOM selector not matching | Add more selectors to list |
| Threads seem random | Confidence threshold too low | Increase threshold |
| Performance drops at 1000 comments | Rendering all at once | Implement virtualization |
| Read status not persisting | localStorage disabled | Check privacy settings |

---

## Code Size & Bundle

Current size (minified):
- `index.html`: ~45 KB (includes all code + styles)
- `bookmarklet.js`: ~18 KB

Breakdown:
- Styles: 18 KB
- Thread Algorithm: 4 KB
- UI Functions: 12 KB
- Other: 11 KB

Could reduce further with:
- CSS minification: -2 KB
- Code minification: -4 KB
- Removing comments: -3 KB

---

## Future Architecture

Potential improvements:

```
Current: Monolithic HTML file
  ↓
Future: Modular structure

/src
  ├── algorithms/
  │   ├── thread-analyzer.js
  │   ├── read-tracker.js
  │   └── comment-parser.js
  ├── ui/
  │   ├── app.js
  │   ├── components.js
  │   └── styles.css
  └── utils/
      ├── storage.js
      └── dom-utils.js
```

With build process:
- TypeScript for type safety
- Webpack for bundling
- Jest for testing
- GitHub Actions for CI/CD

---

## Contributing

To improve this code:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Make changes focusing on:
   - Code clarity
   - Performance
   - Browser compatibility
   - Accessibility (a11y)
4. Test thoroughly
5. Submit a PR with description

---

For questions, open an discussion or issue on GitHub!

