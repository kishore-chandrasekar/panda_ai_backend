const Photo = require('../models/Photo');
const Tags = require('../models/Tags');
const mongoose = require('mongoose');



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
        const { title, description, tags, imageId } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).send({ message: 'No files uploaded' });
        }

        const parsedTags = JSON.parse(tags);


        const savedPhotos = await Promise.all(
            files.map(async (file) => {
                const newPhoto = new Photo({
                    photoName: file.originalname,
                    filePath: file.path.replace(/\\/g, '/'),
                    metadata: title || '',
                    description: description || ''
                });

                const photoDoc = await newPhoto.save();

                const finalImageId = imageId?.length > 0 ? imageId : photoDoc._id

                if (parsedTags && parsedTags.length > 0) {
                    const tagDocs = parsedTags.map(value => ({ photoId: finalImageId, value }));
                    await Tags.insertMany(tagDocs);
                }

                return photoDoc;
            })
        );

        res.status(201).send(savedPhotos);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error', error: err.message });
    }
};


exports.updatePhoto = async (req, res, next) => {
    try {
        const updated = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).send({ message: 'Photo not found' });
        res.status(201).send(updated);
    } catch (err) {
        res.status(500).send(err);
    }
};



exports.updateAlbumNameForPhotos = async (req, res, next) => {
    const { photoIds, albumName } = req.body;
    let parsed = JSON.parse(photoIds)

    if (!Array.isArray(parsed) || !albumName) {
        return res.status(400).send({ message: 'photoIds (array) and albumName (string) are required' });
    }

    const validIds = parsed
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));


    if (validIds.length === 0) {
        return res.status(400).send({ message: 'No valid photo IDs provided' });
    }

    try {
        const result = await Photo.updateMany(
            { _id: { $in: validIds } },
            { $set: { AlbumName: albumName } }
        );

        res.status(200).send({
            message: `${result.modifiedCount} photo(s) updated`,
            result
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error', error: err.message });
    }
};

exports.renameAlbum = async (req, res) => {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
        return res.status(400).send({ message: 'Both oldName and newName are required' });
    }

    try {
        const result = await Photo.updateMany(
            { AlbumName: oldName },
            { $set: { AlbumName: newName } }
        );

        res.status(200).send({
            message: `Album renamed from "${oldName}" to "${newName}"`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error', error: err.message });
    }
};
exports.deleteAlbum = async (req, res) => {
    const { albumName } = req.body;

    if (!albumName) {
        return res.status(400).send({ message: 'albumName is required' });
    }

    try {
        const result = await Photo.updateMany(
            { AlbumName: albumName },
            { $set: { AlbumName: '' } }
        );

        res.status(200).send({
            message: `Album "${albumName}" deleted (AlbumName cleared)`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error', error: err.message });
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

exports.restorePhoto = async (req, res, next) => {
    try {
        const photo = await Photo.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: false,
                deletedAt: null
            },
            { new: true }
        );

        if (!photo) return res.status(404).send({ message: 'Photo not found' });
        res.status(200).send({ message: 'Photo restored successfully', data: photo });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error', error: err.message });
    }
};



exports.hardDeletePhoto = async (req, res, next) => {
    try {
        const photo = await Photo.findByIdAndDelete(req.params.id);

        if (!photo) {
            return res.status(404).send({ message: 'Photo not found' });
        }

        await Tags.deleteMany({ photoId: req.params.id });

        res.status(200).send({ message: 'Photo and associated tags permanently deleted', data: photo });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error', error: err.message });
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

