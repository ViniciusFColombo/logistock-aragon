import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Edit2, Package, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import ProductDrawer from '../components/ProductDrawer';
import ConfirmationModal from '../components/ConfirmationModal';
import { inventoryService, categoryService } from '../services/api';

export default function Products() {
  const { t } = useTranslation();

  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded.role === 'admin';
    } catch (e) {
      isAdmin = false;
    }
  }

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerError, setDrawerError] = useState(null);

  // Drawer States and Centered Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);

  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);

  // Sorting State: { key: 'name' | 'sku' | 'category' | 'price' | 'stock', direction: 'asc' | 'desc' | null }
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Successful Modal
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    details: [],
  });

  const [submitting, setSubmitting] = useState(false);

  // Pagination and Filters
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, [skip]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        inventoryService.getProducts(skip, limit),
        categoryService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t('products.session_expired'));
      } else {
        setError(t('products.error_loading'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDrawer = () => {
    setSelectedProduct(null);
    setDrawerError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (product) => {
    setSelectedProduct(product);
    setDrawerError(null);
    setIsDrawerOpen(true);
  };

  const handleSubmitForm = (data) => {
    setPendingFormData(data);
    setIsDrawerOpen(false);
    setShowConfirmSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingFormData) return;
    setSubmitting(true);

    try {
      const isEditing = Boolean(selectedProduct);
      if (isEditing) {
        await inventoryService.updateProduct(selectedProduct.id, pendingFormData);
      } else {
        await inventoryService.createProduct(pendingFormData);
      }

      const catName = categories.find((c) => c.id === pendingFormData.category_id)?.name || '—';

      setShowConfirmSaveModal(false);
      fetchData();

      setSuccessModal({
        isOpen: true,
        title: isEditing ? t('products.modal.success_edit_title') : t('products.modal.success_create_title'),
        subtitle: t('products.modal.success_message'),
        details: [
          { label: t('products.modal.label_name'), value: pendingFormData.name, highlight: 'text-white' },
          { label: t('products.modal.label_sku'), value: pendingFormData.sku, highlight: 'text-emerald-400' },
          { label: t('products.modal.label_category'), value: catName, highlight: 'text-slate-300' },
          { label: t('products.modal.label_price'), value: `€${pendingFormData.price.toFixed(2)}`, highlight: 'text-white' },
        ],
      });
      setPendingFormData(null);
      setSelectedProduct(null);
    } catch (err) {
      setShowConfirmSaveModal(false);
      setIsDrawerOpen(true);
      if (err.response?.status === 401) {
        setDrawerError(t('products.session_expired'));
      } else {
        const detail = err.response?.data?.detail;
        setDrawerError(typeof detail === 'string' ? detail : t('products.modal.error_save'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sorting Handler
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  // Render Sorting Icon
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
    );
  };

  // Filtered & Sorted Products
  const processedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === '' || product.category_id === Number(selectedCategory);
      return matchesSearch && matchesCategory;
    });

    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let valA, valB;

        switch (sortConfig.key) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'sku':
            valA = a.sku.toLowerCase();
            valB = b.sku.toLowerCase();
            break;
          case 'category':
            valA = (categories.find((c) => c.id === a.category_id)?.name || '').toLowerCase();
            valB = (categories.find((c) => c.id === b.category_id)?.name || '').toLowerCase();
            break;
          case 'price':
            valA = Number(a.price);
            valB = Number(b.price);
            break;
          case 'stock':
            valA = Number(a.stock_quantity);
            valB = Number(b.stock_quantity);
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortConfig, categories]);

  const selectedCategoryName = categories.find(
    (c) => c.id === Number(pendingFormData?.category_id)
  )?.name || '—';

  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('products.title')}</h1>
            <p className="text-sm text-slate-400">{t('products.subtitle')}</p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreateDrawer}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {t('products.new_product')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('products.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="">{t('products.all_categories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table Container */}
        <div className="flex-1 flex flex-col justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>{t('products.loading')}</span>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-400">{error}</div>
          ) : processedProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Package className="w-8 h-8 text-slate-500" />
              <p>{t('products.no_results')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/60 select-none">
                  <tr>
                    {/* PRODUCT */}
                    <th 
                      onClick={() => handleSort('name')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t('products.th_product')}</span>
                        {renderSortIcon('name')}
                      </div>
                    </th>

                    {/* SKU */}
                    <th 
                      onClick={() => handleSort('sku')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t('products.th_sku')}</span>
                        {renderSortIcon('sku')}
                      </div>
                    </th>

                    {/* CATEGORY */}
                    <th 
                      onClick={() => handleSort('category')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t('products.th_category')}</span>
                        {renderSortIcon('category')}
                      </div>
                    </th>

                    {/* PRICE */}
                    <th 
                      onClick={() => handleSort('price')}
                      className="py-3 px-4 text-right cursor-pointer hover:text-white transition group"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t('products.th_price')}</span>
                        {renderSortIcon('price')}
                      </div>
                    </th>

                    {/* STOCK */}
                    <th 
                      onClick={() => handleSort('stock')}
                      className="py-3 px-4 text-center cursor-pointer hover:text-white transition group"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{t('products.th_stock')}</span>
                        {renderSortIcon('stock')}
                      </div>
                    </th>

                    {isAdmin && <th className="py-3 px-4 text-center">{t('products.th_actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {processedProducts.map((prod) => {
                    const isZeroStock = prod.stock_quantity === 0;
                    const isLowStock = prod.stock_quantity > 0 && prod.stock_quantity <= 5;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">{prod.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{prod.sku}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-emerald-400 border border-emerald-500/20">
                            {categories.find((c) => c.id === prod.category_id)?.name || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                          €{prod.price.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              isZeroStock
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : isLowStock
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {prod.stock_quantity} u.
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenEditDrawer(prod)}
                              className="p-1.5 hover:bg-slate-700/80 rounded-md text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-t border-slate-700/60">
            <button
              disabled={skip === 0}
              onClick={() => setSkip((prev) => Math.max(0, prev - limit))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-200 rounded-md transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> {t('products.btn_prev')}
            </button>
            <span className="text-xs font-medium text-slate-400">
              Página {currentPage}
            </span>
            <button
              disabled={products.length < limit}
              onClick={() => setSkip((prev) => prev + limit)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-200 rounded-md transition cursor-pointer"
            >
              {t('products.btn_next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Side Drawer (Form) */}
        <ProductDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSubmitForm={handleSubmitForm}
          productToEdit={selectedProduct}
          categories={categories}
          error={drawerError}
        />

        {/* Confirmation Modal */}
        {pendingFormData && (
          <ConfirmationModal
            isOpen={showConfirmSaveModal}
            type="confirm"
            title={t('products.modal.confirm_title')}
            subtitle={
              selectedProduct
                ? t('products.modal.confirm_subtitle_edit')
                : t('products.modal.confirm_subtitle_create')
            }
            details={[
              { label: t('products.modal.label_name'), value: pendingFormData.name, highlight: 'text-white font-bold' },
              { label: t('products.modal.label_sku'), value: pendingFormData.sku, highlight: 'text-emerald-400' },
              { label: t('products.modal.label_category'), value: selectedCategoryName, highlight: 'text-slate-300' },
              { label: t('products.modal.label_price'), value: `€${pendingFormData.price.toFixed(2)}`, highlight: 'text-white font-bold' },
            ]}
            onConfirm={handleConfirmSave}
            onCancel={() => {
              setShowConfirmSaveModal(false);
              setIsDrawerOpen(true);
            }}
            confirmText={t('products.modal.btn_confirm_save')}
            cancelText={t('products.modal.btn_back')}
            loading={submitting}
          />
        )}

        {/* Success Modal */}
        <ConfirmationModal
          isOpen={successModal.isOpen}
          type="success"
          title={successModal.title}
          subtitle={successModal.subtitle}
          details={successModal.details}
          onConfirm={() => setSuccessModal({ ...successModal, isOpen: false })}
          confirmText={t('products.modal.btn_finish', 'Entendido')}
        />
      </main>
    </div>
  );
}