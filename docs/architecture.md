# Architecture & Design Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Ekskursje Reader                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    User Interface Layer                       │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  ┌─────────────────┐      ┌──────────────┐                   │   │
│  │  │    Sidebar      │      │   Comments   │                   │   │
│  │  │  Thread List    │      │  Viewer      │                   │   │
│  │  │                 │      │              │                   │   │
│  │  │  T1 (3 unread)  │      │ ┌──────────┐ │                   │   │
│  │  │  T2 (1 unread)  │      │ │ Comment  │ │                   │   │
│  │  │  T3 (0 unread)  │      │ │ @Author  │ │                   │   │
│  │  └─────────────────┘      │ │ [Mark Rd]│ │                   │   │
│  │           ▲               │ └──────────┘ │                   │   │
│  │           │               │              │                   │   │
│  │  ┌─────────────────────────────────────┐ │                   │   │
│  │  │      Filter Controls                │ │                   │   │
│  │  │  [All] [Unread] [Read] [Mark All]   │ │                   │   │
│  │  └─────────────────────────────────────┘ │                   │   │
│  │                                           │                   │   │
│  └──────────────────────────────────────────┘                   │   │
│                           ▲                                      │   │
│                           │ Events                               │   │
│  ┌────────────────────────┴──────────────────────────────────┐   │   │
│  │          Application Logic Layer                          │   │   │
│  ├──────────────────────────────────────────────────────────┤   │   │
│  │                                                            │   │   │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐  │   │   │
│  │  │  ThreadAnalyzer     │  │   ReadTracker            │  │   │   │
│  │  │  ┌───────────────┐  │  │  ┌────────────────────┐ │  │   │   │
│  │  │  │ Phase 1:      │  │  │  │ Read Status Map    │ │  │   │   │
│  │  │  │ Extract Reply │  │  │  │ Set<commentId>     │ │  │   │   │
│  │  │  ├───────────────┤  │  │  ├────────────────────┤ │  │   │   │
│  │  │  │ Phase 2:      │  │  │  │ markAsRead(id)     │ │  │   │   │
│  │  │  │ @Mentions     │  │  │  │ isRead(id)         │ │  │   │   │
│  │  │  │ Quotes        │  │  │  │ save()             │ │  │   │   │
│  │  │  ├───────────────┤  │  │  └────────────────────┘ │  │   │   │
│  │  │  │ Phase 3:      │  │  │         △               │  │   │   │
│  │  │  │ Union-Find    │  │  │         │               │  │   │   │
│  │  │  ├───────────────┤  │  │  ┌──────┴──────────┐   │  │   │   │
│  │  │  │ Phase 4:      │  │  │  │  localStorage   │   │  │   │   │
│  │  │  │ Refine Threads│  │  │  │  (persistence)  │   │  │   │   │
│  │  │  └───────────────┘  │  │  └─────────────────┘   │  │   │   │
│  │  └─────────────────────┘  └──────────────────────────┘  │   │   │
│  │                                                            │   │   │
│  └──────┬───────────────────────────────────────────────────┘   │   │
│         │ analyzeThreads() → Threads[]                         │   │
│         │ markAsRead(id) → void                                │   │
│         │                                                       │   │
│  ┌──────▼──────────────────────────────────────────────────┐   │   │
│  │           Data Layer                                    │   │   │
│  ├────────────────────────────────────────────────────────┤   │   │
│  │                                                          │   │   │
│  │  ┌─────────────────┐      ┌──────────────────────────┐ │   │   │
│  │  │  Comments[]     │      │   Threads[]              │ │   │   │
│  │  │  ┌───────────┐  │      │   ┌────────────────────┐ │ │   │   │
│  │  │  │ id        │  │      │   │ id: string         │ │ │   │   │
│  │  │  │ author    │  │      │   │ comments: Cmt[]    │ │ │   │   │
│  │  │  │ content   │  │      │   │ size: number       │ │ │   │   │
│  │  │  │ date      │  │      │   │ unreadCount: num   │ │ │   │   │
│  │  │  │ replyToId │  │      │   │ mainAuthor: str    │ │ │   │   │
│  │  │  │ index     │  │      │   └────────────────────┘ │ │   │   │
│  │  │  └───────────┘  │      └──────────────────────────┘ │   │   │
│  │  └─────────────────┘                                    │   │   │
│  │           ▲                                             │   │   │
│  │           │                                             │   │   │
│  │  ┌────────┴──────────────────────────────────────────┐ │   │   │
│  │  │  fetch() + parseCommentsFromHTML()                │ │   │   │
│  │  │  DOM parsing for multiple WordPress themes        │ │   │   │
│  │  └────────▲──────────────────────────────────────────┘ │   │   │
│  │           │                                             │   │   │
│  └───────────┼─────────────────────────────────────────────┘   │   │
│              │                                                  │   │
└──────────────┼──────────────────────────────────────────────────┘   │
               │                                                      
            Network                                                  
               │                                                      
        ┌──────▼─────────┐                                            
        │  WordPress     │                                            
        │  Blog Post     │                                            
        │  (HTTP HTML)   │                                            
        └────────────────┘                                            
```

---

## Data Flow Diagram

### 1. Initial Load

```
Start
  │
  ▼
User enters URL
  │
  ▼
fetch(url) ────────────► HTTP Request ────────► Blog Server
  │
  ├─ HTML Response ◄──────────────────────────┘
  │
  ▼
parseCommentsFromHTML()
  │
  ├─ DOMParser.parseFromString()
  ├─ querySelector() on multiple selectors
  └─ extractCommentData() for each comment
  │
  ▼
comments[] ◄──────────── Parsed data
  │
  ▼
new ThreadAnalyzer(comments)
  │
  ├─ Phase 1: detectReplyRelationships()
  │   └─ HTML link extraction
  ├─ Phase 2: detectMentionsAndQuotes()
  │   ├─ Regex: @username
  │   └─ Regex: quote markers
  ├─ Phase 3: buildThreadStructure()
  │   └─ Union-Find merging
  └─ Phase 4: refineThreads()
      └─ Sort & validate
  │
  ▼
threads[] ◄──────────── Thread data
  │
  ▼
new ReadTracker()
  │
  ├─ localStorage.getItem()
  │  └─ Load previously read comments
  ▼
readComments: Set ◄──── Persistent data
  │
  ▼
updateUnreadCounts()
  │
  ▼
renderThreadList()
renderComments()
  │
  ▼
✅ Ready for user interaction
```

### 2. User Interaction

```
User Interaction:

A) Scroll Comment
   │
   ├─ (Could auto-mark as read)
   └─ Event: scroll
      │
      ▼
      User manually clicks "Mark as Read"
      │
      ▼
      markCommentRead(id)
        │
        ├─ tracker.markAsRead(id)
        │  ├─ readComments.add(id)
        │  └─ localStorage.setItem()
        │
        ├─ updateUnreadCounts()
        │  └─ Recalculate per-thread
        │
        ├─ renderThreadList()
        │  └─ Update sidebar badges
        │
        └─ filterComments(currentFilter)
           └─ Refresh comment display

B) Click Thread
   │
   ├─ selectThread(threadId)
   ├─ filterComments('all')
   └─ Display thread comments

C) Filter Change
   │
   ├─ filterComments(filter)
   │  ├─ if filter === 'unread': show unread only
   │  ├─ if filter === 'read': show read only
   │  └─ if filter === 'all': show all
   │
   └─ renderComments(filtered)
```

---

## Thread Detection Flow (Detailed)

```
Input: Comments A, B, C, D (flat list)

┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Extract HTML Reply Relationships                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ For each comment:                                            │
│   Check: comment.replyToId                                  │
│                                                              │
│ A.replyToId = null   (original)                             │
│ B.replyToId = A.id   (directly replies to A)                │
│ C.replyToId = null   (original)                             │
│ D.replyToId = C.id   (directly replies to C)                │
│                                                              │
│ Result: Links = [(B→A, 1.0), (D→C, 1.0)]                    │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Detect Mentions & Quotes                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ A: "Great article!"                                         │
│    └─ No mentions, no quotes                                │
│                                                              │
│ B: "I agree with text from A"                               │
│    ├─ Mentions: None explicitly                             │
│    ├─ Quotes: None                                          │
│    └─ Already linked via Phase 1                            │
│                                                              │
│ C: "Different topic here"                                   │
│    └─ No mentions, no quotes                                │
│                                                              │
│ D: "> Different topic here                                  │
│     >                                                       │
│     > I fully agree"                                        │
│    ├─ Quotes: Yes! (starts with >)                          │
│    ├─ Regex match: /^>/                                     │
│    └─ Already linked via Phase 1                            │
│                                                              │
│ Result: Links = [(B→A, 1.0), (D→C, 1.0)]                    │
│         (Phase 1 catches all for this example)              │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Union-Find Merging                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Initialize:  parent = {A:A, B:B, C:C, D:D}                  │
│              rank   = {A:0, B:0, C:0, D:0}                  │
│                                                              │
│ Process links by confidence (high first):                   │
│                                                              │
│ 1. Process (B→A, confidence 1.0)                            │
│    find(B) = B, find(A) = A                                 │
│    ├─ Different roots, union them                           │
│    └─ parent = {A:A, B:A, C:C, D:D}                         │
│       (B now points to A's root)                            │
│                                                              │
│ 2. Process (D→C, confidence 1.0)                            │
│    find(D) = D, find(C) = C                                 │
│    ├─ Different roots, union them                           │
│    └─ parent = {A:A, B:A, C:C, D:C}                         │
│       (D now points to C's root)                            │
│                                                              │
│ Final roots: A and C                                        │
✓ Two threads: {A,B} and {C,D}
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Refine & Sort                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Thread 1:                                                    │
│   ├─ id: "thread_0"                                         │
│   ├─ comments: [A, B] (sorted by index)                     │
│   ├─ size: 2                                                │
│   ├─ mainAuthor: A.author                                   │
│   └─ unreadCount: (calculated from read status)             │
│                                                              │
│ Thread 2:                                                    │
│   ├─ id: "thread_1"                                         │
│   ├─ comments: [C, D] (sorted by index)                     │
│   ├─ size: 2                                                │
│   ├─ mainAuthor: C.author                                   │
│   └─ unreadCount: (calculated from read status)             │
│                                                              │
│ Sort by size (descending):                                  │
│   [Thread 1 (size 2), Thread 2 (size 2)]                    │
│   (equal, keep order)                                       │
│                                                              │
│ Result: threads[] = [Thread 1, Thread 2]                    │
└─────────────────────────────────────────────────────────────┘
                        ▼
                    Output: Threads
                        ✓
```

---

## Read/Unread Tracking System

```
┌─────────────────────────────────────────────────────────┐
│          ReadTracker State Machine                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                 readComments: Set
│              ───────────────────────
│              │ "comment_1"          │
│              │ "comment_3"          │
│              │ "comment_5"          │
│              │ "comment_7"  (unread │
│              │ "comment_9"  others)  │
│              └──────────────────────┘
│                        △
│                        │ Persisted in
│            ┌───────────┴──────────────┐
│            │   localStorage:          │
│            │   'ekskursje_read_cmts'  │
│            │   = JSON.stringify(set)  │
│            └────────────────────────┘
│
│  Operations:
│
│  markAsRead(id)       readComments.add(id) ──┐
│       │               └──► save()              │
│       │                                        │
│       ├─► updateUnreadCounts()                 │
│       ├─► renderThreadList()                   │
│       └─► filterComments(current)              │
│                                        │
│  isRead(id)           return readComments.has(id)
│       │
│       └─► true: comment appears read (gray)
│           false: comment appears unread (yellow)
│
│  Browser page reload or restart:
│       │
│       ▼
│  new ReadTracker()
│       │
│       ├─ localStorage.getItem()
│       │   └─ JSON.parse() → Set
│       │
│       └─► readComments restored!
│
└─────────────────────────────────────────────────────────┘
```

---

## UI Component Hierarchy

```
App Root
│
├── Header
│   ├── Title
│   └── Subtitle
│
├── SetupSection
│   ├── Instructions
│   ├── URL Input
│   └── Analyze Button
│
└── MainContent (hidden until analyzed)
    │
    ├── Sidebar
    │   ├── Statistics
    │   │   ├── Total Threads
    │   │   ├── Total Comments
    │   │   └── Unread Count
    │   │
    │   └── ThreadList
    │       ├── ThreadItem 1 (unread)
    │       │   ├── Author Name
    │       │   └── Comment Count
    │       ├── ThreadItem 2 (read)
    │       │   ├── Author Name
    │       │   └── Comment Count
    │       └── ThreadItem N
    │
    └── CommentsContainer
        │
        ├── CommentsHeader
        │   ├── Title
        │   └── FilterControls
        │       ├── [All]
        │       ├── [Unread Only]
        │       ├── [Read]
        │       └── [Mark All Read]
        │
        └── CommentsView
            ├── Comment 1
            │   ├── Header (Author, Date)
            │   ├── Content
            │   └── Footer (Buttons)
            ├── Comment 2
            │   ├── Header
            │   ├── Content
            │   └── Footer
            └── Comment N
                ├── Header
                ├── Content
                └── Footer

ScrollToTopButton (fixed position)
```

---

## Event Handling Map

```
User Actions → Events → Handlers → State Changes → UI Updates

1. Page Load
   └─► readTracker = new ReadTracker()
       └─► Load from localStorage
       
2. User enters URL + clicks Analyze
   └─► analyzeBlog()
       ├─► fetchAndParseComments()
       │   └─► updateUnreadCounts()
       └─► renderUI()
           ├─► renderThreadList()
           └─► renderComments()

3. User clicks Thread in Sidebar
   └─► selectThread(threadId)
       ├─► renderComments() [filtered to thread]
       └─► Smooth scroll to comments

4. User selects Filter
   └─► filterComments(filter)
       └─► renderComments() [filtered list]

5. User clicks "Mark as Read"
   └─► markCommentRead(id)
       ├─► tracker.markAsRead(id)
       ├─► updateUnreadCounts()
       ├─► renderThreadList()
       └─► filterComments()

6. User scrolls
   └─► window.scroll event
       ├─► Show/hide scrollToTop button
       └─► (Optional: auto-mark visible comments)

7. Browser refresh
   └─► Page reloads
       ├─► readTracker loads from localStorage
       └─► Read status persists!
```

---

These diagrams show:
- **System Architecture**: How components interact
- **Data Flow**: How information moves through the system
- **Thread Detection**: Step-by-step algorithm execution
- **Component Hierarchy**: UI structure
- **Event Handling**: User interactions

For more details, see:
- [Algorithms Documentation](./algorithms.md)
- [Implementation Guide](./implementation.md)
- [Quick Start Guide](./quickstart.md)

