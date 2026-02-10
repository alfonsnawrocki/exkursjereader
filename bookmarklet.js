/**
 * Ekskursje Reader - Bookmarklet Version
 * 
 * Installation: Create a bookmark with the following URL:
 * javascript:(function(){const s=document.createElement('script');s.src='https://alfonsnawrocki.github.io/exkursjereader/bookmarklet.js';document.head.appendChild(s)})();
 */

(function() {
    // Check if already loaded
    if (window.__EkskursjeReaderLoaded) {
        alert('Ekskursje Reader already loaded!');
        return;
    }
    window.__EkskursjeReaderLoaded = true;

    // ============================================================================
    // THREAD DETECTION ALGORITHM (Bookmarklet Version)
    // ============================================================================
    
    class ThreadAnalyzer {
        constructor(comments) {
            this.comments = comments;
            this.threads = [];
            this.commentMap = new Map();
            this.buildCommentMap();
        }

        buildCommentMap() {
            this.comments.forEach((comment, index) => {
                comment.index = index;
                this.commentMap.set(comment.id, comment);
            });
        }

        analyzeThreads() {
            const replyLinks = this.detectReplyRelationships();
            const mentionLinks = this.detectMentionsAndQuotes();
            const allLinks = [...replyLinks, ...mentionLinks];
            const threads = this.buildThreadStructure(allLinks);
            this.threads = this.refineThreads(threads);
            return this.threads;
        }

        detectReplyRelationships() {
            const links = [];
            this.comments.forEach(comment => {
                const replyToId = comment.replyToId;
                if (replyToId && this.commentMap.has(replyToId)) {
                    links.push({
                        from: comment.id,
                        to: replyToId,
                        type: 'reply',
                        confidence: 1.0
                    });
                }
            });
            return links;
        }

        detectMentionsAndQuotes() {
            const links = [];
            
            this.comments.forEach(comment => {
                const content = comment.content.toLowerCase();
                
                // Pattern 1: @AuthorName mentions
                const authorMentions = this.findMentions(content);
                authorMentions.forEach(mentionedAuthor => {
                    const targetComment = this.findCommentByAuthor(mentionedAuthor);
                    if (targetComment && targetComment.id !== comment.id) {
                        links.push({
                            from: comment.id,
                            to: targetComment.id,
                            type: 'mention',
                            confidence: 0.7,
                            author: mentionedAuthor
                        });
                    }
                });

                // Pattern 2: Quoted text detection
                const hasQuotes = /^>|^"|^\s*"[^"]*"\s*-|^[^\n]*:\s*$/m.test(content);
                if (hasQuotes) {
                    const previousComments = this.comments
                        .filter(c => c.index < comment.index)
                        .sort((a, b) => b.index - a.index)
                        .slice(0, 5);
                    
                    if (previousComments.length > 0) {
                        links.push({
                            from: comment.id,
                            to: previousComments[0].id,
                            type: 'quote',
                            confidence: 0.6
                        });
                    }
                }
            });

            return links;
        }

        findMentions(text) {
            const mentions = [];
            const mentionPattern = /@([A-Za-z0-9_\-\.ąęśćźżó]+)/g;
            let match;
            while ((match = mentionPattern.exec(text)) !== null) {
                mentions.push(match[1]);
            }
            return mentions;
        }

        findCommentByAuthor(name) {
            const lowerName = name.toLowerCase();
            return this.comments.find(c => 
                c.author.toLowerCase().includes(lowerName) ||
                lowerName.includes(c.author.toLowerCase())
            );
        }

        buildThreadStructure(links) {
            const parent = new Map();
            const rank = new Map();

            this.comments.forEach(comment => {
                parent.set(comment.id, comment.id);
                rank.set(comment.id, 0);
            });

            const find = (x) => {
                if (parent.get(x) !== x) {
                    parent.set(x, find(parent.get(x)));
                }
                return parent.get(x);
            };

            const union = (x, y) => {
                const px = find(x);
                const py = find(y);
                if (px === py) return;
                
                if (rank.get(px) < rank.get(py)) {
                    parent.set(px, py);
                } else if (rank.get(px) > rank.get(py)) {
                    parent.set(py, px);
                } else {
                    parent.set(py, px);
                    rank.set(px, rank.get(px) + 1);
                }
            };

            links.sort((a, b) => b.confidence - a.confidence);
            links.forEach(link => {
                union(link.from, link.to);
            });

            const threads = new Map();
            this.comments.forEach(comment => {
                const root = find(comment.id);
                if (!threads.has(root)) {
                    threads.set(root, []);
                }
                threads.get(root).push(comment);
            });

            return Array.from(threads.values());
        }

        refineThreads(threads) {
            return threads
                .map((thread, index) => ({
                    id: `thread_${index}`,
                    comments: thread.sort((a, b) => a.index - b.index),
                    size: thread.length,
                    mainAuthor: thread[0].author,
                    unreadCount: 0
                }))
                .sort((a, b) => b.size - a.size);
        }
    }

    // ============================================================================
    // READ/UNREAD TRACKER
    // ============================================================================
    
    class ReadTracker {
        constructor(storageKey = 'ekskursje_read_comments') {
            this.storageKey = storageKey;
            this.readComments = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
        }

        markAsRead(commentId) {
            this.readComments.add(String(commentId));
            this.save();
        }

        isRead(commentId) {
            return this.readComments.has(String(commentId));
        }

        markMultipleAsRead(commentIds) {
            commentIds.forEach(id => this.readComments.add(String(id)));
            this.save();
        }

        save() {
            localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.readComments)));
        }
    }

    // ============================================================================
    // EXTRACT COMMENTS FROM PAGE
    // ============================================================================
    
    function extractCommentsFromCurrentPage() {
        const comments = [];
        
        const commentSelectors = [
            '.comment',
            '.wp-comment-wrapper',
            'li.comment',
            'article.comment',
            '[id^="comment"]'
        ];

        let commentElements = [];
        for (const selector of commentSelectors) {
            commentElements = document.querySelectorAll(selector);
            if (commentElements.length > 0) break;
        }

        commentElements.forEach((el, index) => {
            try {
                const comment = extractCommentData(el, index);
                if (comment && comment.author && comment.content) {
                    comments.push(comment);
                }
            } catch (e) {
                console.debug('Error parsing comment:', e);
            }
        });

        return comments;
    }

    function extractCommentData(element, index) {
        const comment = {
            id: element.id || `comment_${index}`,
            index: index,
            author: '',
            content: '',
            date: '',
            replyToId: null
        };

        const authorSelectors = ['.comment-author > a', '.comment-author-name', '.fn', '.comment-author', 'strong.fn'];
        for (const selector of authorSelectors) {
            const el = element.querySelector(selector);
            if (el) {
                comment.author = el.textContent.trim();
                break;
            }
        }

        const contentSelectors = ['.comment-content', '.comment-body', '.comment-text', '.entry-content'];
        for (const selector of contentSelectors) {
            const el = element.querySelector(selector);
            if (el) {
                comment.content = el.textContent.trim();
                break;
            }
        }

        const dateSelectors = ['.comment-date', '.comment-meta', 'time', '.published'];
        for (const selector of dateSelectors) {
            const el = element.querySelector(selector);
            if (el) {
                comment.date = el.textContent.trim() || el.getAttribute('datetime') || '';
                break;
            }
        }

        comment.content = comment.content
            .replace(/\[\s*Edit.*?\]/i, '')
            .replace(/\s+/g, ' ')
            .substring(0, 500);

        return comment;
    }

    // ============================================================================
    // MAIN BOOKMARKLET LOGIC
    // ============================================================================
    
    // Extract comments
    const comments = extractCommentsFromCurrentPage();
    
    if (comments.length === 0) {
        alert('No comments found on this page. Make sure you\'re on a post with comments.');
        return;
    }

    // Analyze threads
    const analyzer = new ThreadAnalyzer(comments);
    const threads = analyzer.analyzeThreads();
    const tracker = new ReadTracker();

    // Mark visible comments as read
    comments.forEach(comment => {
        tracker.markAsRead(comment.id);
    });

    // Create overlay UI
    const overlay = document.createElement('div');
    overlay.id = 'ekskursje-reader-overlay';
    overlay.style.cssText = `
        position: fixed;
        right: 0;
        top: 0;
        width: 350px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 10px rgba(0,0,0,0.2);
        z-index: 10000;
        overflow-y: auto;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="padding: 20px; border-bottom: 2px solid #f0f0f0;">
            <h2 style="margin: 0 0 10px; color: #667eea; font-size: 18px;">🧵 Threads</h2>
            <div style="font-size: 12px; color: #666;">
                ${threads.length} threads • ${comments.length} comments
            </div>
        </div>
        <div id="thread-list" style="padding: 10px;"></div>
    `;

    document.body.appendChild(overlay);

    // Render threads list
    const threadList = overlay.querySelector('#thread-list');
    threads.forEach((thread, idx) => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 10px;
            margin-bottom: 8px;
            background: #f5f7ff;
            border-left: 4px solid #667eea;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        `;
        item.innerHTML = `
            <strong>${thread.comments[0].author}</strong>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">
                ${thread.comments.length} comments
            </div>
        `;
        item.onmouseover = () => item.style.background = '#e8ecff';
        item.onmouseout = () => item.style.background = '#f5f7ff';
        item.onclick = () => {
            // Highlight comments in this thread
            comments.forEach(c => {
                const el = document.getElementById(c.id);
                if (el) {
                    el.style.backgroundColor = 'transparent';
                    el.style.boxShadow = 'none';
                }
            });
            
            thread.comments.forEach(c => {
                const el = document.getElementById(c.id);
                if (el) {
                    el.style.backgroundColor = '#e8ecff';
                    el.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.3)';
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        };
        threadList.appendChild(item);
    });

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border: none;
        background: #667eea;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        z-index: 10001;
    `;
    closeBtn.onclick = () => {
        overlay.remove();
        closeBtn.remove();
    };
    document.body.appendChild(closeBtn);

    console.log(`Ekskursje Reader loaded! Found ${threads.length} threads with ${comments.length} comments.`);
})();
