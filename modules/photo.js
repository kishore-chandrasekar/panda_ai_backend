const Photo = require('../models/Photo');

exports.getPhotos = async (req, res, next) => {
    try {
        const data = await Photo.find();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.uploadPhotos = async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send({ message: 'No files uploaded' });
        }

        // console.log('pppp',req.body)

        const savedPhotos = await Promise.all(
            files.map(file => {
                const newPhoto = new Photo({
                    photoName: file.originalname,
                    filePath: file.path.replace(/\\/g, '/'),
                    metadata:req.body.title ? req.body.title : '',
                    description:req.body.description ? req.body?.description : ''
                });
                return newPhoto.save();
            })
        );

        res.status(201).send(savedPhotos);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.updatePhoto = async (req, res, next) => {
    try {
        const updated = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).send({ message: 'Photo not found' });
        res.send(updated);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.getPhotoById = async (req, res, next) => {
    try {
        const photo = await Photo.findById(req.params.id);
        if (!photo) return res.status(404).send({ message: 'Photo not found' });
        res.send(photo);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.softDeletePhoto = async (req, res, next) => {
    try {
        const photo = await Photo.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
                deletedAt: new Date()
            },
            { new: true }
        );

        if (!photo) return res.status(404).send({ message: 'Photo not found' });
        res.send(photo);
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.hardDeletePhoto = async (req, res, next) => {
    try {
        const photo = await Photo.findByIdAndDelete(req.params.id);
        if (!photo) return res.status(404).send({ message: 'Photo not found' });
        res.send({ message: 'Photo permanently deleted', data: photo });
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.updateFavorite = async (req, res, next) => {
    const { favorite } = req.body;
  
    if (typeof favorite !== 'boolean') {
      return res.status(400).send({ message: "'favorite' must be true or false" });
    }
  
    try {
      const photo = await Photo.findByIdAndUpdate(
        req.params.id,
        { favorite },
        { new: true }
      );
  
      if (!photo) return res.status(404).send({ message: 'Photo not found' });
      res.send(photo);
    } catch (err) {
      res.status(500).send(err);
    }
  };
  
