const express = require('express');
const router = express.Router();
const multer = require('multer');
const photoController = require('../modules/photo');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Routes
router.get('/', photoController.getPhotos);
router.post('/', upload.array('photos', 10), photoController.uploadPhotos);
router.patch('/:id', photoController.updatePhoto);
router.get('/:id', photoController.getPhotos);
router.patch('/movetotrash/:id', photoController.softDeletePhoto);
router.delete('/:id', photoController.hardDeletePhoto);
router.patch('/markfavorite/:id', photoController.updateFavorite);






module.exports = router;
