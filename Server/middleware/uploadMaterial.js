
// import multer from "multer";
// import fs from "fs";
// import path from "path";

// const uploadPath = path.join("uploads", "materials");

// // Ensure folder exists
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadPath),
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// // ✅ Extended allowed MIME types
// const allowedTypes = [
//   "application/pdf",
//   "text/plain",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   "application/vnd.ms-powerpoint",
//   "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//   "application/vnd.ms-excel",
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   "text/csv", // allow CSV
// ];

// // File filter validation
// const fileFilter = (req, file, cb) => {
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(
//       new Error(
//         "Invalid file type! Only PDF, TXT, DOCX/DOC, PPT/PPTX, and Excel (XLS/XLSX/CSV) files are allowed."
//       ),
//       false
//     );
//   }
// };

// const upload = multer({ storage, fileFilter });

// export default upload;
import multer from "multer";
import fs from "fs";
import path from "path";

// ✅ Define upload folder
const uploadPath = path.join("uploads", "materials");

// Ensure folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    // Clean and validate filename
    const originalName = file.originalname.replace(/\s+/g, "_");
    const baseName = path.basename(originalName, path.extname(originalName));
    const safeName = baseName.replace(/[^a-zA-Z0-9_\-]/g, ""); // only letters, numbers, underscore, dash

    if (!safeName) {
      return cb(new Error("Invalid file name! Use letters, numbers, underscores, or dashes."), false);
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, safeName + "-" + uniqueSuffix + path.extname(originalName));
  },
});

// ✅ Allowed MIME types
const allowedTypes = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

// ✅ File filter validation
const fileFilter = (req, file, cb) => {
  if (!file.originalname) {
    return cb(new Error("File name is missing."), false);
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Invalid file type! Only PDF, TXT, DOCX/DOC, PPT/PPTX, and Excel (XLS/XLSX/CSV) are allowed."
      ),
      false
    );
  }

  cb(null, true);
};

// ✅ Configure Multer upload with file size limit (10 MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");

// ✅ Custom middleware to handle errors gracefully
export default function uploadMiddleware(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Built-in Multer errors (like file size)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large! Maximum size allowed is 10 MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // Custom errors
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}
