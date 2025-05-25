const express = require('express');
const router = express.Router();
const multer = require('multer');
const photoController = require('../modules/photo');


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', photoController.getPhotos);
router.post('/', upload.array('photos', 10), photoController.uploadPhotos);
router.patch('/:id', photoController.updatePhoto);
router.get('/:id', photoController.getPhotos);
router.patch('/movetotrash/:id', photoController.softDeletePhoto);
router.patch('/restore/:id', photoController.restorePhoto);
router.delete('/:id', photoController.hardDeletePhoto);
router.patch('/markfavorite/:id', photoController.updateFavorite);
router.put('/createalbum', photoController.updateAlbumNameForPhotos);
router.post('/renamealbum', photoController.renameAlbum);
router.post('/deletealbum', photoController.deleteAlbum);







module.exports = router;
