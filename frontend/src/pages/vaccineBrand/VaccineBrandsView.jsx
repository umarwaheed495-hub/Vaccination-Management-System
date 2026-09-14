import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Syringe, Search, Plus, Trash2, Edit3, PackageOpen, Tag, Package, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VaccineBrandsView = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVaccine, setSearchVaccine] = useState('');

  // 1. Fetch Brands from Backend
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchVaccine.trim()) {
        params.vaccineName = searchVaccine.trim();
      }

      const response = await axios.get('/api/v1/vaccine-brands', {
        params,
        withCredentials: true,
      });
      
      setBrands(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching vaccine brands:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch vaccine brands.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load aur search filter change hone par data fetch karna
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBrands();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVaccine]);

  // 2. Delete Brand Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vaccine brand?')) return;

    try {
      await axios.delete(`/api/v1/vaccine-brands/${id}`, {
        withCredentials: true,
      });
      toast.success('Vaccine brand deleted successfully.');
      setBrands(brands.filter((brand) => brand._id !== id));
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error(error.response?.data?.message || 'Failed to delete brand.');
    }
  };

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

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <Search className="w-5 h-5 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Filter by Vaccine Name..."
          value={searchVaccine}
          onChange={(e) => setSearchVaccine(e.target.value)}
          className="bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base outline-none w-full"
        />
        {searchVaccine && (
          <button
            onClick={() => setSearchVaccine('')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 bg-slate-800 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Content Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Loading vaccine inventory...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-4 text-center">
            <PackageOpen className="w-12 h-12 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No vaccine brands found.</p>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchVaccine ? `No match found for "${searchVaccine}". Try clearing the filter.` : 'Get started by adding your first vaccine brand inventory.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-slate-800/40 transition-colors">
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${brand.inventory > 10
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
                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/dashboard/edit-vaccine-brand/${brand._id}`)}
                        className="bg-transparent border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500 h-9 w-9 rounded-xl transition-all"
                        title="Edit Brand"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(brand._id)}
                        className="bg-transparent border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 h-9 w-9 rounded-xl transition-all"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccineBrandsView;