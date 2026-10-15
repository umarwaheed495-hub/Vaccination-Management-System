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


// Brands list (paginated): one doctor, newest first. The index has exactly the order of the query
// (doctorId, then createdAt DESC, then _id DESC as tie-breaker), so MongoDB reads one page straight
// from the index with no in-memory sort, and skip/limit/count never touch the whole collection.
vaccineBrandSchema.index({ doctorId: 1, createdAt: -1, _id: -1 });

// Same list filtered by one vaccine (?vaccineName=...). Its first two keys {doctorId, vaccineName} also
// serve the brands-by-vaccine lookup of the patient module, so the old {doctorId, vaccineName} index is not needed.
vaccineBrandSchema.index({ doctorId: 1, vaccineName: 1, createdAt: -1, _id: -1 });

export const VaccineBrand = mongoose.model('VaccineBrand', vaccineBrandSchema);

 