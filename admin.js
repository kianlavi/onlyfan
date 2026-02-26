const API = 'https://api.github.com';
let ghToken = '';
let ghRepo = '';
let currentPosts = [];
let currentProfile = {};
let postsSha = '';
let profileSha = '';

document.addEventListener('DOMContentLoaded', () => {
  const savedRepo = localStorage.getItem('onlyfan_repo');
  const savedToken = localStorage.getItem('onlyfan_token');

  if (savedRepo) document.getElementById('gh-repo').value = savedRepo;
  if (savedToken) document.getElementById('gh-token').value = savedToken;

  if (savedRepo && savedToken) {
    ghRepo = savedRepo;
    ghToken = savedToken;
    loadData();
  }

  setDefaultDate();
  bindEvents();
});

function bindEvents() {
  document.getElementById('btn-connect').addEventListener('click', connect);
  document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
  document.getElementById('btn-publish').addEventListener('click', publishPost);

  document.getElementById('post-locked').addEventListener('change', (e) => {
    document.getElementById('price-group').style.display = e.target.checked ? 'block' : 'none';
  });

  document.getElementById('post-image-url').addEventListener('input', (e) => {
    const preview = document.getElementById('image-preview');
    if (e.target.value) {
      preview.src = e.target.value;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  });

  document.getElementById('post-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('image-preview');
        preview.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

function setDefaultDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('post-date').value = now.toISOString().slice(0, 16);
}

async function connect() {
  const repo = document.getElementById('gh-repo').value.trim();
  const token = document.getElementById('gh-token').value.trim();
  const status = document.getElementById('connect-status');

  if (!repo || !token) {
    status.textContent = 'Please fill in both fields.';
    status.style.color = 'var(--danger)';
    return;
  }

  ghRepo = repo;
  ghToken = token;

  status.textContent = 'Connecting...';
  status.style.color = 'var(--text-secondary)';

  try {
    const res = await ghFetch(`/repos/${repo}`);
    if (!res.ok) throw new Error('Repository not found or token invalid.');

    localStorage.setItem('onlyfan_repo', repo);
    localStorage.setItem('onlyfan_token', token);

    status.textContent = 'Connected!';
    status.style.color = 'var(--success)';

    await loadData();
  } catch (err) {
    status.textContent = err.message;
    status.style.color = 'var(--danger)';
  }
}

async function loadData() {
  try {
    const [postsData, profileData] = await Promise.all([
      getFileContent('posts.json'),
      getFileContent('profile.json')
    ]);

    currentPosts = JSON.parse(postsData.content);
    postsSha = postsData.sha;

    currentProfile = JSON.parse(profileData.content);
    profileSha = profileData.sha;

    populateProfileForm(currentProfile);
    renderPostsList(currentPosts);
  } catch (err) {
    showStatus(`Failed to load data: ${err.message}`, 'error');
  }
}

function populateProfileForm(p) {
  document.getElementById('prof-name').value = p.name || '';
  document.getElementById('prof-handle').value = p.handle || '';
  document.getElementById('prof-bio').value = p.bio || '';
  document.getElementById('prof-avatar').value = p.avatar || '';
  document.getElementById('prof-banner').value = p.banner || '';
  document.getElementById('prof-subscribers').value = p.subscribers || '';
  document.getElementById('prof-likes').value = p.totalLikes || '';
}

function renderPostsList(posts) {
  const container = document.getElementById('posts-list');

  if (!posts.length) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No posts yet. Create your first one above!</p>';
    return;
  }

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(post => {
    const date = new Date(post.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const text = post.text || '(no caption)';
    const thumbSrc = post.image || '';
    const lockBadge = post.locked
      ? '<span style="color: var(--gold); font-size: 0.75rem;">LOCKED</span>'
      : '';

    return `
      <div class="post-list-item" data-id="${post.id}">
        ${thumbSrc
          ? `<img class="post-list-thumb" src="${thumbSrc}" alt="">`
          : '<div class="post-list-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.7rem;">No img</div>'
        }
        <div class="post-list-info">
          <div class="post-list-text">${escapeHTML(text)}</div>
          <div class="post-list-date">${date} ${lockBadge}</div>
        </div>
        <div class="post-list-actions">
          <button class="btn-icon danger" onclick="deletePost('${post.id}')" title="Delete post">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

async function saveProfile() {
  const btn = document.getElementById('btn-save-profile');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const profile = {
      name: document.getElementById('prof-name').value.trim(),
      handle: document.getElementById('prof-handle').value.trim(),
      bio: document.getElementById('prof-bio').value.trim(),
      avatar: document.getElementById('prof-avatar').value.trim(),
      banner: document.getElementById('prof-banner').value.trim(),
      subscribers: parseInt(document.getElementById('prof-subscribers').value) || 0,
      totalLikes: parseInt(document.getElementById('prof-likes').value) || 0
    };

    const result = await putFileContent('profile.json', JSON.stringify(profile, null, 2), profileSha, 'Update profile');
    profileSha = result.content.sha;
    currentProfile = profile;

    showStatus('Profile saved! Site will update in ~60 seconds.', 'success');
  } catch (err) {
    showStatus(`Failed to save profile: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Profile';
  }
}

async function publishPost() {
  const btn = document.getElementById('btn-publish');
  btn.disabled = true;
  btn.textContent = 'Publishing...';

  try {
    let imageUrl = document.getElementById('post-image-url').value.trim();
    const imageFile = document.getElementById('post-image-file').files[0];

    if (imageFile && !imageUrl) {
      imageUrl = await uploadImage(imageFile);
    }

    const dateVal = document.getElementById('post-date').value;
    const likesVal = document.getElementById('post-likes').value;
    const tipsVal = document.getElementById('post-tips').value;

    const post = {
      id: 'post-' + Date.now().toString(36),
      text: document.getElementById('post-text').value.trim(),
      image: imageUrl || null,
      likes: likesVal ? parseInt(likesVal) : Math.floor(Math.random() * 2000) + 100,
      tips: tipsVal ? parseFloat(tipsVal) : null,
      comments: parseInt(document.getElementById('post-comments').value) || 0,
      locked: document.getElementById('post-locked').checked,
      price: document.getElementById('post-locked').checked
        ? parseFloat(document.getElementById('post-price').value) || null
        : null,
      date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()
    };

    currentPosts.unshift(post);

    const result = await putFileContent(
      'posts.json',
      JSON.stringify(currentPosts, null, 2),
      postsSha,
      `Add post: ${post.text.slice(0, 50) || 'new post'}`
    );
    postsSha = result.content.sha;

    renderPostsList(currentPosts);
    clearPostForm();

    showStatus('Post published! Site will update in ~60 seconds.', 'success');
  } catch (err) {
    showStatus(`Failed to publish: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish Post';
  }
}

async function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;

  try {
    currentPosts = currentPosts.filter(p => p.id !== id);

    const result = await putFileContent(
      'posts.json',
      JSON.stringify(currentPosts, null, 2),
      postsSha,
      `Delete post ${id}`
    );
    postsSha = result.content.sha;

    renderPostsList(currentPosts);
    showStatus('Post deleted.', 'success');
  } catch (err) {
    showStatus(`Failed to delete: ${err.message}`, 'error');
  }
}

async function uploadImage(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const filename = `images/${Date.now()}.${ext}`;

  const base64 = await fileToBase64(file);

  await ghFetch(`/repos/${ghRepo}/contents/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Upload image: ${filename}`,
      content: base64
    })
  });

  return filename;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clearPostForm() {
  document.getElementById('post-text').value = '';
  document.getElementById('post-image-url').value = '';
  document.getElementById('post-image-file').value = '';
  document.getElementById('post-likes').value = '';
  document.getElementById('post-tips').value = '';
  document.getElementById('post-comments').value = '';
  document.getElementById('post-locked').checked = false;
  document.getElementById('post-price').value = '';
  document.getElementById('price-group').style.display = 'none';
  document.getElementById('image-preview').style.display = 'none';
  setDefaultDate();
}

/* ─── GitHub API helpers ─── */

function ghFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${ghToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
}

async function getFileContent(path) {
  const res = await ghFetch(`/repos/${ghRepo}/contents/${path}`);
  if (!res.ok) throw new Error(`Could not fetch ${path}: ${res.status}`);
  const data = await res.json();
  const content = atob(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

async function putFileContent(path, content, sha, message) {
  const res = await ghFetch(`/repos/${ghRepo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to update ${path}: ${res.status}`);
  }

  return res.json();
}

/* ─── UI Helpers ─── */

function showStatus(message, type) {
  const el = document.getElementById('status-msg');
  el.textContent = message;
  el.className = `status-msg ${type}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (type === 'success') {
    setTimeout(() => { el.className = 'status-msg'; }, 5000);
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
