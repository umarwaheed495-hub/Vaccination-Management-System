import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Syringe,
  Plus,
  Trash2,
  Edit3,
  PackageOpen,
  Tag,
  Package,
  Building2,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_LIMIT = 10;

const EMPTY_VIEW = {
  key: 0, // page number this data belongs to (0 = nothing loaded yet)
  brands: [],
  pagination: { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 },
  error: '',
};

const TableHead = () => (
  <thead>
    <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 font-semibold">
      <th className="py-4 px-6">Vaccine Name</th>
      <th className="py-4 px-6">Brand Name</th>
      <th className="py-4 px-6">Manufacturer</th>
      <th className="py-4 px-6">Price</th>
      <th className="py-4 px-6">Inventory (Stock)</th>
      <th className="py-4 px-6 text-right">Actions</th>
    </tr>
  </thead>
);

// One table row. memo: when only the page state changes (e.g. the table dims while the next page loads),
// rows whose brand and handlers did not change are not rendered again.
const BrandRow = memo(({ brand, onEdit, onDelete }) => (
  <tr className="hover:bg-slate-800/40 transition-colors">
    {/* Vaccine Name with Syringe Icon */}
    <td className="py-4 px-6 font-bold text-white">
      <div className="flex items-center gap-2.5">
        <Syringe className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span>{brand.vaccineName}</span>
      </div>
    </td>

    {/* Brand Name with Tag Icon */}
    <td className="py-4 px-6 text-blue-400 font-medium">
      <div className="flex items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        <span>{brand.brandName}</span>
      </div>
    </td>

    {/* Manufacturer with Building2 Icon */}
    <td className="py-4 px-6 text-slate-300">
      <div className="flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>{brand.manufacturer || 'N/A'}</span>
      </div>
    </td>

    {/* Price */}
    <td className="py-4 px-6 font-semibold text-emerald-400">Rs. {brand.price}</td>

    {/* Inventory with Package Icon */}
    <td className="py-4 px-6">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
          brand.inventory > 10
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : brand.inventory > 0
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}
      >
        <Package className="w-3 h-3" />
        {brand.inventory} units
      </span>
    </td>

    {/* Actions with Styled Outline Buttons */}
    <td className="py-4 px-6 text-right space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onEdit(brand._id)}
        className="bg-transparent border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500 h-9 w-9 rounded-xl transition-all"
        title="Edit Brand"
      >
        <Edit3 className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onDelete(brand._id)}
        className="bg-transparent border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 h-9 w-9 rounded-xl transition-all"
        title="Delete Brand"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </td>
  </tr>
));
BrandRow.displayName = 'BrandRow';

const VaccineBrandsView = () => {
  const navigate = useNavigate();

  const [view, setView] = useState(EMPTY_VIEW);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const { brands, pagination, error } = view;
  const isFirstLoad = view.key === 0; // nothing to show yet -> skeleton
  const isFetching = view.key !== page; // a new page is loading -> keep the old rows on screen, dimmed

  // 1. Load one page of brands. Changing page (or reloading) cancels the request that is still running.
  useEffect(() => {
    const controller = new AbortController();

    const fetchBrands = async () => {
      try {
        const response = await axios.get('/api/v1/vaccine-brands', {
          params: { page, limit: PAGE_LIMIT },
          withCredentials: true,
          signal: controller.signal,
        });
        const data = response.data?.data;

        // This page no longer exists (e.g. its last brand was deleted) -> go to the last page that does
        if (data.brands.length === 0 && page > 1) {
          setPage(Math.max(1, data.pagination.totalPages));
          return;
        }

        setView({ key: page, brands: data.brands, pagination: data.pagination, error: '' });
      } catch (err) {
        if (controller.signal.aborted) return; // replaced by a newer request or the page was left
        console.error('Error fetching vaccine brands:', err);
        const message = err.response?.data?.message || 'Failed to fetch vaccine brands.';
        setView({ ...EMPTY_VIEW, key: page, error: message });
        toast.error(message, { id: 'brands-load-error' });
      }
    };

    fetchBrands();
    return () => controller.abort();
  }, [page, refreshKey]);

  const reload = () => {
    setView(EMPTY_VIEW);
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = useCallback((id) => navigate(`/dashboard/edit-vaccine-brand/${id}`), [navigate]);

  // 2. Delete, then load the page again so the rows and the totals stay correct
  const brandsOnPage = brands.length;
  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this vaccine brand?')) return;

      try {
        await axios.delete(`/api/v1/vaccine-brands/${id}`, { withCredentials: true });
        toast.success('Vaccine brand deleted successfully.');

        // Deleted the only brand on this page -> step back one page, otherwise just reload this one
        if (brandsOnPage === 1 && page > 1) setPage(page - 1);
        else setRefreshKey((k) => k + 1);
      } catch (err) {
        console.error('Error deleting brand:', err);
        toast.error(err.response?.data?.message || 'Failed to delete brand.');
      }
    },
    [brandsOnPage, page]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Vaccine Brands Inventory</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Manage your clinic's vaccine brands, pricing, and stock levels.</p>
          </div>
        </div>

        {/* Redirects to Create Vaccine Brand Page */}
        <Button
          onClick={() => navigate('/dashboard/create-vaccine-brand')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand</span>
        </Button>
      </div>

      {/* Main Content Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isFirstLoad ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <TableHead />
              <tbody className="divide-y divide-slate-800/60">
                {Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-3/4"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-2/3"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-1/4"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded-lg w-20"></div></td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <div className="inline-block h-9 w-9 bg-slate-800 rounded-xl"></div>
                      <div className="inline-block h-9 w-9 bg-slate-800 rounded-xl"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4"
          >
            <TriangleAlert className="w-10 h-10 text-red-400" />
            <p className="text-base font-semibold text-slate-200">Could not load vaccine brands</p>
            <p className="text-sm text-slate-400 max-w-sm">{error}</p>
            <Button
              variant="outline"
              onClick={reload}
              className="border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl"
            >
              Try again
            </Button>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-4 text-center">
            <PackageOpen className="w-12 h-12 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No vaccine brands found.</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Get started by adding your first vaccine brand inventory.
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}
            aria-busy={isFetching}
          >
            <table className="w-full text-left border-collapse">
              <TableHead />
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {brands.map((brand) => (
                  <BrandRow key={brand._id} brand={brand} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isFirstLoad && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <span className="text-xs sm:text-sm text-slate-400 text-center">
            Page {pagination.page} of {pagination.totalPages}
            <span className="hidden sm:inline"> ({pagination.total} brands)</span>
          </span>

          <Button
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm flex items-center gap-1.5"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VaccineBrandsView;
