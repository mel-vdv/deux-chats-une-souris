'use strict';
///////////////////////// 1 . SERVEUR EXPRESS ///////////////////////////////////////////
//*****************************************************************************************
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const pug = require('pug');
const urldb = process.env.MONGODB_URI||'mongodb://127.0.0.1:27017';
let datasPug = {};
// pour pug:******************************************************************************
app.set('view engine', 'pug');
// les fichiers statiques : 
app.use(express.static(path.normalize(`${__dirname}`)));
app.use('/style', express.static(__dirname + "/assets/css"));
app.use('/images', express.static(__dirname + "/src/images"));
app.use('/jq', express.static(__dirname + "/public/jquery"));
//les sessions:****************************************************************************
app.use(session({
    secret: 'secretpasswordblog',
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({
    extended: false
}));
//pour réinitialiser:
app.use((req, res, next) => {
    datasPug = app.locals;
    app.locals = {};
    datasPug.session = req.session;
    next();
});
//les ROUTES : les requêtes GET     ****************************************************************************
app.get("/", (req, res, next) => {
    res.render('index', datasPug);
});
//-------------------------------
app.get('/connexion', (req, res, next) => {
    datasPug.texte = 'Entre ton pseudo : ';
    datasPug.url = '/traitement-connexion';
    datasPug.valueSubmit = 'CONNEXION';
    res.render('formulaire', datasPug);
});
//-----------------------------------
app.get('/inscription', (req, res, next) => {
    datasPug.texte = 'Choisis un pseudo : ';
    datasPug.url = '/traitement-inscription';
    datasPug.valueSubmit = 'INSCRIPTION';
    res.render('formulaire', datasPug);
});
//---------------------------------------
app.get('/menu', (req, res, next) => {
    datasPug.joueur = req.session.name;
    res.render('menu', datasPug);
});
//---------les scores : affichage ------------
app.get('/scores', (req, res, next) => {
    MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
        const collection = client.db('jeu').collection('users');

        collection.find().toArray((er, datas) => {
            // client.close();
            datasPug.titre = "score de tous les joueurs";
            datasPug.laListe = datas;

            res.render('scores', datasPug);
        });
    });
});
//------------------------------------------
app.get('/play', (req, res, next) => {
    console.log(req.session.name);
    MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {

        const collek = client.db('jeu').collection('partie');
        collek.find({}).toArray((er, dat) => {
            if (dat[0].joueur1 === req.session.name) {
                res.redirect('/jouer1');
            }
            else if (dat[0].joueur2 === req.session.name) {
                res.redirect('/jouer2');
            }
            else if ((dat[0].joueur1 === "personne" || dat[0].joueur1 === null) && dat[0].joueur2 !== req.session.name) {
                collek.updateOne({}, { $set: { joueur1: req.session.name, pointsJ1: 0 } });
                res.redirect('/jouer1');
            }
            else if ((dat[0].joueur1 !== "personne" && dat[0].joueur1 !== null && dat[0].joueur1 !== req.session.name) && (dat[0].joueur2 === "personne" || dat[0].joueur2 === null)) {
                collek.updateOne({}, { $set: { joueur2: req.session.name, pointsJ2: 0 } });
                res.redirect('/jouer2');
            }
            else {
                app.locals.message = "veuillez attendre qu'une place se libère, 2 joueurs sont déjà occupés à jouer."
                res.redirect('/deconnect');
            }
        });
    });
});
//----------------------------------sessions----------------------------
app.get('/deconnect', (req, res, next) => {
    MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
        if (!err) {
            const collek = client.db('jeu').collection('partie');
            collek.find({}).toArray((er, dat) => {
                if (!er) {
                    if (dat[0].joueur1 === req.session.name) {
                        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                            const collek = client.db('jeu').collection('partie');
                            collek.updateOne({}, { $set: { joueur1: "personne", pointsJ1: 0, pointsJ2: 0 } });
                            req.session.destroy((err) => {
                                app.locals.message = { class: 'confirm', text: 'Vous êtes bien déconnecté.' };
                                res.render('index', datasPug);
                            });
                        });
                    }
                    else if (dat[0].joueur2 === req.session.name) {
                        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                            const collek = client.db('jeu').collection('partie');
                            collek.updateOne({}, { $set: { joueur2: "personne", pointsJ1: 0, pointsJ2: 0 } });
                            req.session.destroy((err) => {
                                app.locals.message = { class: 'confirm', text: 'Vous êtes bien déconnecté.' };
                                res.render('index', datasPug);
                            });
                        });
                    }
                    else {
                        req.session.destroy((err) => {
                            app.locals.message = { class: 'confirm', text: 'Vous êtes bien déconnecté.' };
                            res.render('index', datasPug);
                        });
                    }
                } else { console.log('erreur'); }
            });
        }
        else { console.log('erreur'); }
    });
});
// traitement des requetes POST:   (LES SESSIONS)   ********************************************************
app.post('/traitement-connexion', (req, res, next) => {
    console.log('debut traitement-connexion');
    MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
        if (!err) {
            const collek = client.db('jeu').collection('users');
            collek.find({ pseudo: req.body.pseudo }).toArray((err, datass) => {
                if (!err) {
                    if (!datass.length) {
                        app.locals.messageError = "Désolé, pseudo non reconnu, veuillez vous INSCRIRE si vous êtes nouveau...";
                        res.redirect('/connexion');
                    }
                    else {
                        req.session.name = datass[0].pseudo;
                        req.session.points = datass[0].score;
                        res.redirect('/menu');
                    }
                } else { console.log('/traitement-connexion : connexion mongodb atlas Ok mais erreur requête'); }
            });
        } else { console.log('/traitement-connexion : erreur connexion mongodb atlas'); }
    });
});
//------------------------------------
app.post('/traitement-inscription', (req, res, next) => {
    MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
        if (!err) {
            const collection = client.db('jeu').collection('users');
            collection.find({ pseudo: req.body.pseudo }).toArray((err, datas) => {
                if (!err) {
                    if (datas.length) {
                        app.locals.messageError = 'Ce pseudo est déjà pris par un autre utilisateur. Trouvez en un autre.';
                        res.redirect('/inscription');
                    }
                    else {
                        //on l'ajoute à la bd "users"
                        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                            const collection = client.db('jeu').collection('users');
                            collection.insertOne({ pseudo: req.body.pseudo, score: 0 }, (err, record) => {
                                req.session.name = req.body.pseudo;
                                res.redirect('/menu');
                            });
                        });
                    }
                } else { console.log('erreur'); }
            });
        } else { console.log('erreur'); }
    });
});
//**********************************   LE JEU  !!!!   **************************************** */
app.get("/jouer1", (req, res, next) => {
    return res.sendFile(path.normalize(`${__dirname}/clientSocketio1.html`));
});
app.get("/jouer2", (req, res, next) => {
    return res.sendFile(path.normalize(`${__dirname}/clientSocketio2.html`));
});
//gestion des erreurs:***************************************************************************
app.use((req, res, next) => {
    res.status(404).render('error404');
});
// lancement du serveur , dans le terminal : "nodemon serveurJeu.js"***************************
// ensuite on entre dans la barre d'adresse : "http://adress IP:3333/"
const PORT = process.env.PORT || 3333;
const expressServ = app.listen(PORT, () => console.log(`port ${PORT} sur écoute`));
//******************************************************** */
app.get("/jouer1", (req, res, next) => {
    return res.sendFile(path.normalize(`${__dirname}/clientSocketio1.html`));
});
/////////////////////////////////////////
const io = require('socket.io');
const servIo = io(expressServ);
servIo.on('connection', (socket) => {
    // evenement 1 :  bienvenue:
    //************************* */
    socket.on('bienvenue1', () => {
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collec = client.db('jeu').collection('partie');
                collec.find({}).toArray((e, d) => {
                    if (!e) {
                        const m = JSON.stringify(d[0]);
                        servIo.emit('bienvenueRep1', m);
                    }
                    else { console.log('erreur') };
                });
            }
            else {
                console.log('erreur');
            }
        });
    });
    socket.on('bienvenue2', () => {
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collec = client.db('jeu').collection('partie');
                collec.find({}).toArray((e, d) => {
                    if (!e) {
                        const m = JSON.stringify(d[0]);
                        servIo.emit('bienvenueRep2', m);
                    }
                    else { console.log('erreur') };
                });
            }
            else {
                console.log('erreur');
            }
        });
    });
    // évènement 2 : clic carré rouge:
    //*********************************/
    socket.on('clientCarreRouge1', (message) => {
        const recu = JSON.parse(message);
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collec = client.db('jeu').collection('partie');
                collec.updateOne({},
                    {
                        $set: {
                            carreX: recu.carreX,
                            carreY: recu.carreY,
                            pointsJ1: recu.pointsJ1
                        }
                    });

                MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                    if (!err) {
                        const collekk = client.db('jeu').collection('partie');
                        collekk.find({}).toArray((er, datas) => {
                            if (!er) {

                                const envoi = JSON.stringify(datas[0]);
                                servIo.emit('serveurCarreRouge', envoi);
                            }
                            else { console.log('erreur'); }

                        });
                    }
                    else { console.log('erreur'); }
                });
            }
            else { console.log('erreur'); }
        });
    });
    socket.on('clientCarreRouge2', (message) => {
        const recu = JSON.parse(message);
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collec = client.db('jeu').collection('partie');
                collec.updateOne({},
                    {
                        $set: {
                            carreX: recu.carreX,
                            carreY: recu.carreY,
                            pointsJ2: recu.pointsJ2
                        }
                    });
                MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                    if (!err) {
                        {
                            const collekk = client.db('jeu').collection('partie');
                            collekk.find({}).toArray((er, datas) => {
                                if (!er) {
                                    const envoi = JSON.stringify(datas[0]);
                                    servIo.emit('serveurCarreRouge', envoi);
                                }
                                else { console.log('erreur'); }
                            });
                        }
                    }
                    else { console.log('erreur'); }
                });
            }
            else { console.log('erreur'); }
        });
    });
    // évènement 3 : mouse Move:
    //************************* */
    socket.on('clientMouseMove1', (message) => {
        const recu = JSON.parse(message);
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collek = client.db('jeu').collection('partie');
                collek.updateOne({}, {
                    $set: {
                        joueur1x: recu.joueur1x,
                        joueur1y: recu.joueur1y
                    }
                });
                MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                    if (!err) {
                        const collek = client.db('jeu').collection('partie');
                        collek.find({}).toArray((err, d) => {
                            if (!err) {
                                const lesPositions = JSON.stringify(d[0]);
                                servIo.emit('serveurMouseMove', lesPositions);
                            }
                            else { console.log('erreur'); }
                        });
                    }
                    else { console.log('erreur'); }
                });
            }
            else { console.log('erreur'); }
        });
    });
    socket.on('clientMouseMove2', (message) => {
        const recu = JSON.parse(message);
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collek = client.db('jeu').collection('partie');
                collek.updateOne({}, {
                    $set: {
                        joueur2x: recu.joueur2x,
                        joueur2y: recu.joueur2y
                    }
                });

                MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                    if (!err) {
                        const collek = client.db('jeu').collection('partie');
                        collek.find({}).toArray((err, d) => {
                            if (!err) {
                                const lesPositions = JSON.stringify(d[0]);
                                servIo.emit('serveurMouseMove', lesPositions);
                            }
                            else { console.log('erreur'); }
                        });
                    }
                    else { console.log('erreur'); }
                });
            }
            else { console.log('erreur'); }
        });
    });
    // evenement 4 :  fin de partie : 
    //*********************************** */
    socket.on('clientFin1', () => {
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collek = client.db('jeu').collection('partie');
                collek.find({}).toArray((e, d) => {
                    if (!e) {
                        MongoClient.connect(urldb, { useUnifiedTopology: true }, (error, client) => {
                            if (!error) {
                                const collekk = client.db('jeu').collection('users');
                                collekk.updateOne({ pseudo: d[0].joueur1 }, {
                                    $inc: {
                                        score: 1
                                    }
                                });
                            }
                            else { console.log('error'); }
                        });
                    }
                    else { console.log('erreur'); }
                });
            }
            else (console.log('erreur'));
        });
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collection = client.db('jeu').collection('partie');
                collection.updateOne({}, {
                    $set: {
                        pointsJ1: 0,
                        pointsJ2: 0,
                        joueur1: "personne",
                        joueur2: "personne"
                    }
                });
            }
            else (console.log('erreur'));
        });
        servIo.emit('serveurFin1');
    });
    socket.on('clientFin2', () => {
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collek = client.db('jeu').collection('partie');
                collek.find({}).toArray((e, d) => {
                    if (!e) {
                        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
                            const collekk = client.db('jeu').collection('users');
                            collekk.updateOne({ pseudo: d[0].joueur2 }, {
                                $inc: {
                                    score: 1
                                }
                            });
                        });
                    }
                    else { console.log('erreur'); }
                });
            }
            else (console.log('erreur'));
        });
        MongoClient.connect(urldb, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                const collection = client.db('jeu').collection('partie');
                collection.updateOne({}, {
                    $set: {
                        pointsJ1: 0,
                        pointsJ2: 0,
                        joueur1: "personne",
                        joueur2: "personne"
                    }
                });
            }
            else (console.log('erreur'));
        });
        servIo.emit('serveurFin2');
    });
});