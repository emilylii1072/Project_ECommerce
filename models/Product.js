import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image: String,
  price: {
    type: Number,
    required: true
  },
  currentPrice: Number,
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  sales: [{ 
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date },
    amount: { type: Number},
  }],
  reviews: [
    {
      customer: { type: String},
      product: {type: String},
      productId: {type: Schema.Types.ObjectId, ref: 'Product'},
      comment: { type: String},
      createdAt: { type: Date, default: Date.now }
    }]
});

// Check if the model exists before compiling it
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;