import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryService } from '../services/Api';

export default function MovementDrawer({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [foundProduct, setFoundProduct] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [movementType, setMovementType] = useState('in');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // --- SKU Normalization Auxiliary Function ---
  const formatSKU = (input) => {
    const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = clean.match(/^([A-Z]{3})([A-Z]{2})(\d+)$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return clean;
  };

  // --- SMART PRODUCT SEARCH ---
  const handleSearchProduct = async (e) => {
    if (e) e.preventDefault();
    const rawTerm = searchQuery.trim();
    if (!rawTerm) return;

    setSearchingProduct(true);
    setSearchError('');
    setFoundProduct(null);

    try {
      let data = null;

      if (!isNaN(rawTerm)) {
        try {
          data = await inventoryService.getProductById(Number(rawTerm));
        } catch (err) {
          data = await inventoryService.getProductBySku(rawTerm);
        }
      } else {
        const formattedSKU = formatSKU(rawTerm);
        try {
          data = await inventoryService.getProductBySku(formattedSKU);
        } catch (err) {
          data = await inventoryService.getProductBySku(rawTerm.toUpperCase());
        }
      }

      setFoundProduct(data);
    } catch (err) {
      setSearchError(t('movements.product_not_found', 'Producto no encontrado.'));
    } finally {
      setSearchingProduct(false);
    }
  };

  // --- VALIDATIONS AND CALCULATIONS ---
  const numQty = Number(quantity);
  const isQuantityValid = numQty > 0;
  const isStockInsufficient = movementType === 'out' && foundProduct && numQty > foundProduct.stock_quantity;
  const isFormValid = foundProduct && isQuantityValid && !isStockInsufficient;
  const totalOperationValue = foundProduct ? (numQty * Number(foundProduct.price || 0)).toFixed(2) : '0.00';

  const newStockResult = foundProduct
    ? (movementType === 'in' ? foundProduct.stock_quantity + numQty : foundProduct.stock_quantity - numQty)
    : 0;

  const resetForm = () => {
    setSearchQuery('');
    setFoundProduct(null);
    setSearchError('');
    setQuantity(1);
    setMovementType('in');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirmTransaction = async () => {
    setSubmitting(true);
    try {
      await inventoryService.createTransaction({
        product_id: foundProduct.id,
        quantity: numQty,
        movement_type: movementType
      });

      setIsConfirmModalOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert(error.response?.data?.detail || "Error processing transaction");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
      />

      {/* DRAWER FORM */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto">
        <div className="p-6 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-slate-100">{t('movements.new_op_title', 'Nueva Operación')}</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(isFormValid) setIsConfirmModalOpen(true); }} className="space-y-6">
              {/* SEARCH */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('movements.form_search_label', 'Buscar Producto (ID o SKU)')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchProduct();
                      }
                    }}
                    placeholder={t('movements.form_search_placeholder', 'ej. 1 o monlg24 (MON-LG-24)...')}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearchProduct}
                    disabled={searchingProduct || !searchQuery.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {searchingProduct ? '...' : t('movements.btn_search', 'Buscar')}
                  </button>
                </div>
                {searchError && <p className="text-xs text-red-400 mt-2">{searchError}</p>}
              </div>

              {/* PRODUCT DETAILS (Current data only) */}
              {foundProduct && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase">{t('movements.prod_name', 'Nombre')}</span>
                    <p className="text-sm font-bold text-slate-200">{foundProduct.name} <span className="text-xs text-slate-500">(#{foundProduct.id})</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase">{t('movements.current_stock', 'Stock Actual')}</span>
                      <p className="text-sm font-bold text-slate-300">{foundProduct.stock_quantity} u</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase">{t('movements.unit_price', 'Precio Unitario')}</span>
                      <p className="text-sm font-bold text-slate-300">€{Number(foundProduct.price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* OPERATION TYPE */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('movements.op_type', 'Tipo de Operación')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMovementType('in')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition border ${
                      movementType === 'in' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    + {t('movements.type_in', 'ENTRADA')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('out')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition border ${
                      movementType === 'out' ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    - {t('movements.type_out', 'SALIDA')}
                  </button>
                </div>
              </div>

              {/* QUANTITY */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('movements.qty_label', 'Cantidad')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                {isStockInsufficient && (
                  <p className="text-xs text-red-400 mt-2 font-medium">⚠️ {t('movements.err_insufficient_stock', 'Stock insuficiente para realizar esta salida.')}</p>
                )}
              </div>

              {/* FOOTER IMPACT SUMMARY */}
              {foundProduct && isQuantityValid && (
                <div className="border-t border-slate-800 pt-4 mt-2">
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-2 font-mono text-xs">
                    
                    {/* New Resulting Stock Line */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-sans">{t('movements.new_stock_label', 'Nuevo Stock Resultante')}:</span>
                      <span className={`font-bold ${
                        movementType === 'in' 
                          ? 'text-emerald-400' 
                          : (newStockResult < 0 ? 'text-red-400' : 'text-amber-400')
                      }`}>
                        {newStockResult} u
                      </span>
                    </div>

                    {/* Total Transaction Value Line */}
                    <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
                      <span className="text-slate-400 font-sans">{t('movements.total_value', 'Valor Total de la Operación')}:</span>
                      <span className="font-bold text-indigo-400 text-sm">€{totalOperationValue}</span>
                    </div>

                  </div>
                </div>
              )}
            </form>
          </div>

          {/* DRAWER ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition">
              {t('movements.btn_cancel', 'Cancelar')}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={!isFormValid}
              className="px-4 py-2 bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition"
            >
              {t('movements.btn_save', 'Guardar')}
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">{t('movements.modal_title', 'Confirmar Operación')}</h3>
            <p className="text-sm text-slate-400">{t('movements.modal_desc', '¿Está seguro de realizar este movimiento?')}</p>
            
            <div className="bg-slate-950 p-3 rounded-lg text-xs space-y-1 font-mono text-slate-300 border border-slate-800">
              <p><span className="text-slate-500">Producto:</span> {foundProduct?.name}</p>
              <p><span className="text-slate-500">Tipo:</span> <strong className={movementType === 'in' ? 'text-emerald-400' : 'text-red-400'}>{movementType.toUpperCase()}</strong></p>
              <p><span className="text-slate-500">Cantidad:</span> {quantity} u</p>
              <p><span className="text-slate-500">Total:</span> €{totalOperationValue}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsConfirmModalOpen(false)} 
                disabled={submitting} 
                className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                {t('movements.modal_btn_cancel', 'Volver')}
              </button>
              <button 
                type="button" 
                onClick={handleConfirmTransaction} 
                disabled={submitting} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold transition"
              >
                {submitting ? '...' : t('movements.modal_btn_confirm', 'Confirmar y Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}