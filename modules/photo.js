const Photo = require('../models/Photo');
const Tags = require('../models/Tags');
const mongoose = require('mongoose');



exports.getPhotos = async (req, res) => {
    try {
        const data = await Photo.aggregate([
            {
                $lookup: {
                    from: 'tags',
                    localField: '_id',
                    foreignField: 'photoId',
                    as: 'tags'
                }
            },
            {
                $project: {
                    photoName: 1,
                    description: 1,
                    metadata: 1,
                    favorite: 1,
                    isDeleted: 1,
                    filePath: 1,
                    uploadedAt: 1,
                    AlbumName: 1,
                    tags: '$tags.value'
                }
            }
        ]);

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching photos:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};




exports.uploadPhotos = async (req, res) => {
    try {
        const files = req.files;
        const { title, description, tags } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        let parsedTags = [];
        try {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (error) {
            return res.status(400).json({ message: 'Invalid tags format' });
        }

        const savedPhotos = [];
        const allTagDocs = [];

        for (const file of files) {
            const photo = new Photo({
                photoName: file.originalname,
                filePath: file.path.replace(/\\/g, '/'),
                metadata: title || '',
                description: description || '',
            });

            const savedPhoto = await photo.save();
            savedPhotos.push(savedPhoto);

            if (Array.isArray(parsedTags) && parsedTags.length > 0) {
                parsedTags.forEach(tag => {
                    allTagDocs.push({ photoId: savedPhoto._id, value: tag });
                });
            }
        }

        if (allTagDocs.length > 0) {
            await Tags.insertMany(allTagDocs);
        }

        return res.status(201).json({ message: 'Photos uploaded successfully', photos: savedPhotos });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};


exports.updatePhoto = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const photoId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(photoId)) {
            return res.status(400).json({ message: 'Invalid photo ID' });
        }

        const allowedFields = [
            'photoName',
            'description',
            'metadata',
            'favorite',
            'isDeleted',
            'AlbumName',
        ];

        const updateData = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }

        const updatedPhoto = await Photo.findByIdAndUpdate(
            photoId,
            { $set: updateData },
            { new: true, session }
        );

        if (!updatedPhoto) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Photo not found' });
        }

        if (Array.isArray(req.body.tags)) {
            await Tags.deleteMany({ photoId: new mongoose.Types.ObjectId(photoId) }).session(session);

            const newTags = req.body.tags.map(value => ({
                photoId: new mongoose.Types.ObjectId(photoId),
                value
            }));

            if (newTags.length > 0) {
                await Tags.insertMany(newTags, { session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Photo updated successfully',
            data: updatedPhoto
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error updating photo:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
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




exports.getPhotoById = async (req, res) => {
    try {
        const photoId = req.params.id;

        const data = await Photo.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(photoId) } },
            {
                $lookup: {
                    from: 'tags',
                    localField: '_id',
                    foreignField: 'photoId',
                    as: 'tags'
                }
            },
            {
                $project: {
                    photoName: 1,
                    description: 1,
                    metadata: 1,
                    favorite: 1,
                    isDeleted: 1,
                    filePath: 1,
                    uploadedAt: 1,
                    AlbumName: 1,
                    tags: '$tags.value'
                }
            }
        ]);

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        res.status(200).json(data[0]);
    } catch (err) {
        console.error('Error fetching photo by ID:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
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



exports.hardDeletePhoto = async (req, res) => {
    try {
        const photoId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(photoId)) {
            return res.status(400).json({ message: 'Invalid photo ID' });
        }

        const deletedPhoto = await Photo.findByIdAndDelete(photoId);
        if (!deletedPhoto) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        await Tags.deleteMany({ photoId: new mongoose.Types.ObjectId(photoId) });

        res.status(200).json({
            message: 'Photo and associated tags permanently deleted',
            data: deletedPhoto
        });
    } catch (err) {
        console.error('Error in hardDeletePhoto:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
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

