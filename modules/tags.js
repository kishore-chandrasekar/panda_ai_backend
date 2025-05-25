const Tag = require('../models/Tags');




exports.postTags = async (req, res) => {
    const { imageId, values } = req.body;
    let parsed = JSON.parse(values)
    let photoId = imageId

    if (!imageId || !parsed || !Array.isArray(parsed)) {
        return res.status(400).send('imageId and values (array) are required');
    }

    try {
        await Tag.deleteMany({ photoId: imageId });
        const tags = parsed.map(value => ({ photoId, value }));

        const createdTags = await Tag.insertMany(tags);

        res.status(201).send(createdTags);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getAllTags = async (req, res) => {
    try {
        const tags = await Tag.find();
        res.send(tags);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

exports.getTags = async (req, res) => {
    try {
        const tags = await Tag.find({ photoId: req.params.imageId });
        res.send(tags);
    } catch (err) {
        res.status(500).send(err.message);
    }
}

exports.deleteTags = async (req, res) => {
    try {
        const deleted = await Tag.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send('Tag not found');
        res.send({ message: 'Tag deleted', tag: deleted });
    } catch (err) {
        res.status(500).send(err.message);
    }
}


