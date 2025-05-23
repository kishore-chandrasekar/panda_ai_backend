const Tags = require('../models/Tags');




exports.postTags = async (req, res) => {
    const { imageId, value } = req.body;
    if (!imageId || !value) {
        return res.status(400).send('imageId and value are required');
    }

    try {
        const tag = new Tag({ imageId, value });
        await tag.save();
        res.status(201).send(tag);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getTags = async (req, res) => {
    try {
        const tags = await Tag.find({ imageId: req.params.imageId });
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


