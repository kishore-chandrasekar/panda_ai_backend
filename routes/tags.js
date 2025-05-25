var express = require('express');
var router = express.Router();
var tagModule = require('../modules/tags')

router.post('/addtag',tagModule.postTags);
router.get('/:imageId',tagModule.getTags)
router.get('/',tagModule.getAllTags)
router.delete('/:imageId',tagModule.deleteTags)

module.exports = router;
