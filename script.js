// Firebase Setup
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBLBW6YFQ18I9xpJhwmeG-EmIh0PgRDuv0",
  authDomain: "minisocial-4a6e8.firebaseapp.com",
  projectId: "minisocial-4a6e8",
  storageBucket: "minisocial-4a6e8.appspot.com",
  messagingSenderId: "558875181575",
  appId: "1:558875181575:web:ff4b317215054ab681a0a2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM elements
const authPage = document.getElementById("authPage");
const homePage = document.getElementById("homePage");
const authStatus = document.getElementById("authStatus");
const postStatus = document.getElementById("postStatus");
const postPreview = document.getElementById("postPreview");

// Auth functions
window.signUp = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    authStatus.style.display = "none";
    await createUserWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Account created!";
    authStatus.className = "success";
    authStatus.style.display = "block";
  } catch (error) {
    authStatus.textContent = `Sign up failed: ${error.message}`;
    authStatus.className = "error";
    authStatus.style.display = "block";
  }
};

window.login = async function () {
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
};

window.logout = async function () {
  try {
    await signOut(auth);
  } catch (error) {
    authStatus.textContent = `Logout failed: ${error.message}`;
    authStatus.className = "error";
    authStatus.style.display = "block";
  }
};

// Auth State
onAuthStateChanged(auth, user => {
  if (user) {
    authPage.style.display = "none";
    homePage.style.display = "block";
    loadPosts();
  } else {
    authPage.style.display = "block";
    homePage.style.display = "none";
    document.getElementById("feed").innerHTML = "";
  }
});

// Upload profile picture
window.handleProfilePicUpload = async function (event) {
  const file = event.target.files[0];
  const user = auth.currentUser;
  if (!user || !file) return;

  try {
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    await updateProfile(user, { photoURL });
    loadPosts();
  } catch (error) {
    console.error("Profile pic upload error:", error);
  }
};

// Create post
window.createPost = async function () {
  const content = document.getElementById("postContent").value.trim();
  const imageFile = document.getElementById("imageUpload").files[0];
  const user = auth.currentUser;
  if (!content || !user) return;

  let imageUrl = "";
  if (imageFile) {
    const imgRef = ref(storage, `post-images/${user.uid}_${Date.now()}`);
    await uploadBytes(imgRef, imageFile);
    imageUrl = await getDownloadURL(imgRef);
  }

  try {
    await addDoc(collection(db, "posts"), {
      username: user.displayName || user.email.split("@")[0],
      profilePicture: user.photoURL || "default-profile.png",
      content,
      imageUrl,
      userId: user.uid,
      likes: [],
      comments: [],
      createdAt: serverTimestamp()
    });
    document.getElementById("postContent").value = "";
    postPreview.innerHTML = "";
    postStatus.textContent = "Post created!";
    postStatus.className = "success";
    postStatus.style.display = "block";
  } catch (error) {
    postStatus.textContent = `Error: ${error.message}`;
    postStatus.className = "error";
    postStatus.style.display = "block";
  }
};

// Preview post
window.previewPost = function () {
  const content = document.getElementById("postContent").value;
  postPreview.innerHTML = `<p><b>Preview:</b> ${content}</p>`;
};

// Realtime post loading
function loadPosts() {
  const feed = document.getElementById("feed");
  const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(postsQuery, snapshot => {
    feed.innerHTML = "";
    snapshot.forEach(docSnap => {
      renderPost({ id: docSnap.id, ...docSnap.data() });
    });
  });
}

// Render post
function renderPost(post) {
  const feed = document.getElementById("feed");
  const postDiv = document.createElement("div");
  postDiv.className = "post";

  postDiv.innerHTML = `
    <div class="post-header">
      <img class="profile" src="${post.profilePicture}" />
      <b>${post.username}</b>
    </div>
    <div class="post-content">${post.content}</div>
    ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" />` : ""}
  `;

  feed.appendChild(postDiv);
}

// Search filter
window.filterPosts = function () {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const posts = document.querySelectorAll(".post");
  posts.forEach(post => {
    const text = post.textContent.toLowerCase();
    post.style.display = text.includes(term) ? "block" : "none";
  });
};

// Dark mode toggle
document.getElementById("darkModeToggle").onclick = () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "on" : "off");
};

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark-mode");
}