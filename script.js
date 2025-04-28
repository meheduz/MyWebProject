const users = [];
let loggedInUser = null;

const authSection = document.getElementById('authSection');
const postSection = document.getElementById('postSection');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authForm = document.getElementById('authForm');
const authButton = document.getElementById('authButton');
const toggleText = document.getElementById('toggleText');
const toggleAuthButton = document.getElementById('toggleAuthButton');
const postForm = document.getElementById('postForm');
const postInput = document.getElementById('postInput');
const postsContainer = document.getElementById('postsContainer');
const logoutButton = document.getElementById('logoutButton');

toggleAuthButton.addEventListener('click', () => {
  if (authTitle.textContent === 'Welcome Back') {
    authTitle.textContent = 'Create an Account';
    authSubtitle.textContent = 'Sign up to get started';
    authButton.textContent = 'Sign Up';
    toggleText.innerHTML = 'Already have an account? <button id="toggleAuthButton">Login</button>';
  } else {
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Login to continue';
    authButton.textContent = 'Login';
    toggleText.innerHTML = 'Don\'t have an account? <button id="toggleAuthButton">Sign Up</button>';
  }
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (authTitle.textContent === 'Welcome Back') {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      loggedInUser = user;
      showPostSection();
    } else {
      alert('Invalid email or password!');
    }
  } else {
    if (users.find(u => u.email === email)) {
      alert('Email is already registered!');
    } else {
      users.push({ email, password });
      alert('Account created successfully! Please log in.');
      toggleAuthButton.click();
    }
  }

  authForm.reset();
});

postForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const postText = postInput.value.trim();

  if (postText) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.textContent = postText;

    postsContainer.prepend(postElement);
    postInput.value = '';
  }
});

logoutButton.addEventListener('click', () => {
  loggedInUser = null;
  showAuthSection();
});

function showPostSection() {
  authSection.classList.add('hidden');
  postSection.classList.remove('hidden');
}

function showAuthSection() {
  authSection.classList.remove('hidden');
  postSection.classList.add('hidden');
}
