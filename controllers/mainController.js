import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

export const home = async (req, res) => {
  let customer = await Customer.findById(req.user._id);
  if (!customer.cart) {
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
  }
  if (!customer.purchases) {
    customer.purchases = { items: [], totalQuantity: 0, totalPrice: 0 };
  } 
  customer.save();
  
  const products = await Product.find();
  res.render('index', { products });
};


export const getProducts = async (req, res) => {
  const { name } = req.body;
  let query = {};

  if (name) {
    query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
  }

  try {
    const products = await Product.find(query).sort({price: -1});
    res.json(products); // Send back JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send(error);
  }
};

export const addToCart = async (req, res) => {
  try {
    let { productId, quantity } = req.body;
    quantity = parseInt(quantity);
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    const price = product.price;
  
    const userId = req.user._id;
    if (product.stock<quantity)
      {
        req.flash('error', `Not enough stock for ${product.name}!`);
        res.redirect('/');
      }
    else
    {
      let customer = await Customer.findOne({ _id: userId });
    console.log(customer);
    
    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      customer.cart.items[itemIndex].quantity += quantity;
      customer.cart.items[itemIndex].price = price;
    } else {
      customer.cart.items.push({ productId, quantity, price });
    }
    customer.cart.totalQuantity += quantity;
    customer.cart.totalPrice += price * quantity;
    
    product.stock -= quantity;
    await product.save();
    await customer.save();
    const populatedCustomer = await Customer.findOne({ _id: userId }).populate('cart.items.productId');
    console.log("added");
    req.flash('success', `${product.name} added to cart!`);
    res.redirect('/');    
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

export const showCart = async (req, res) => {
  try {
    const populatedCustomer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');
    res.render('cart', {user: populatedCustomer});
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

export const clearCart = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user });
    for (const item of customer.cart.items) {
      const product = await Product.findById(item.productId);
      console.log(product);
      if (product) {
        product.stock += item.quantity; // Replenish the stock
        await product.save();
      }
    }
    //for loop in items and put them back into the products
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    
    customer.save();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

export const deleteItem = async (req, res) => {
  try {
    const { productId } = req.body; // Retrieve productId sent from the form
    const customer = await Customer.findOne({ _id: req.user._id }); // Assuming req.user._id holds the current user's ID

    if (!customer) {
      return res.status(404).send('Customer not found');
    }

    // Find the index of the item in the cart
    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);
    
    console.log(itemIndex);
    console.log(productId);
    if (itemIndex > -1) {
      // If product is found in the cart, adjust the product stock
      const product = await Product.findById(productId);
      if (product) {
        product.stock += customer.cart.items[itemIndex].quantity; // Add back the quantity to the product's stock
        await product.save();
        req.flash('delete', `${product.name} deleted!`);
      }

      // Optional: Recalculate totalQuantity and totalPrice if you store these in the cart
      customer.cart.totalQuantity -= customer.cart.items[itemIndex].quantity;
      let removedItemTotal = customer.cart.items[itemIndex].price * customer.cart.items[itemIndex].quantity;
      customer.cart.items.splice(itemIndex, 1);
      customer.cart.totalPrice = customer.cart.totalPrice > removedItemTotal ? customer.cart.totalPrice - removedItemTotal : 0;

      await customer.save();
    } else {
      return res.status(404).send('Item not found in cart');
    }
    
    res.redirect('/showCart');
  } catch (error) {
    console.error('Error deleting item from cart:', error);
    res.status(500).send('An error occurred');
  }
};


export const purchase = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');

    const cartItems = customer.cart.items;

    cartItems.forEach(cartItem => {
      const { productId, quantity, price } = cartItem; 
      
      const itemIndex = customer.purchases.items.findIndex(purchaseItem => purchaseItem.productId.toString() === productId.toString());

      if (itemIndex > -1) {
        customer.purchases.items[itemIndex].quantity += quantity;
        customer.purchases.items[itemIndex].price = price;
      } else {
        customer.purchases.items.push({ productId: productId, quantity: quantity, price: price });
      }
      
      customer.purchases.totalQuantity += quantity;
      customer.purchases.totalPrice += price * quantity;
    });
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    await customer.save();
    res.redirect('/clearCart'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

export const customer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user }).populate('purchases.items.productId');

    res.render('customer', {user: customer}); 
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

export const reviews = async (req, res) => {
  try {
    const {productId} = req.body;
    console.log(productId);
    // Fetch the product and populate the customer details in reviews
    const product = await Product.findById(productId);
    console.log(product);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Render the productReviews.ejs view, passing the product data
    res.render('reviews', { product });
  } catch (error) {
    console.error('Failed to fetch product reviews:', error);
    res.status(500).send('An error occurred while fetching product reviews');
  }
};

export const submitReview = async (req, res) => {
  const { comment } = req.body;
  const { productId } = req.params;
  const customerId = req.user._id;
  try {
    const product = await Product.findById(productId);
    const customer = await Customer.findById(customerId);
    if (!product || !customer) {
      return res.status(404).send('Product not found');
    }

    const newReview = {
      customer: customer.username, // Assumes you have access to the user's ID from the session
      product: product.name,
      productId,
      comment,
      createdAt: new Date() // Manually set the date since Mongoose defaults only apply on save
    };

    product.reviews.push(newReview);
    customer.reviews.push(newReview);
    await product.save();
    await customer.save();
    res.render('reviews', { product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to add review');
  }
};