

document.addEventListener('DOMContentLoaded', function(){

    const allButtons = document.querySelectorAll('.searchBtn');
    const searchBar = document.querySelector('.searchBar');
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');
  
    for (var i = 0; i < allButtons.length; i++) {
      allButtons[i].addEventListener('click', function() {
        searchBar.style.visibility = 'visible';
        searchBar.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        searchInput.focus();
      });
    }
  
    searchClose.addEventListener('click', function() {
      searchBar.style.visibility = 'hidden';
      searchBar.classList.remove('open');
      this.setAttribute('aria-expanded', 'false');
    });
  
   
  });

  document.getElementById('menu-toggle').addEventListener('click', function() {
    document.getElementById('mobile-nav').classList.toggle('active');
});


document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("loginModal");
  const closeBtn = document.querySelector(".close");
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
 
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  const switchToLogin = document.getElementById("switchToLogin");
  const switchToRegister = document.getElementById("switchToRegister");
  const modalTitle = document.getElementById("modalTitle");

  // Simulated user database (store users in localStorage)
  let users = JSON.parse(localStorage.getItem("users")) || {};

  // Open modal on page load (optional)
  modal.style.display = "flex";

  // Close modal on button click
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  // Switch to Login Form
  switchToLogin.addEventListener("click", function (event) {
    event.preventDefault();
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    modalTitle.textContent = "Login";
  });

  // Switch to Register Form
  switchToRegister.addEventListener("click", function (event) {
    event.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    modalTitle.textContent = "Register";
  });

  // Handle Registration
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    if (users[email]) {
      alert("User already exists! Please login.");
      return;
    }

    // Generate a session token
    const sessionToken = "token_" + Math.random().toString(36).substr(2, 16);

    // Store user details in localStorage
    users[email] = { fullName, password, sessionToken };
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("sessionToken", sessionToken);
    localStorage.setItem("userName", fullName);

    alert("Registration successful! Logging you in...");
    modal.style.display = "none";
    showWelcomeMessage();
  });

  // Handle Login
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!users[email] || users[email].password !== password) {
      alert("Invalid email or password!");
      return;
    }

    // Retrieve session token
    const sessionToken = users[email].sessionToken;
    localStorage.setItem("sessionToken", sessionToken);
    localStorage.setItem("userName", users[email].fullName);

    alert("Login successful!");
    modal.style.display = "none";
    showWelcomeMessage();
  });

  // Show Welcome Message if User is Logged In
  function showWelcomeMessage() {
    const storedToken = localStorage.getItem("sessionToken");
    const storedUser = localStorage.getItem("userName");

    if (storedToken) {
      document.body.insertAdjacentHTML(
        "afterbegin",
        `<div id="welcomeBanner" style="padding: 10px; background: #2ecc71; color: white; text-align: center;">
          Welcome, ${storedUser}! You are logged in. 
          <button id="logoutBtn" style="margin-left: 10px; background: red; color: white; border: none; padding: 5px 10px; cursor: pointer;">Logout</button>
        </div>`
      );

      // Logout functionality
      document.getElementById("logoutBtn").addEventListener("click", function () {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("userName");
        document.getElementById("welcomeBanner").remove();
        alert("You have been logged out!");
        modal.style.display = "flex";
      });
    }
  }

  // Call function to check login status on page load
  showWelcomeMessage();
});



