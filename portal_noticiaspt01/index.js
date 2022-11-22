const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const MD5 = require('crypto-js/md5');

const path = require('path');

const session = require('express-session');
const app = express();

const Posts = require('./schemas/Posts.js')

const Usuarios = require("./schemas/Usuarios.js");

const Categorias = require('./schemas/Categorias');
const { request } = require('http');

mongoose.connect('mongodb+srv://root:root12345@cluster0.ycw3uhv.mongodb.net/dankicode?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Conectado com sucesso');
}).catch((err) => {
    console.log(err)
})


app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 6000000 } }));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));


app.get('/', (request, response) => {

    if (request.query.busca == null) {
        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    imagem: val.imagem,
                    slug: val.slug,
                    conteudo: val.conteudo,
                    descricao: val.conteudo.substring(3, 100) + '...',
                    categoria: val.categoria,
                    autor: val.autor,
                    views: val.views
                }
            })

            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, Tops) => {
                Tops = Tops.map((val) => {
                    return {
                        titulo: val.titulo,
                        imagem: val.imagem,
                        slug: val.slug,
                        conteudo: val.conteudo,
                        descricao: val.conteudo.substring(3, 100) + '...',
                        categoria: val.categoria,
                        autor: val.autor,
                        views: val.views
                    }
                })
                var logado = false;
                var nome;
                if (request.session.login != null) {
                    logado = true;
                    nome = request.session.nome;
                }
                response.render('home', { posts: posts, postsTop: Tops, logado: logado, nome: nome });
            })


        })
    } else {

        Posts.find({ titulo: { $regex: request.query.busca, $options: 'i' } }, (err, posts) => {
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    imagem: val.imagem,
                    slug: val.slug,
                    conteudo: val.conteudo,
                    descricao: val.conteudo.substring(3, 100) + '...',
                    categoria: val.categoria,
                    autor: val.autor,
                    views: val.views
                }
            })
            var logado = false;
            var nome;
            if (request.session.login != null) {
                logado = true;
                nome = request.session.nome;
            }
            console.log(nome);
            response.render('busca', { posts: posts, logado: logado, nome: nome });
        })


    }


});

app.get('/admin/logout', (request, response) => {

    request.session.destroy();
    response.redirect('/');
});

app.get('/:slug', (request, response) => {

    if (request.params.slug != null) {
        Posts.findOneAndUpdate({ slug: request.params.slug }, { $inc: { views: 1 } }, { new: true }, (err, post) => {
            if (post != null) {
                Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, Tops) => {
                    Tops = Tops.map((val) => {
                        return {
                            titulo: val.titulo,
                            imagem: val.imagem,
                            slug: val.slug,
                            conteudo: val.conteudo,
                            descricao: val.conteudo.substring(3, 100) + '...',
                            categoria: val.categoria,
                            autor: val.autor,
                            views: val.views
                        }
                    })
                    var logado = false;
                    var nome;
                    if (request.session.login != null) {
                        logado = true;
                        nome = request.session.nome;
                    }
                    response.render('single', { noticia: post, postsTop: Tops, logado: logado, nome: nome });
                })
            } else {
                response.redirect('/')
            }
        })
    }
})

app.get('/admin/login', (request, response) => {

    console.log(request.session.login + ' ' + request.session.admin);

    if (request.session.login == null) {
        response.render('admin-login')
    } else {
        if (request.session.admin == false) {
            response.redirect('/');
        } else {
            response.redirect('/admin/painel');
        }
    }
})

app.get('/admin/painel', (request, response) => {
    if (request.session.login == null || request.session.admin == false) {
        response.redirect('/');
    }
    Categorias.find({}).sort({ '_id': -1 }).exec((err, categorias) => {
        categorias = categorias.map((val) => {
            return { nome: val.nome }
        })

        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    imagem: val.imagem,
                    slug: val.slug,
                    conteudo: val.conteudo,
                    descricao: val.conteudo.substring(3, 100) + '...',
                    categoria: val.categoria,
                    autor: val.autor,
                    views: val.views
                }
            })
            response.render('admin-panel', { categorias: categorias, posts: posts })
        })

    })
});

app.get('/cadastro/usuario', (request, response) => {

    console.log(request.session.login);

    if (request.session.login != null) {
        response.redirect('/');
    } else {
        response.render('cadastro-usuario');
    }

});

app.get('/deletar/:id', (request, response) => {
    Posts.deleteOne({ slug: request.params.id }).exec();
    response.redirect('/admin/login');
});

app.post('/cadastro/usuario', (request, response) => {

    if (request.body.senha != request.body.repeatSenha) {
        response.redirect('/cadastro/usuario');
    } else {
        Usuarios.findOne({ email: request.body.login }).exec((err, val) => {
            if (!val) {
                const senha = MD5(request.body.senha);
                Usuarios.create({ email: request.body.login, senha: senha.toString(), admin: false, nome: request.body.nome });
                setTimeout(() => {
                    response.redirect('/admin/login');
                }, 5000)
            }else{
                response.redirect('/cadastro/usuario');
            }
        });

    }

})

app.post('/admin/login', (request, response) => {

    var senha = MD5(request.body.senha);

    Usuarios.findOne({ email: request.body.login, senha: senha.toString() }).exec((err, val) => {
        if (val) {
            request.session.login = val.email;
            request.session.nome = val.nome;
            request.session.admin = val.admin;
            console.log(request.session.login);
            console.log(request.session.admin);

        }
        response.redirect('/admin/login');
    })


})

app.post('/noticia/criar', (request, response) => {
    console.log(request.body);
    const data = {
        titulo: request.body.titulo,
        categoria: request.body.categoria,
        conteudo: request.body.conteudo,
        criador: request.session.login,
        imagem: request.body.imagem,
        slug: request.body.slug
    }

    Posts.create({
        titulo: data.titulo,
        categoria: data.categoria,
        conteudo: `<p>${data.conteudo}</p>`,
        autor: data.criador,
        views: 0,
        slug: data.slug,
        imagem: data.imagem
    });


    setTimeout(() => {
        response.redirect('/');
    }, 2000)
})

app.listen(3000, () => {
    console.log('servidor inciado!');
})