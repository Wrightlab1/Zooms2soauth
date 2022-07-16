const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    token_id: Number,
    token: String
})

module.exports = mongoose.model("tokenSchema", tokenSchema)