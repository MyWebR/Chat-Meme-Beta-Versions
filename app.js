import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDT1n4IOCPDXzE89U7isb9MnbbTydcEc8Q",
  authDomain: "komentar-130e4.firebaseapp.com",
  projectId: "komentar-130e4",
  storageBucket: "komentar-130e4.appspot.com",
  messagingSenderId: "629448150955",
  appId: "1:629448150955:web:c8b395e60a6dba94b70cee",
  measurementId: "G-7Y8DNQDCXJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentReplyCommentId = null; // Initialize this variable
const adminEmail = "ardiansyahrestu713@gmail.com"; // Admin email

// Authentication State Change Handler
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("commentContainer").style.display = "flex";
    document.getElementById("logoutButton").style.display = "inline";
    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("userProfilePic").src = currentUser.photoURL || "";
    document.getElementById("userEmail").textContent = currentUser.email || "";

    const userNameElement = document.getElementById("userName");
    userNameElement.textContent = currentUser.displayName || "User";

    // Clear any existing verification icon
    const existingVerificationIcon =
      userNameElement.querySelector(".verification-icon");
    if (existingVerificationIcon) {
      userNameElement.removeChild(existingVerificationIcon);
    }

    // Add verification icon only for the admin
    if (currentUser.email === adminEmail) {
      const verificationIcon = document.createElement("img");
      verificationIcon.className = "verification-icon";
      verificationIcon.src = "../image/verifed.png"; // Path to your verification icon
      userNameElement.appendChild(verificationIcon);
    }

    renderComments(); // Render comments after login
  } else {
    currentUser = null;
    document.getElementById("loginSection").style.display = "flex";
    document.getElementById("commentContainer").style.display = "none";
    document.getElementById("logoutButton").style.display = "none";
    document.getElementById("userInfo").classList.add("hidden");
  }
});

// Google Sign-In
window.googleSignIn = function googleSignIn() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((error) => {
    console.error("Error during Google sign in:", error);
  });
};

// Google Sign-Out
window.googleSignOut = function googleSignOut() {
  signOut(auth).catch((error) => {
    console.error("Error during Google sign out:", error);
  });
};

// Handle Input Submission
document.getElementById("submitButton").addEventListener("click", async () => {
  const commentText = document.getElementById("commentInput").value;
  if (commentText.trim() === "") return;

  if (currentReplyCommentId) {
    // Submit Reply
    await submitReply(commentText);
  } else {
    // Submit Comment
    await addComment(commentText);
  }
});

// Add New Comment
async function addComment(commentText) {
  const comment = {
    username: currentUser.displayName,
    photoURL: currentUser.photoURL,
    text: commentText,
    date: new Date().toISOString(), // Use ISO format for consistency
    replies: [], // Initialize replies array
    isReply: false, // This is a top-level comment
  };

  try {
    await addDoc(collection(db, "comments"), comment);
    document.getElementById("commentInput").value = "";
    renderComments(); // Render comments after adding new comment
  } catch (error) {
    console.error("Error adding comment:", error);
  }
}

// Submit Reply
async function submitReply(replyText) {
  if (!currentReplyCommentId) return;

  const reply = {
    username: currentUser.displayName,
    photoURL: currentUser.photoURL,
    text: replyText,
    date: new Date().toISOString(), // Use ISO format for consistency
    replies: [], // Initialize replies array for this reply
    isReply: true, // This is a reply
  };

  try {
    const commentRef = doc(db, "comments", currentReplyCommentId);
    const commentDoc = await getDoc(commentRef);
    if (!commentDoc.exists()) {
      console.error("Comment to reply to does not exist.");
      return;
    }

    const commentData = commentDoc.data();

    // Add reply to the main comment's replies
    commentData.replies = [...(commentData.replies || []), reply];

    await updateDoc(commentRef, {
      replies: commentData.replies,
    });

    document.getElementById("commentInput").value = "";
    currentReplyCommentId = null; // Reset reply comment ID
    renderComments(); // Render comments after adding new reply
  } catch (error) {
    console.error("Error adding reply:", error);
  }
}

// Render Comments
async function renderComments() {
  const commentSection = document.getElementById("commentSection");
  commentSection.innerHTML = ""; // Clear existing comments

  try {
    // Fetch all comments
    const querySnapshot = await getDocs(collection(db, "comments"));

    // Convert querySnapshot to an array
    const comments = querySnapshot.docs.map((doc) => {
      const commentData = doc.data();
      commentData.id = doc.id; // Add document ID to commentData
      return commentData;
    });

    // Sort comments by date in descending order
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Create elements for each comment
    comments.forEach((commentData) => {
      commentSection.appendChild(createCommentElement(commentData));
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
}

// Create Comment Element
function createCommentElement(comment) {
  const commentDiv = document.createElement("div");
  commentDiv.className = "comment";

  const profileSection = document.createElement("div");
  profileSection.className = "profile-section";

  if (comment.photoURL) {
    const profilePic = document.createElement("img");
    profilePic.className = "profile-pic";
    profilePic.src = comment.photoURL;
    profileSection.appendChild(profilePic);
  }

  const username = document.createElement("div");
  username.className = "username";
  username.textContent = comment.username;

  // Add verification icon for admin comments
  if (comment.username === adminEmail) {
    console.log("Adding verification icon for:", comment.username); // Debugging line
    const verificationIcon = document.createElement("img");
    verificationIcon.className = "verification-icon";
    verificationIcon.src = "../image/verifed.png"; // Make sure this path is correct
    verificationIcon.alt = "verifeed"; // Adding alt text for better accessibility
    username.appendChild(verificationIcon);
  }

  profileSection.appendChild(username);
  commentDiv.appendChild(profileSection);

  const commentText = document.createElement("div");
  commentText.className = "text";
  commentText.textContent = comment.text;
  commentDiv.appendChild(commentText);

  const infoDiv = document.createElement("div");
  infoDiv.className = "info";

  const date = document.createElement("div");
  date.className = "date";
  date.textContent = new Date(comment.date).toLocaleString();
  infoDiv.appendChild(date);

  if (currentUser && !comment.isReply) {
    const replyButton = document.createElement("button");
    replyButton.className = "reply-button";
    replyButton.textContent = "Balas";
    replyButton.onclick = () => {
      currentReplyCommentId = comment.id;
      document.getElementById("commentInput").focus();
    };
    infoDiv.appendChild(replyButton);
  }

  commentDiv.appendChild(infoDiv);

  if (comment.replies && comment.replies.length > 0) {
    const toggleReplies = document.createElement("button");
    toggleReplies.className = "toggle-replies";
    toggleReplies.textContent = `Lihat ${comment.replies.length} Balasan`;

    toggleReplies.onclick = () => {
      const repliesDiv = commentDiv.querySelector(".replies");
      repliesDiv.classList.toggle("visible");
      toggleReplies.textContent = repliesDiv.classList.contains("visible")
        ? `Sembunyikan ${comment.replies.length} Balasan`
        : `Lihat ${comment.replies.length} Balasan`;
    };
    commentDiv.appendChild(toggleReplies);

    const repliesDiv = document.createElement("div");
    repliesDiv.className = "replies";

    comment.replies
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((reply) => {
        repliesDiv.appendChild(createCommentElement(reply));
      });
    commentDiv.appendChild(repliesDiv);
  }

  return commentDiv;
}

document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("commentPopup");
  const showPopupButton = document.getElementById("showPopupButton");
  const closePopupButton = document.getElementById("closePopup");

  // Show popup
  showPopupButton.addEventListener("click", function () {
    popup.classList.add("visible");
  });

  // Close popup if clicking outside the popup
  window.addEventListener("click", function (event) {
    if (event.target === popup) {
      popup.classList.remove("visible");
    }
  });

  // Close popup if clicking the close button
  closePopupButton.addEventListener("click", function () {
    popup.classList.remove("visible");
  });
});
