
const handleDetectUrl = async (req, res, tfjs, model, downloadImage, fs, request) => {
    const magic = {
        jpg: 'ffd8ffe0',
        png: '89504e47',
        gif: '47494638'
    };
    const options = {
        method: 'GET',
        url: req.body.url,
        encoding: null // keeps the body as buffer
    };
    try {
        request(options, async function (err, response, body) {
            if (!err && response.statusCode == 200) {
                var magigNumberInBody = body.toString('hex', 0, 4);
                if (magigNumberInBody == magic.jpg ||
                    magigNumberInBody == magic.png ||
                    magigNumberInBody == magic.gif) {
                    const fileLocation = `uploads/imageUrl.${magigNumberInBody}`;
                    downloadImage(req.body.url, fileLocation, async () => {
                        const image = await fs.readFileSync(fileLocation);
                        const decodedImage = tfjs.node.decodeImage(image, 3);
                        console.log('Decoded image...');
                        const prediction = await model.detect(decodedImage);
                        console.log('Classifier triggered!');
                        fs.unlinkSync(fileLocation);
                        if (prediction.length === 0) {
                            res.json('not found');
                        } else {
                            res.json(prediction);
                        }
                    })
                }
            } else {
                console.log('error image format')
                res.json('link error')
            }
        }
        )
    } catch (error) {
        res.status(400).json("tf error")
    }
}

module.exports = {
    handleDetectUrl: handleDetectUrl
}
