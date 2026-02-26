document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [profileRes, postsRes] = await Promise.all([
      fetch('profile.json'),
      fetch('posts.json')
    ]);

    const profile = await profileRes.json();
    const posts = await postsRes.json();

    renderProfile(profile, posts.length);
    renderFeed(posts, profile);
  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('feed').innerHTML =
      '<div class="empty-state"><p>Could not load feed. Check the console for details.</p></div>';
  }
});

function renderProfile(profile, postCount) {
  const banner = document.getElementById('profile-banner');
  if (profile.banner) {
    banner.style.backgroundImage = `url('${profile.banner}')`;
  }

  const avatar = document.getElementById('profile-avatar');
  avatar.src = profile.avatar || '';
  avatar.alt = profile.name;

  document.getElementById('profile-name').textContent = profile.name;
  document.getElementById('profile-handle').textContent = profile.handle;
  document.getElementById('profile-bio').textContent = profile.bio;
  document.getElementById('stat-posts').textContent = postCount;
  document.getElementById('stat-likes').textContent = formatNumber(profile.totalLikes || 0);
  document.getElementById('stat-fans').textContent = formatNumber(profile.subscribers || 0);
}

function renderFeed(posts, profile) {
  const feed = document.getElementById('feed');

  if (!posts.length) {
    feed.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>No posts yet</p>
      </div>`;
    return;
  }

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  feed.innerHTML = sorted.map(post => buildPostHTML(post, profile)).join('');
}

function buildPostHTML(post, profile) {
  const timeAgo = getTimeAgo(new Date(post.date));
  const isLocked = post.locked;

  let imageHTML = '';
  if (post.image) {
    const lockOverlay = isLocked ? `
      <div class="lock-overlay">
        <div class="lock-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <span class="lock-text">Subscribe to unlock</span>
        ${post.price ? `<button class="lock-price">Unlock for $${post.price.toFixed(2)}</button>` : ''}
      </div>` : '';

    imageHTML = `
      <div class="post-image-wrapper ${isLocked ? 'locked' : ''}">
        <img class="post-image" src="${post.image}" alt="Post image" loading="lazy">
        ${lockOverlay}
      </div>`;
  }

  const tipHTML = post.tips
    ? `<button class="action-btn tipped">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span class="tip-amount">$${post.tips.toFixed(2)}</span>
       </button>`
    : `<button class="action-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Tip
       </button>`;

  return `
    <article class="post">
      <div class="post-header">
        <img class="post-avatar" src="${profile.avatar || ''}" alt="${profile.name}">
        <div class="post-meta">
          <div class="post-author">${profile.name}</div>
          <div class="post-time">${timeAgo}</div>
        </div>
      </div>
      ${post.text ? `<div class="post-text">${escapeHTML(post.text)}</div>` : ''}
      ${imageHTML}
      <div class="post-actions">
        <button class="action-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${formatNumber(post.likes || 0)}
        </button>
        <button class="action-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${post.comments || 0}
        </button>
        ${tipHTML}
      </div>
    </article>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return 'just now';
}
