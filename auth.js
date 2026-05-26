const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        
        const bearerToken = authHeader.split(' ')[1]; 
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);

       
        req.user = decoded; 

        next();
    } catch (error) {
        console.error("JWT Error:", error.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};