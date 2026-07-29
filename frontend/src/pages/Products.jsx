import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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
  const [limit] = useState(10);
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

      // Displays a Centered Success Modal
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
      setIsDrawerOpen(true); // Reabre o drawer para o usuário corrigir o erro
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

  // Delete Product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setSubmitting(true);
    try {
      await inventoryService.deleteProduct(productToDelete.id);
      const deletedProd = productToDelete;
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchData();

      setSuccessModal({
        isOpen: true,
        title: t('products.delete_modal.success_title', '¡Producto Eliminado!'),
        subtitle: t('products.delete_modal.success_subtitle', 'El producto ha sido eliminado del sistema.'),
        details: [
          { label: t('products.modal.label_name'), value: deletedProd.name, highlight: 'text-white' },
          { label: t('products.modal.label_sku'), value: deletedProd.sku, highlight: 'text-rose-400' },
        ],
      });
    } catch (err) {
      setShowDeleteModal(false);
      if (err.response?.status === 401) {
        alert(t('products.session_expired'));
      } else {
        alert(t('products.delete_failed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === '' || product.category_id === Number(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const selectedCategoryName = categories.find(
    (c) => c.id === Number(pendingFormData?.category_id)
  )?.name || '—';

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto relative space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('products.title')}</h1>
            <p className="text-sm text-slate-400">{t('products.subtitle')}</p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreateDrawer}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('products.new_product')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('products.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
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

        {/* Product Table */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">{t('products.loading')}</div>
          ) : error ? (
            <div className="p-12 text-center text-rose-400">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Package className="w-8 h-8 text-slate-500" />
              <p>{t('products.no_results')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">{t('products.th_product')}</th>
                    <th className="py-3 px-4">{t('products.th_sku')}</th>
                    <th className="py-3 px-4">{t('products.th_category')}</th>
                    <th className="py-3 px-4 text-right">{t('products.th_price')}</th>
                    <th className="py-3 px-4 text-center">{t('products.th_stock')}</th>
                    {isAdmin && <th className="py-3 px-4 text-center">{t('products.th_actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredProducts.map((prod) => (
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                          {prod.stock_quantity} u.
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditDrawer(prod)}
                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-400 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(prod);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-t border-slate-700">
            <button
              disabled={skip === 0}
              onClick={() => setSkip((prev) => Math.max(0, prev - limit))}
              className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-xs rounded"
            >
              <ChevronLeft className="w-4 h-4" /> {t('products.btn_prev')}
            </button>
            <span className="text-xs text-slate-400">
              {t('products.skip_label')}: {skip} | {t('products.limit_label')}: {limit}
            </span>
            <button
              disabled={products.length < limit}
              onClick={() => setSkip((prev) => prev + limit)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-xs rounded"
            >
              {t('products.btn_next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SIDE DRAWER (FORM) */}
        <ProductDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSubmitForm={handleSubmitForm}
          productToEdit={selectedProduct}
          categories={categories}
          error={drawerError}
        />

        {/* MODAL CENTRALIZED CONFIRMATION (CREATION / EDITING) */}
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
              setIsDrawerOpen(true); // Volta para o formulário
            }}
            confirmText={t('products.modal.btn_confirm_save')}
            cancelText={t('products.modal.btn_back')}
            loading={submitting}
          />
        )}

        {/*  CENTRALIZED EXCLUSION MODAL */}
        {productToDelete && (
          <ConfirmationModal
            isOpen={showDeleteModal}
            type="delete"
            title={t('products.delete_modal.title')}
            subtitle={t('products.delete_modal.subtitle')}
            details={[
              { label: t('products.modal.label_name'), value: productToDelete.name, highlight: 'text-white font-bold' },
              { label: t('products.modal.label_sku'), value: productToDelete.sku, highlight: 'text-rose-400' },
            ]}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setProductToDelete(null);
            }}
            confirmText={t('products.delete_modal.btn_confirm')}
            cancelText={t('products.delete_modal.btn_cancel')}
            loading={submitting}
          />
        )}

        {/* CENTRALIZED SUCCESS MODAL */}
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