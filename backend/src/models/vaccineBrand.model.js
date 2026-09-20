import mongoose from 'mongoose';

const vaccineBrandSchema = new mongoose.Schema({
  vaccineName: {
    type: String,
    required: true,
    trim: true
  },
  brandName: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    default: 'N/A',
    trim: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  inventory: {
    type: Number,
    required: true,
    default: 0
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  }
}, { timestamps: true });


vaccineBrandSchema.index({ doctorId: 1, vaccineName: 1 });

export const VaccineBrand = mongoose.model('VaccineBrand', vaccineBrandSchema);

 