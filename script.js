const reviewList = document.getElementById('reviewList');
const packagesList = document.getElementById('packagesList');
const cartList = document.getElementById('cartList');

let reviews = [];
let packages = [];
let cart = [];
let orders = [];
let isAdmin = false; 

function saveToLocalStorage() {
  localStorage.setItem('reviews', JSON.stringify(reviews));
  localStorage.setItem('packages', JSON.stringify(packages));
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('orders', JSON.stringify(orders));
}

function showSection(id) {
  document.querySelectorAll('main > section').forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });

  const sectionToShow = document.getElementById(id);
  if (sectionToShow) {
    sectionToShow.style.display = 'block';
    sectionToShow.classList.add('active');
  }

  reviewList.style.display = id === 'reviews' ? 'block' : 'none';
  cartList.style.display = id === 'cart' ? 'block' : 'none';
  packagesList.style.display = id === 'packages' ? 'block' : 'none';

  if (id === 'orders' && !isAdmin) renderMyOrders(); 
  if (id === 'Allorders' && isAdmin) renderAllOrders();
  if (id === 'reviews') renderReviews();
  if (id === 'cart') renderCart();
  if (id === 'packages') renderPackages();
if (id === 'reviews') renderReviews();
}

function toggleMenu() {
  const sideMenu = document.getElementById("sideMenu");
  sideMenu.classList.toggle("show");
}

function navigateAndClose(section) {
  showSection(section); 
  document.getElementById("sideMenu").classList.remove("show");
}

function addReview(event) {
  event.preventDefault();

  const name = document.getElementById("reviewerName").value.trim();
  const reviewText = document.getElementById("reviewInput").value.trim();
  const rating = document.getElementById("ratingInput").value;

  if (!name || !reviewText || !rating) return;

  const newReview = { name, text: reviewText, rating };
  db.ref("reviews").push(newReview);
  renderReviews();

  event.target.reset();
}

function renderReviews() {
  reviewList.innerHTML = '';

  db.ref("reviews").once("value", (snapshot) => {
    reviewList.innerHTML = ''; 

    snapshot.forEach((child) => {
      const key = child.key; 
      const review = child.val();
      const div = document.createElement('div');
      div.className = 'review-item';
      div.innerHTML = `
        <strong>${review.name}</strong> — <span>${"★".repeat(review.rating)}</span>
        <p>${review.text}</p>
        <button class="edit-btn" onclick="editReview('${key}', '${review.text}', ${review.rating})">Edit</button>
        <button class="delete-btn" onclick="deleteReview('${key}')">Delete</button>
      `;
      reviewList.appendChild(div);
    });
  });
}

function deleteReview(key) {
  if (confirm("Are you sure you want to delete this review?")) {
    db.ref("reviews/" + key).remove().then(() => {
      alert("Review deleted.");
      renderReviews(); 
    });
  }
}

function editReview(key, currentText, currentRating) {
  const newText = prompt("Edit your review:", currentText);
  const newRating = prompt("Edit rating (1–5):", currentRating);

  if (newText && newRating >= 1 && newRating <= 5) {
    db.ref("reviews/" + key).update({
      text: newText.trim(),
      rating: parseInt(newRating)
    }).then(() => {
      alert("Review updated!");
      renderReviews();
    });
  }
}

function addPackage(e) {
  e.preventDefault();

  const name = document.getElementById('packageName').value.trim();
  const description = document.getElementById('packageDescription').value.trim();
  const price = parseFloat(document.getElementById('packagePrice').value.trim());
  const imageFile = document.getElementById('packageImageFile').files[0];
  const imageUrl = document.getElementById('packageImageUrl').value.trim();

  if (!name || !description || isNaN(price) || (!imageFile && !imageUrl)) {
    alert("Please fill all fields including price and provide an image.");
    return;
  }

  const addPackageToList = (imgSrc) => {
    const newProduct = { name, description, price, image: imgSrc };
    packages.push(newProduct);
    saveToLocalStorage();
    renderPackages();
    e.target.reset();
    alert("✅ Package added successfully!");
  };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      addPackageToList(evt.target.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    addPackageToList(imageUrl);
  }
}

function renderPackages() {
  packagesList.innerHTML = '';

  packages.forEach((pkg, index) => {
    const card = document.createElement('div');
    card.className = 'package-card';

    card.innerHTML = `
      <div class="package-image-wrapper">
        <img src="${pkg.image}" alt="${pkg.name}">
      </div>
      <div class="package-details">
        <div>
          <h3 class="package-name">${pkg.name}</h3>
          <p class="package-description">${pkg.description}</p>
          <p class="package-price"><strong>Price:</strong> Rs. ${pkg.price.toFixed(2)}</p>
        </div>
        <button class="add-to-cart-btn" onclick="addToCart(${index})">Add to Cart</button>
        ${isAdmin ? `
          <div class="admin-buttons">
            <button onclick="editPackage(${index})">Edit</button>
            <button onclick="deletePackage(${index})">Delete</button>
          </div>
        ` : ''}
      </div>
    `;

    packagesList.appendChild(card);
  });
}

function deletePackage(index) {
  if (confirm('Are you sure you want to delete this package?')) {
    packages.splice(index, 1);
    saveToLocalStorage();
    renderPackages();
  }
}

function editPackage(index) {
  const pkg= packages[index];
  const newName = prompt("Edit package name:", package.name);
  const newDescription = prompt("Edit package description:", package.description);
  const newImageUrl = prompt("Edit image URL:", package.image);

  if (newName && newDescription && newImageUrl) {
    packages[index] = {
      name: newName.trim(),
      description: newDescription.trim(),
      image: newImageUrl.trim()
    };
    saveToLocalStorage();
    renderPackages();
  }
}

function addToCart(index) {
  const pkg = packages[index]; 
  const existing = cart.find(item => item.name === pkg.name); 

  if (existing) {
    existing.quantity++; 
  } else {
    cart.push({ ...pkg, quantity: 1 }); 
  }

  saveToLocalStorage();
  renderCart();
  showSection('cart'); 
}

function renderCart() {
  cartList.innerHTML = '';

  if (cart.length === 0) {
    cartList.innerHTML = '<p class="cartalert">Your cart is empty.</p>';
    return;
  }
  cart.forEach((pkg, index) => {
    const div = document.createElement('div');
    div.className = 'packages'; 
    div.innerHTML = `
      <h4>${pkg.name}</h4>
      <p>${pkg.description}</p>
      <p><strong>Price:</strong> Rs. ${pkg.price.toFixed(2)}</p>
      <img src="${pkg.image}" alt="${pkg.name}" />
      <p>Quantity: 
        <button onclick="decreaseQuantity(${index})">−</button>
        ${pkg.quantity}
        <button onclick="increaseQuantity(${index})">+</button>
      </p>
      <button onclick="removeFromCart(${index})">Remove</button>
    `;
    cartList.appendChild(div);
  });
}

function updateTotalBill() {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalElement = document.getElementById('totalBill');
  if (totalElement) {
    totalElement.textContent = `Total Bill: Rs. ${total.toFixed(2)}`;
  }
}

function increaseQuantity(index) {
  cart[index].quantity++;
  saveToLocalStorage();
  renderCart();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    cart.splice(index, 1); 
  }
  saveToLocalStorage();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveToLocalStorage();
  renderCart();
}

function goToCheckout() {
  showSection('checkout');
  updateTotalBill(); 
}

function placeOrder(event) {
  event.preventDefault();

  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const payment = document.querySelector("input[name='payment']:checked")?.value;

  if (!name || !email || !address || !payment || cart.length === 0) {
    alert("Please fill in all fields and make sure your cart is not empty.");
    return;
  }
localStorage.setItem("customerEmail", email);

  const order = {
    name,
    email,
    address,
    payment,
    items: [...cart],
    timestamp: Date.now()
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const emailOrderData = {
    name,
    email,
    items: order.items.map(i => `${i.name} x${i.quantity}`).join(', '),
    total: total.toFixed(2),
    address,
  };

  sendOrderEmail(emailOrderData);

  db.ref("orders").push(order);

  cart = [];
  renderCart();
  showSection("orders");
  event.target.reset();
  alert("Order placed successfully!");
}

function sendOrderEmail(orderData) {
  document.getElementById("emailName").value = orderData.name;
  document.getElementById("emailEmail").value = orderData.email;
  document.getElementById("emailItems").value = orderData.items;
  document.getElementById("emailTotal").value = orderData.total;
  document.getElementById("emailAddress").value = orderData.address;

  emailjs.sendForm("service_bghn00o", "template_zh1o80d", "#emailForm")
    .then(() => {
      console.log("✅ Order email sent to admin!");
    })
    .catch((error) => {
      console.error("❌ Failed to send email:", error);
    });
}

function renderOrders() {
  const orderList = document.getElementById("orderList");
  orderList.innerHTML = '';

  if (!isAdmin) {
    renderMyOrders();
    return;
  }

  db.ref("orders").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      orderList.innerHTML = '<p class="no-orders">No orders placed yet.</p>';
      return;
    }
    
    snapshot.forEach((child, index) => {
      const order = child.val();
      const div = document.createElement('div');
      div.className = 'order';
      div.innerHTML = `
        <h4>Order #${index + 1}</h4>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Payment:</strong> ${order.payment}</p>
        <p><strong>Items:</strong></p>
        <ul>${order.items.map(item => `<li>${item.name}</li>`).join('')}</ul>
      `;
      orderList.appendChild(div);
    });
  });
}

function renderMyOrders() {
  const orderList = document.getElementById("orderList");
  orderList.innerHTML = '';

  const email = localStorage.getItem("customerEmail");
  if (!email) {
    orderList.innerHTML = '<p>Please enter your email on the checkout page to view your orders.</p>';
    return;
  }

  db.ref("orders").orderByChild("email").equalTo(email).once("value", (snapshot) => {
    if (!snapshot.exists()) {
      orderList.innerHTML = '<p class="no-orders-message">No orders placed yet.</p>';
      return;
    }

    let count = 1;
    snapshot.forEach(child => {
      const order = child.val();
      const div = document.createElement('div');
      div.className = 'order';
      div.innerHTML = `
        <h4>Your Order #${count}</h4>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Payment:</strong> ${order.payment}</p>
        <p><strong>Items:</strong></p>
        <ul>${order.items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('')}</ul>
      `;
      orderList.appendChild(div);
      count++;
    });
  });
}

function renderAllOrders() {
  const allOrderList = document.getElementById("allOrderList");
  allOrderList.innerHTML = '';

  if (!isAdmin) {
    allOrderList.innerHTML = '<p>Access denied. Only admin can view all orders.</p>';
    return;
  }

  db.ref("orders").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      allOrderList.innerHTML = '<p class="no-orders-message">No orders found.</p>';
      return;
    }

    let count = 1;
    snapshot.forEach(child => {
      const order = child.val();
      const key = child.key;

      const div = document.createElement('div');
      div.className = 'order';
      div.innerHTML = `
        <h4>Order #${count}</h4>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Payment:</strong> ${order.payment}</p>
        <p><strong>Items:</strong></p>
        <ul>${order.items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('')}</ul>
        <button onclick="markAsDelivered('${key}')" class="mark-delivered-btn">✅ Mark as Delivered</button>
`
      allOrderList.appendChild(div);
      count++;
    });
  });
}
function markAsDelivered(orderKey) {
  if (confirm("Mark this order as delivered? It will be deleted for both admin and customer.")) {
   
    db.ref("orders/" + orderKey).once("value").then(snapshot => {
      const order = snapshot.val();
      const orderTimestamp = order?.timestamp;

      db.ref("orders/" + orderKey).remove()
        .then(() => { 
          let myOrders = JSON.parse(localStorage.getItem("myOrders")) || [];
          myOrders = myOrders.filter(o => o.timestamp !== orderTimestamp);
          localStorage.setItem("myOrders", JSON.stringify(myOrders));

          alert("✅ Order marked as delivered and removed from both admin and customer view.");
          renderAllOrders();
        })
        .catch(error => {
          console.error("❌ Error deleting order:", error);
          alert("Failed to mark as delivered.");
        });
    });
  }
}



function deleteOrder(orderKey) {
  if (confirm("Are you sure you want to delete this order?")) {
    db.ref("orders/" + orderKey).remove()
      .then(() => {
        alert("Order deleted successfully.");
        renderAllOrders(); 
      })
      .catch(error => {
        console.error("Error deleting order:", error);
        alert("Failed to delete order.");
      });
  }
}


function searchPackages() {
  const input = document.getElementById('searchBar').value.toLowerCase();
  const packageElements = document.querySelectorAll('.packages');
  packages.forEach(package => {
    const name = package.textContent.toLowerCase();
    package.style.display = name.includes(input) ? 'block' : 'none';
  });
}

function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const validUsername = "hunarsaazowner";
  const validPassword = "hunarkosaazdo321";

  if (username === validUsername && password === validPassword) {
    alert("Login successful!");
    isAdmin = true;
    document.getElementById('addPackageLink').style.display = 'inline-block';
    document.getElementById('login').style.display = 'none';
    document.getElementById('allOrdersLink').style.display = 'inline-block';
     document.getElementById('ordersLink').style.display = 'none';
    showSection('addPackage');
  } else {
    alert("Invalid username or password.");
  }
}

document.addEventListener('keydown', function (e) {
  if (e.altKey && e.key.toLowerCase() === 'l') {
    showSection('login');
  }
});

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('addPackageLink').style.display = 'none';
  document.getElementById('allOrdersLink').style.display = 'none';
  document.getElementById('login').style.display = 'none';
  document.getElementById('proceedToCheckout')?.addEventListener('click', function () {
    showSection('checkoutSection');
  });
  cart = JSON.parse(localStorage.getItem('cart')) || [];

  try {
    const response = await fetch('packages.json');
    packages = await response.json();
  } catch (err) {
    console.error('Failed to load packages.json:', err);
    packages = [];
  }

  renderPackages();
  renderCart();
  renderOrders();
});


