const handleDetectLocal = async (req, res, tfjs, model, fs) => {
    try {
        const base64String = req.body.base64StringFile;
        const base64File = base64String.split(';base64,').pop();
        const fileType = base64String.split('/')[1].split(';')[0];
        const fileLocation = `uploads/imageUpload.${fileType}`;

        fs.writeFile(fileLocation, base64File, { encoding: 'base64' }, async () => {
            console.log('Image created!');
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
        });
    } catch (error) {
        res.status(400).json("tf error")
    };
}

module.exports = {
    handleDetectLocal: handleDetectLocal
}
