import React, { useState } from 'react';

const ProductCatalog = ({ products, onAddToCart }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedProduct, setAddedProduct] = useState(null);

  const handleAddToCart = async (product) => {
    try {
      setLoading(true);
      setError('');
      await onAddToCart(product.id);
      setAddedProduct(product);
      setTimeout(() => setAddedProduct(null), 2000);
    } catch (err) {
      setError(err.message || 'Failed to add product to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Our Products</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">₹{product.price}</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={loading}
                  className={`px-4 py-2 rounded ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {loading ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addedProduct && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Added {addedProduct.name} to Cart!
        </div>
      )}
    </div>
  );
};

export default ProductCatalog; 