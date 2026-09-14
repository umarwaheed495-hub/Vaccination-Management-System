import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Syringe, ArrowLeft, DollarSign, Package, Layers, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EditVaccineBrand = () => {
  const navigate = useNavigate();
  // Yahan router ke ':brandId' ko 'id' variable mein map kar diya hai taake baqi poora code waise hi chale
  const { brandId: id } = useParams(); 
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    vaccineName: '',
    brandName: '',
    manufacturer: '',
    price: '',
    inventory: '',
  });

  // 1. Fetch Existing Brand Data on Mount
  useEffect(() => {
    const fetchBrandDetails = async () => {
      try {
        setFetching(true);
        const response = await axios.get(`/api/v1/vaccine-brands`, {
          withCredentials: true,
        });
        
        const brands = response.data?.data || [];
        const currentBrand = brands.find((b) => b._id === id);

        if (currentBrand) {
          setFormData({
            vaccineName: currentBrand.vaccineName || '',
            brandName: currentBrand.brandName || '',
            manufacturer: currentBrand.manufacturer || '',
            price: currentBrand.price !== undefined ? currentBrand.price : '',
            inventory: currentBrand.inventory !== undefined ? currentBrand.inventory : '',
          });
        } else {
          toast.error('Vaccine brand not found.');
          navigate('/dashboard/vaccine-brands');
        }
      } catch (error) {
        console.error('Error fetching brand details:', error);
        toast.error(error.response?.data?.message || 'Failed to load brand details.');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchBrandDetails();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Handle Form Submit (PATCH Request)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation matching backend requirements
    if (
      !formData.vaccineName.trim() ||
      !formData.brandName.trim() ||
      formData.price === '' ||
      formData.inventory === ''
    ) {
      toast.error('Please fill in all required fields: vaccineName, brandName, price, and inventory.');
      return;
    }

    const parsedPrice = Number(formData.price);
    const parsedInventory = Number(formData.inventory);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Price must be a valid positive number.');
      return;
    }

    if (isNaN(parsedInventory) || parsedInventory < 0) {
      toast.error('Inventory must be a valid positive integer.');
      return;
    }

    try {
      setLoading(true);

      // Backend API call matching the updateBrand controller (PATCH method)
      const response = await axios.patch(`/api/v1/vaccine-brands/${id}`, {
        vaccineName: formData.vaccineName.trim(),
        brandName: formData.brandName.trim(),
        manufacturer: formData.manufacturer.trim() || 'N/A',
        price: parsedPrice,
        inventory: parsedInventory,
      }, {
        withCredentials: true,
      });

      toast.success(response.data?.message || 'Vaccine brand updated successfully.');
      
      // Successfully update honay ke baad list page par redirect kar dena
      navigate('/dashboard/vaccine-brands');
      
    } catch (error) {
      console.error('Error updating vaccine brand:', error);
      toast.error(error.response?.data?.message || 'Failed to update vaccine brand.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading brand details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Edit Vaccine Brand</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Update vaccine brand specifications and stock levels.</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-xs sm:text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Main Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Vaccine Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Vaccine Name *
              </label>
              <input
                type="text"
                name="vaccineName"
                placeholder="e.g., BCG, Polio, Hepatitis B"
                value={formData.vaccineName}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Syringe className="w-3.5 h-3.5 text-blue-400" /> Brand Name *
              </label>
              <input
                type="text"
                name="brandName"
                placeholder="e.g., Engerix-B, Infanrix"
                value={formData.brandName}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>

          </div>

          {/* Manufacturer */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-blue-400" /> Manufacturer (Optional)
            </label>
            <input
              type="text"
              name="manufacturer"
              placeholder="e.g., GSK, Pfizer (Defaults to N/A if left empty)"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Price */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Price (Rs.) *
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>

            {/* Inventory */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" /> Stock (Inventory) *
              </label>
              <input
                type="number"
                name="inventory"
                min="0"
                placeholder="e.g., 50"
                value={formData.inventory}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard/vaccine-brands')}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-sm px-5 py-2.5 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Brand...</span>
                </>
              ) : (
                <span>Update Vaccine Brand</span>
              )}
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default EditVaccineBrand;