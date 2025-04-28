// Your Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;

// Signup
async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const profilePic = document.getElementById('profilePic').files[0];

  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  currentUser = userCredential.user;

  let profilePicUrl = "";
  if (profilePic) {
    const storageRef = storage.ref(`profilePics/${currentUser.uid}`);
    await storageRef.put(profilePic);
    profilePicUrl = await storageRef.getDownloadURL();
  }

  await db.collection('users').doc(currentUser.uid).set({
    email: email,
    profilePicUrl: profilePicUrl
  });

  showPostArea();
}

// Login
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  currentUser = userCredential.user;

  showPostArea();
}

// Logout
function logout() {
  auth.signOut();
  location.reload();
}

// Show Post Area
function showPostArea() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('postArea').style.display = 'block';
  loadPostsRealtime();
}

// Create Post
async function createPost() {
  const content = document.getElementById('postContent').value;
  const userDoc = await db.collection('users').doc(currentUser.uid).get();
  const profilePicUrl = userDoc.data().profilePicUrl;

  await db.collection('posts').add({
    username: currentUser.email,
    content: content,
    profilePicUrl: profilePicUrl,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    likes: [],
    comments: []
  });

  document.getElementById('postContent').value = '';
}

// Load Posts Realtime
function loadPostsRealtime() {
  db.collection('posts')
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      const feed = document.getElementById('feed');
      feed.innerHTML = "";
      snapshot.forEach(doc => {
        const post = doc.data();
        feed.innerHTML += renderPost(doc.id, post);
      });
    });
}

// Render Post HTML
function renderPost(id, post) {
  let likesCount = post.likes.length;
  let commentsHtml = post.comments.map(c => `<div><b>${c.email}:</b> ${c.text}</div>`).join('');

  return `
    <div class="post">
      <img src="${post.profilePicUrl}" class="profile"> <b>${post.username}</b><br><br>
      ${post.content}<br><br>
      <button onclick="likePost('${id}')">❤️ ${likesCount}</button>
      <div>
        <input id="commentInput-${id}" placeholder="Write a comment...">
        <button onclick="addComment('${id}')">Comment</button>
      </div>
      <div>${commentsHtml}</div>
    </div>
  `;
}

// Like Post
async function likePost(postId) {
  const postRef = db.collection('posts').doc(postId);
  const postDoc = await postRef.get();
  let likes = postDoc.data().likes;

  if (likes.includes(currentUser.email)) {
    likes = likes.filter(email => email !== currentUser.email);
  } else {
    likes.push(currentUser.email);
  }

  await postRef.update({ likes: likes });
}

// Add Comment
async function addComment(postId) {
  const commentInput = document.getElementById(`commentInput-${postId}`);
  const text = commentInput.value;

  if (text.trim() !== "") {
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    let comments = postDoc.data().comments;

    comments.push({ email: currentUser.email, text: text });

    await postRef.update({ comments: comments });
    commentInput.value = '';
  }
}