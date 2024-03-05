document.getElementById('searchInput').addEventListener('input', updateProducts);
document.getElementById('minPrice').addEventListener('change', updateProducts);
document.getElementById('maxPrice').addEventListener('change', updateProducts);
document.getElementById('sortBy').addEventListener('change', updateProducts);

async function updateProducts() {
  const name = document.getElementById('searchInput').value;
  const minPrice = Number(document.getElementById('minPrice').value);
  const maxPrice = Number(document.getElementById('maxPrice').value);
  const sortBy = document.getElementById('sortBy').value;

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      let products = await response.json();

      // Client-side filtering
      products = products.filter(product => {
        return (!minPrice || product.price >= minPrice) && (!maxPrice || product.price <= maxPrice);
      });

      // Client-side sorting
      switch (sortBy) {
        case 'priceAsc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'priceDesc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'nameAsc':
          products.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'nameDesc':
          products.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'stockDesc':
          products.sort((a, b) => b.stock - a.stock);
          break;
      }

      const container = document.getElementById('productsList');
      container.innerHTML = ''; // Clear the container

      // Display filtered and sorted products
      products.forEach(product => {
        const productElement = `
          <div>
            <p><strong>${product.name}</strong></p>
            <p>${product.description}</p>
            <p>$${product.price}</p>
            <p>${product.stock} available</p>
            <form class="mt-3" action="/reviews" method="POST">
              <input type="hidden" name="productId" value="${product._id}">
              <button type="submit"><i class="fas fa-comment"></i> Leave a Review</button>
            </form>
            <form class="mt-3" action="/addToCart" method="POST">
              <label for="quantity-${product.name.replace(/\s+/g, '-') }">Quantity:</label>
              <input type="number" id="quantity-${product.name.replace(/\s+/g, '-')}" name="quantity" value="1">
              <input type="hidden" name="productId" value="${product._id}">
              <button type="submit"><i class="fas fa-shopping-cart"></i></button>
            </form>
          </div>
        `;
        container.innerHTML += productElement;
      });
    } else {
      console.error('Response not ok with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

updateProducts();

