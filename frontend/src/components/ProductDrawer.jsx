import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Plus, Check, X, Search } from 'lucide-react';
import { categoryService } from '../services/api';

export default function ProductDrawer({ isOpen, onClose, onSubmitForm, productToEdit, categories: initialCategories, error }) {
  const { t } = useTranslation();

  const [categories, setCategories] = useState(initialCategories || []);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    price: '',
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [categorySearch, setCategorySearch] = useState('');

  const isEditing = Boolean(productToEdit);

  useEffect(() => {
    setCategories(initialCategories || []);
  }, [initialCategories]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        category_id: productToEdit.category_id || '',
        price: productToEdit.price || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        price: '',
      });
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
    setCategoryError('');
    setCategorySearch('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const formatSKU = (val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 3) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 7)}`;
  };

  const normalizeText = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
  };

  // Function to format the category: First letter uppercase, the rest lowercase.
  const formatCategoryName = (str) => {
    const cleaned = normalizeText(str);
    if (!cleaned) return '';
    return cleaned
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Validation and Inline New Category Addition Logic
  const handleCreateInlineCategory = async () => {
    setCategoryError('');
    const rawInput = newCategoryName.trim();

    if (!rawInput) {
      setCategoryError(t('categories.empty_error', 'El nombre no puede estar vacío'));
      return;
    }

    // Formats the input to the database standard (e.g., "Eletronica")
    const formattedName = formatCategoryName(rawInput);
    
    const upperInput = normalizeText(rawInput).toUpperCase();
    const firstLetterInput = upperInput.charAt(0);

    // Filters only categories that start with the same first letter.
    const candidates = categories.filter((cat) => {
      const catUpper = normalizeText(cat.name).toUpperCase();
      return catUpper.startsWith(firstLetterInput);
    });

    // Checks if it already exists in uppercase
    const alreadyExists = candidates.some((cat) => {
      const catUpper = normalizeText(cat.name).toUpperCase();
      return catUpper === upperInput;
    });

    if (alreadyExists) {
      setCategoryError(t('categories.already_exists', 'Esta categoría ya existe'));
      return;
    }

    setCreatingCategory(true);
    try {
      const createdCategory = await categoryService.createCategory({ name: formattedName });
      
      const updatedList = [...categories, createdCategory];
      setCategories(updatedList);
      setFormData((prev) => ({ ...prev, category_id: createdCategory.id }));

      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err) {
      console.error('Error creating category:', err);
      const detail = err.response?.data?.detail;
      setCategoryError(typeof detail === 'string' ? detail : t('categories.create_error', 'Error al crear la categoría'));
    } finally {
      setCreatingCategory(false);
    }
  };

  // Categories filtered by the quick search bar
  const filteredCategories = categories.filter((cat) =>
    normalizeText(cat.name)
      .toLowerCase()
      .includes(normalizeText(categorySearch).toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sku' ? formatSKU(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitForm({
      name: formData.name.trim(),
      sku: formatSKU(formData.sku),
      category_id: Number(formData.category_id),
      price: parseFloat(formData.price),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col justify-between">
          
          <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEditing ? t('products.modal.edit_title') : t('products.modal.create_title')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing ? t('products.modal.edit_subtitle') : t('products.modal.create_subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('products.modal.label_name')}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('products.modal.placeholder_name')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('products.modal.label_sku')}
                </label>
                <input
                  type="text"
                  name="sku"
                  required
                  disabled={isEditing}
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder={t('products.modal.placeholder_sku')}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors ${
                    isEditing ? 'opacity-60 cursor-not-allowed bg-slate-900/50' : ''
                  }`}
                />
                {isEditing && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('products.modal.sku_disabled_hint')}
                  </p>
                )}
              </div>

              {/* CATEGORY SECTION */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {t('products.modal.label_category')}
                  </label>
                  {!isAddingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(true);
                        setCategoryError('');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('categories.btn_add_inline')}
                    </button>
                  )}
                </div>

                {/* INLINE FORM FOR NEW CATEGORY */}
                {isAddingCategory ? (
                  <div className="space-y-2 bg-slate-950/80 p-3 rounded-lg border border-emerald-500/30">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t('categories.placeholder_inline')}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateInlineCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={creatingCategory}
                        onClick={handleCreateInlineCategory}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer transition-colors"
                        title={t('common.save')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                          setCategoryError('');
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
                        title={t('common.cancel')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {categoryError && (
                      <p className="text-xs text-rose-400 font-medium">{categoryError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Quick Search Bar */}
                    {categories.length > 5 && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder={t('categories.search_placeholder')}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    )}

                    {/* Dropdown / Select from Categories */}
                    <select
                      name="category_id"
                      required
                      value={formData.category_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="" disabled>
                        {t('products.modal.select_category')}
                      </option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('products.modal.label_price')} (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Informational Inventory */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('products.modal.label_stock')}
                </label>
                <input
                  type="text"
                  disabled
                  value={isEditing ? `${productToEdit.stock_quantity} u.` : `0 u.`}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800/60 rounded-lg text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {t('products.modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  {t('products.modal.save')}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}