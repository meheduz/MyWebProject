import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLBW6YFQ18I9xpJhwmeG-EmIh0PgRDuv0",
  authDomain: "minisocial-4a6e8.firebaseapp.com",
  projectId: "minisocial-4a6e8",
  storageBucket: "minisocial-4a6e8.appspot.com",
  messagingSenderId: "558875181575",
  appId: "1:558875181575:web:ff4b317215054ab681a0a2",
  measurementId: "G-KSHYR7R7JY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM elements
const authButtons = document.getElementById("authButtons");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");
const postStatus = document.getElementById("postStatus");
const loadingIndicator = document.getElementById("loading");

// Auth functions with error handling
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    authStatus.style.display = "none";
    await createUserWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Account created successfully!";
    authStatus.className = "success";
    authStatus.style.display = "block";
  } catch (error) {
    authStatus.textContent = `Sign up failed: ${error.message}`;
    authStatus.className = "error";
    authStatus.style.display = "block";
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    authStatus.style.display = "none";
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authStatus.textContent = `Login failed: ${error.message}`;
    authStatus.className = "error";
    authStatus.style.display = "block";
  }
}

async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    authStatus.textContent = `Logout failed: ${error.message}`;
    authStatus.className = "error";
    authStatus.style.display = "block";
  }
}

// Post functions with loading states
async function createPost() {
  const content = document.getElementById("postContent").value.trim();
  if (!content) return;

  try {
    postStatus.style.display = "none";
    const postsRef = collection(db, "posts");
    const user = auth.currentUser;

    await addDoc(postsRef, {
      username: user.displayName || user.email.split('@')[0],
      profilePicture: user.photoURL || "default-profile.png",
      content: content,
      userId: user.uid,
      likes: [],
      comments: [],
      createdAt: serverTimestamp()
    });

    document.getElementById("postContent").value = "";
    postStatus.textContent = "Post created successfully!";
    postStatus.className = "success";
    postStatus.style.display = "block";
    loadPosts();
  } catch (error) {
    postStatus.textContent = `Failed to create post: ${error.message}`;
    postStatus.className = "error";
    postStatus.style.display = "block";
  }
}

async function loadPosts() {
  try {
    loadingIndicator.style.display = "block";
    const feed = document.getElementById("feed");
    feed.innerHTML = "";
    feed.appendChild(loadingIndicator);

    const postsRef = collection(db, "posts");
    const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(postsQuery);

    snapshot.forEach(docSnap => {
      renderPost({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (error) {
    console.error("Error loading posts:", error);
  } finally {
    loadingIndicator.style.display = "none";
  }
}

// Enhanced post rendering with likes and comments
function renderPost(post) {
  const feed = document.getElementById("feed");
  const user = auth.currentUser;

  const postDiv = document.createElement("div");
  postDiv.className = "post";
  postDiv.id = post.id;

  // Post header with profile
  const headerDiv = document.createElement("div");
  headerDiv.className = "post-header";

  const profileImg = document.createElement("img");
  profileImg.src = post.profilePicture;
  profileImg.className = "profile";

  const userName = document.createElement("b");
  userName.textContent = post.username;

  headerDiv.appendChild(profileImg);
  headerDiv.appendChild(userName);

  // Post content
  const contentDiv = document.createElement("div");
  contentDiv.className = "post-content";
  contentDiv.textContent = post.content;

  // Post actions
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "post-actions";

  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn";
  const likeCount = post.likes ? post.likes.length : 0;
  const isLiked = user && post.likes && post.likes.includes(user.uid);
  likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} Like (${likeCount})`;
  likeBtn.onclick = () => toggleLike(post.id, post.likes || []);

  const commentBtn = document.createElement("button");
  commentBtn.className = "comment-btn";
  commentBtn.innerHTML = `💬 Comment (${post.comments ? post.comments.length : 0})`;
  commentBtn.onclick = () => toggleCommentInput(post.id);

  actionsDiv.appendChild(likeBtn);
  actionsDiv.appendChild(commentBtn);

  // Edit/Delete buttons for post owner
  if (user && user.uid === post.userId) {
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = "✏️ Edit";
    editBtn.onclick = () => editPost(post.id, post.content);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "🗑️ Delete";
    deleteBtn.onclick = () => deletePost(post.id);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
  }

  // Comment area
  const commentArea = document.createElement("div");
  commentArea.className = "comment-area";
  commentArea.style.display = "none";

  const commentInput = document.createElement("input");
  commentInput.type = "text";
  commentInput.placeholder = "Write a comment...";

  const commentSubmitBtn = document.createElement("button");
  commentSubmitBtn.textContent = "Post";
  commentSubmitBtn.onclick = () => addComment(post.id, commentInput, post.comments || []);

  commentArea.appendChild(commentInput);
  commentArea.appendChild(commentSubmitBtn);

  // Comments list
  const commentsList = document.createElement("div");
  commentsList.className = "comments-list";
  if (post.comments && post.comments.length > 0) {
    post.comments.forEach(comment => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.innerHTML = `<b>${comment.username}:</b> ${comment.text}`;
      commentsList.appendChild(commentDiv);
    });
  }

  // Assemble post
  postDiv.appendChild(headerDiv);
  postDiv.appendChild(contentDiv);
  postDiv.appendChild(actionsDiv);
  postDiv.appendChild(commentsList);
  postDiv.appendChild(commentArea);

  feed.appendChild(postDiv);
}

// Post interaction functions
async function toggleLike(postId, currentLikes) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const postRef = doc(db, "posts", postId);
    let newLikes = [...currentLikes];
    
    if (newLikes.includes(user.uid)) {
      newLikes = newLikes.filter(uid => uid !== user.uid);
    } else {
      newLikes.push(user.uid);
    }

    await updateDoc(postRef, { likes: newLikes });
    loadPosts();
  } catch (error) {
    console.error("Error updating likes:", error);
  }
}

async function addComment(postId, commentInput, currentComments) {
  const user = auth.currentUser;
  const commentText = commentInput.value.trim();
  if (!user || !commentText) return;

  try {
    const postRef = doc(db, "posts", postId);
    const newComment = {
      userId: user.uid,
      username: user.displayName || user.email.split('@')[0],
      text: commentText,
      timestamp: serverTimestamp()
    };

    const updatedComments = [...currentComments, newComment];
    await updateDoc(postRef, { comments: updatedComments });
    commentInput.value = "";
    loadPosts();
  } catch (error) {
    console.error("Error adding comment:", error);
  }
}

async function deletePost(postId) {
  if (confirm("Are you sure you want to delete this post?")) {
    try {
      await deleteDoc(doc(db, "posts", postId));
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }
}

async function editPost(postId, oldContent) {
  const newContent = prompt("Edit your post:", oldContent);
  if (newContent !== null && newContent.trim() !== "") {
    try {
      await updateDoc(doc(db, "posts", postId), { content: newContent.trim() });
      loadPosts();
    } catch (error) {
      console.error("Error updating post:", error);
    }
  }
}

function toggleCommentInput(postId) {
  const postDiv = document.getElementById(postId);
  const commentArea = postDiv.querySelector(".comment-area");
  commentArea.style.display = commentArea.style.display === "none" ? "flex" : "none";
}

// Profile picture upload
async function uploadProfilePicture(file) {
  const user = auth.currentUser;
  if (!user || !file) return;

  try {
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    
    await updateProfile(user, { photoURL });
    loadPosts();
  } catch (error) {
    console.error("Error uploading profile picture:", error);
  }
}

// Watch user state
onAuthStateChanged(auth, user => {
  if (user) {
    authButtons.style.display = "none";
    logoutBtn.style.display = "block";
    document.getElementById("postArea").style.display = "flex";
    loadPosts();
  } else {
    authButtons.style.display = "flex";
    logoutBtn.style.display = "none";
    document.getElementById("postArea").style.display = "none";
    document.getElementById("feed").innerHTML = "";
  }
});