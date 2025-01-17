import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";

export const upload = multer({
	storage: multer.memoryStorage(), // Store files in memory as a buffer
	limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1MB
	fileFilter: (
		req: Request,
		file: Express.Multer.File,
		cb: FileFilterCallback
	) => {
		// Check if the file type is CSV
		if (file.mimetype !== "text/csv") {
			// Pass an error for invalid file type
			const error: any = new Error(
				`Invalid file type: ${file.mimetype}. Only CSV files are allowed.`
			);
			error.code = "INVALID_FILE_TYPE";
			return cb(error);
		}

		// Accept the file
		cb(null, true);
	},
});

export const handleCSVUpload = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	upload.single("file")(req, res, (err: any) => {
		console.log("req", req);
		console.log("req.file", req.file, req.files);
		console.log("file", typeof req.file, typeof req.files);

		// Check if multiple files are uploaded
		if (Array.isArray(req.files) && req.files.length > 1) {
			return res.status(400).json({
				message: "Multiple files are not allowed. Please upload only one file.",
			});
		}

		if (err) {
			console.log("error in multertConfig", err);

			// Handle file size error
			if (err.code === "LIMIT_FILE_SIZE") {
				return res.status(400).json({
					message: `${err.message}. Only file size less than 1MB is supported`,
				});
			}

			// Handle invalid file type error
			if (err.code === "ERROR_FILE_TYPE") {
				return res.status(400).json({ message: err.message });
			}

			// Handle incorrect field name or more than 1 file being uploaded
			if (err.code === "LIMIT_UNEXPECTED_FILE") {
				// Handle more than 1 file being uploaded
				if (err.field !== "file") {
					return res.status(400).json({
						message: `${err.message}. File should be uploaded under the 'file' field.`,
					});
				}
				// // Handle more than 1 file being uploaded under an unexpected field
				return res
					.status(400)
					.json({ message: "Only one file should be uploaded" });
			}

			// Handle other errors
			return res
				.status(500)
				.json({ message: "File upload error.", error: err.message });
		}

		// Continue to the next route handler
		next();
	});
};
