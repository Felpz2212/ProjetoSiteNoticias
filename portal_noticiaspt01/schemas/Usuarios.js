var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usuariosSchema = new Schema({
    email: String,
    senha: String,
    admin: Boolean,
    nome: String
}, {collection: 'usuarios'})

var Usuarios = mongoose.model('Usuarios', usuariosSchema);

module.exports = Usuarios;