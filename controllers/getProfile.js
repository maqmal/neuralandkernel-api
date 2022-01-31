const handleGetProfile = (req, res, db) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id: id })
        .then(data => {
            if (data.length) {
                res.json(data[0])
            } else {
                res.status(400).json('not found')
            }
        })
        .catch(err => res.status(400).json('error getting user'))
}

module.exports = {
    handleGetProfile: handleGetProfile
};