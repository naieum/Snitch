## CATEGORY 29: File Upload Security

### Detection
- File upload libraries: `multer`, `formidable`, `busboy`, `@uploadthing/*`
- File handling: `multipart/form-data`, file write operations
- Storage patterns: local file storage, S3 uploads, cloud storage

### What to Search For
- File uploads accepting any file type (no extension or MIME type validation)
- User-controlled filenames used directly in file paths (path traversal via `../../`)
- Uploads stored in publicly accessible directories (e.g., `public/uploads/`)
- Missing file size limits on upload endpoints
- No virus/malware scanning on uploaded files
- File type checked only by extension, not by magic bytes/file signature

### Actually Vulnerable
- Upload handler with no file type restriction (`multer()` with no `fileFilter`)
- `path.join(uploadDir, req.file.originalname)` using user-supplied filename directly
- Files saved to `public/uploads/` accessible via direct URL
- No `limits` configuration on multer/formidable (unlimited file size)
- Extension-only validation (`.jpg`) without checking actual file content

### NOT Vulnerable
- File type validation checking both extension and MIME type
- Filenames replaced with generated UUIDs/hashes
- Files stored in private storage (S3 with signed URLs, not public directory)
- File size limits configured on upload middleware
- Upload middleware with proper `fileFilter` configuration

### Context Check
1. Is the filename sanitized or replaced before storage?
2. Is there file type validation beyond just extension?
3. Are uploaded files stored in a private or public location?
4. Are file size limits configured?

### Files to Check
- `**/upload/**/*.ts`, `**/file/**/*.ts`
- `**/api/**/*.ts` (routes handling multipart)
- Multer/formidable configuration files
- Storage utility files
