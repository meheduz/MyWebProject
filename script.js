function renderPost(postData, postId) {
  const feed = document.getElementById("feed");

  // Create post container
  const postDiv = document.createElement("div");
  postDiv.className = "post";
  postDiv.id = postId;

  // Post Header (Profile Pic + Username)
  const headerDiv = document.createElement("div");
  headerDiv.className = "post-header";

  const profileImg = document.createElement("img");
  profileImg.src = postData.profilePicture || "default-profile.png"; // fallback image
  profileImg.className = "profile";

  const userName = document.createElement("b");
  userName.textContent = postData.username;

  headerDiv.appendChild(profileImg);
  headerDiv.appendChild(userName);

  // Post Content (Text)
  const contentDiv = document.createElement("div");
  contentDiv.className = "post-content";
  contentDiv.textContent = postData.content;

  // Actions (Like / Comment buttons)
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "post-actions";

  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn";
  likeBtn.innerHTML = `❤️ Like (${postData.likes || 0})`;

  likeBtn.onclick = () => likePost(postId);

  const commentBtn = document.createElement("button");
  commentBtn.className = "comment-btn";
  commentBtn.innerHTML = "💬 Comment";

  commentBtn.onclick = () => toggleCommentInput(postId);

  actionsDiv.appendChild(likeBtn);
  actionsDiv.appendChild(commentBtn);

  // Comment Section (Hidden by default)
  const commentArea = document.createElement("div");
  commentArea.className = "comment-area";
  commentArea.style.display = "none"; // hidden initially

  const commentInput = document.createElement("input");
  commentInput.type = "text";
  commentInput.placeholder = "Write a comment...";

  const commentSubmitBtn = document.createElement("button");
  commentSubmitBtn.textContent = "Post";
  commentSubmitBtn.onclick = () => submitComment(postId, commentInput.value);

  commentArea.appendChild(commentInput);
  commentArea.appendChild(commentSubmitBtn);

  // Combine all parts
  postDiv.appendChild(headerDiv);
  postDiv.appendChild(contentDiv);
  postDiv.appendChild(actionsDiv);
  postDiv.appendChild(commentArea);

  // Add to top of feed
  feed.prepend(postDiv);
}

// Helper to toggle comment box
function toggleCommentInput(postId) {
  const postDiv = document.getElementById(postId);
  const commentArea = postDiv.querySelector(".comment-area");
  if (commentArea.style.display === "none") {
    commentArea.style.display = "flex";
  } else {
    commentArea.style.display = "none";
  }
}

// Helper to like a post (simple example)
function likePost(postId) {
  const postDiv = document.getElementById(postId);
  const likeBtn = postDiv.querySelector(".like-btn");
  // Update likes (in a real app, also update Firestore)
  let currentLikes = parseInt(likeBtn.innerText.match(/\d+/)[0]);
  currentLikes++;
  likeBtn.innerHTML = `❤️ Like (${currentLikes})`;
}

// Helper to submit comment (simple example)
function submitComment(postId, commentText) {
  if (commentText.trim() === "") return;
  alert(`Comment submitted: ${commentText}`);
  // In a real app, push comment to Firestore under postId
}