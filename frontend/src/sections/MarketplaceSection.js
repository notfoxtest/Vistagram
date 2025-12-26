import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { 
  ShoppingBag, Search, Filter, Plus, Tag, Star, Package, 
  Upload, X, Loader2, Download, Image
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const categories = [
  { id: 'all', name: 'All Items' },
  { id: 'models', name: 'Models' },
  { id: 'plugins', name: 'Plugins' },
  { id: 'scripts', name: 'Scripts' },
  { id: 'animations', name: 'Animations' },
  { id: 'audio', name: 'Audio' },
  { id: 'images', name: 'Images' },
  { id: 'meshes', name: 'Meshes' },
];

export default function MarketplaceSection() {
  const { user, axiosInstance } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await axiosInstance.get('/marketplace/products', { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="marketplace-section">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--bg-layer1)]/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-outfit font-bold text-[var(--text-primary)]">Creator Marketplace</h1>
              <p className="text-sm text-[var(--text-muted)]">Buy and sell digital assets</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateProduct(true)} className="btn-roblox" data-testid="create-product-btn">
            <Plus className="w-4 h-4 mr-2" /> List Product
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-[var(--accent-primary)] text-white' 
                    : 'bg-[var(--bg-layer2)] text-[var(--text-secondary)] hover:bg-[var(--bg-layer3)]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Package className="w-16 h-16 text-[var(--text-muted)] mb-4" />
            <h2 className="text-xl font-outfit font-semibold text-[var(--text-primary)] mb-2">No Products Found</h2>
            <p className="text-[var(--text-muted)] mb-4">Be the first to list a product!</p>
            <Button onClick={() => setShowCreateProduct(true)} className="btn-roblox">
              <Plus className="w-4 h-4 mr-2" /> List Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setSelectedProduct(product)}
                className="glass-card overflow-hidden cursor-pointer group"
                data-testid={`product-${product.id}`}
              >
                <div className="aspect-video bg-[var(--bg-layer2)] relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                    {product.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] truncate">{product.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded bg-[var(--accent-success)] flex items-center justify-center">
                        <span className="text-xs text-white font-bold">R$</span>
                      </div>
                      <span className="font-bold text-[var(--accent-success)]">{product.price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-muted)] text-sm">
                      <Download className="w-4 h-4" />
                      <span>{product.sales_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--glass-border)]">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img src={product.seller?.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">{product.seller?.username}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">List New Product</DialogTitle>
          </DialogHeader>
          <CreateProductForm 
            axiosInstance={axiosInstance}
            onSuccess={(product) => { 
              setProducts(prev => [product, ...prev]); 
              setShowCreateProduct(false); 
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <div className="aspect-video bg-[var(--bg-layer2)] rounded-xl overflow-hidden -mt-2 -mx-2 mb-4">
                {selectedProduct.images?.[0] ? (
                  <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-outfit font-bold text-[var(--text-primary)]">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img src={selectedProduct.seller?.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[var(--text-secondary)]">{selectedProduct.seller?.username}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold text-[var(--accent-success)]">
                    <span>R$</span>
                    <span>{selectedProduct.price}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{selectedProduct.sales_count || 0} sales</p>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] mt-4">{selectedProduct.description}</p>
              <div className="flex gap-3 mt-6">
                <Button className="flex-1 btn-roblox-green">
                  <ShoppingBag className="w-5 h-5 mr-2" /> Buy Now
                </Button>
                <Button variant="outline" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
                  <Star className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateProductForm({ axiosInstance, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('models');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages(prev => [...prev, response.data.url]);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/marketplace/products', {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        images
      });
      toast.success('Product listed!');
      onSuccess(response.data);
    } catch (error) {
      toast.error('Failed to list product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product name"
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
        data-testid="product-name-input"
      />

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your product..."
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)] min-h-[100px]"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-[var(--text-muted)] mb-2 block">Price (Robux)</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-layer2)] border-[var(--glass-border)]">
              {categories.filter(c => c.id !== 'all').map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-[var(--text-primary)]">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="text-sm text-[var(--text-muted)] mb-2 block">Product Images</label>
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
            ) : (
              <Image className="w-5 h-5 text-[var(--text-muted)]" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full btn-roblox" data-testid="product-submit">
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'List Product'}
      </Button>
    </form>
  );
}
