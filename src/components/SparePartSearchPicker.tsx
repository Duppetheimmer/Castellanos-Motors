import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertTriangle, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { Repuesto } from '../types';

interface SparePartSearchPickerProps {
  repuestos: Repuesto[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  filterAvailableOnly?: boolean;
}

export function SparePartSearchPicker({
  repuestos,
  selectedId,
  onSelect,
  placeholder = 'Buscar por nombre, código o categoría...',
  filterAvailableOnly = false
}: SparePartSearchPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPart = repuestos.find((r) => r.id === selectedId);

  // Sync search input with selected item name initially
  useEffect(() => {
    if (selectedPart) {
      setSearchTerm(selectedPart.nombre);
    } else {
      setSearchTerm('');
    }
  }, [selectedId, selectedPart]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset to selected part name if any
        if (selectedPart) {
          setSearchTerm(selectedPart.nombre);
        } else {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPart]);

  // Smart matching algorithm
  const filteredParts = repuestos
    .filter((r) => {
      if (filterAvailableOnly && r.cantidad <= 0) return false;
      
      const query = searchTerm.trim().toLowerCase();
      if (!query || (selectedPart && selectedPart.nombre === searchTerm)) return true;

      const terms = query.split(/\s+/);
      
      // Match if all search terms appear anywhere in the item attributes
      const matchText = `${r.nombre} ${r.codigo} ${r.categoria} ${r.referencia} ${r.proveedor} ${r.ubicacion}`.toLowerCase();
      return terms.every((term) => matchText.includes(term));
    })
    .sort((a, b) => {
      // Prioritize perfect code match or prefix match
      const query = searchTerm.trim().toLowerCase();
      if (!query) return 0;

      const aCode = a.codigo.toLowerCase();
      const bCode = b.codigo.toLowerCase();
      const aName = a.nombre.toLowerCase();
      const bName = b.nombre.toLowerCase();

      if (aCode === query) return -1;
      if (bCode === query) return 1;

      if (aCode.startsWith(query) && !bCode.startsWith(query)) return -1;
      if (bCode.startsWith(query) && !aCode.startsWith(query)) return 1;

      if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1;

      return 0;
    });

  const handleSelect = (part: Repuesto) => {
    onSelect(part.id);
    setSearchTerm(part.nombre);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredParts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredParts.length) {
        handleSelect(filteredParts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedPart) {
        setSearchTerm(selectedPart.nombre);
      } else {
        setSearchTerm('');
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full text-slate-800">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value && selectedId) {
              onSelect('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full text-xs p-2.5 pl-9 pr-8 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-3.5 h-3.5" />
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setHighlightedIndex(-1);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-slate-150 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filteredParts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
              <span>No se encontraron repuestos</span>
              <span className="text-[10px] text-slate-400 font-normal">Intenta con otra palabra clave o código</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {filteredParts.map((part, index) => {
                const isSelected = part.id === selectedId;
                const isHighlighted = index === highlightedIndex;
                const isLowStock = part.cantidad <= part.stock_min;
                const isOutOfStock = part.cantidad === 0;

                return (
                  <div
                    key={part.id}
                    onClick={() => !isOutOfStock && handleSelect(part)}
                    className={`p-2.5 text-left text-xs cursor-pointer flex items-start justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-900 font-medium' : ''
                    } ${
                      isHighlighted ? 'bg-slate-50 text-slate-900' : ''
                    } ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-100/50' : 'hover:bg-slate-50/80'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{part.nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-normal">[{part.codigo}]</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-600 font-medium">{part.categoria}</span>
                        {part.referencia && <span className="text-slate-400 font-mono">Ref: {part.referencia}</span>}
                        {part.ubicacion && <span className="text-slate-450">📍 {part.ubicacion}</span>}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 font-mono block">${part.precio}</span>
                      <span className={`text-[10px] font-bold block mt-0.5 ${
                        isOutOfStock 
                          ? 'text-rose-600' 
                          : isLowStock 
                            ? 'text-amber-600 animate-pulse' 
                            : 'text-emerald-600'
                      }`}>
                        {isOutOfStock ? 'Agotado' : `Stock: ${part.cantidad} uds`}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="self-center shrink-0 pl-1 text-blue-600">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
