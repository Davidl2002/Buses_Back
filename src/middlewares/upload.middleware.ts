import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'paymentProof') {
      uploadPath += 'payment-proofs/';
    } else if (file.fieldname === 'receipt') {
      uploadPath += 'receipts/';
    } else if (file.fieldname === 'busImage') {
      uploadPath += 'buses/';
    } else if (file.fieldname === 'logo') {
      uploadPath += 'logos/';
    }
    
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos
// Filtro de archivos
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('Solo se permiten archivos de imagen (JPEG, PNG) o PDF', 400));
  }
};
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB por defecto
  },
  fileFilter: fileFilter
});
