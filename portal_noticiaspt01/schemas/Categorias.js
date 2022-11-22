var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var categoriasSchema = new Schema({
   nome: String
}, {collection: 'categorias'})

var Categorias = mongoose.model('Categorias', categoriasSchema);

module.exports = Categorias;