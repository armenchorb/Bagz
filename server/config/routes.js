const mongoose = require('mongoose');
var controller = require('./../controllers/users.js');
const User = mongoose.model('User');
const bcrypt = require('bcrypt-as-promised');
const stripe = require('stripe')('sk_test_n8BKGqVFEQJofDLgwG6O73KJ');
const nodemailer = require('nodemailer');

module.exports = function(app){

    app.get('/', function(req,res){
        res.render('index');
    });
    app.get('/login', function(req,res){
        res.render('login');
    });
    app.get('/signup', function(req,res){
        res.render('signup');
    });
    app.get('/dashboard', function(req,res){
        console.log(req.session.user_id)
        if(req.session.user_id){
            User.findOne({_id: req.session.user_id}, function(err, user){
                if(err){
                    console.log('error', err);
                    res.render('dashboard');
                }else{
                    console.log(user)
                    res.render('dashboard', {user:user});
                }
            });
        }else{
            res.redirect('/login');
        }
    });
    app.post('/dashboard', function(req,res){
            User.findOneAndUpdate({_id: req.session.user_id}, {$push: {location: {pickup: req.body.pickup, dropoff: req.body.dropoff}}},{new:true}, function(err,user){
                if(err){
                    console.log('error adding location', err)
                    return res.redirect('/dashboard')
                }else{
                    console.log('user location updated', user)
                    return res.redirect('/dashboard')
                }
            })
        });
    app.post('/signup', function(req,res){
            console.log(req.body);
            if(req.body.password === req.body.password_confirmation){
                if(req.body.password.lenth < 8){
                    alert('Make it longer');
                };
                User.findOne({email: req.body.email}, (err,user)=>{
                    if(!user){
                        user = new User();
                        user.first_name = req.body.first_name;
                        user.last_name = req.body.last_name;
                        user.phone = req.body.phone;
                        user.email = req.body.email;
                        bcrypt.hash(req.body.password, 10)
                            .then(hashed_password => {
                                console.log(hashed_password);
                                user.password = hashed_password;
                                user.save((err, newUser)=>{
                                    if(err){
                                        console.log(err);
                                    }else{
                                        req.session._id = newUser._id;
                                        console.log(newUser);
                                        return res.redirect('/login');
                                    }
                                })
                           })
                            .catch(error => {
                                console.log(error);
                           });
                    }else{
                        console.log('User exists');
                        return res.redirect('/login');
                    }
                })
            }else{
                console.log('error');
                res.redirect('/signup');
            }
        });
        app.post('/login', (req,res)=>{
            console.log(req.body);
            User.findOne({email: req.body.email}, (err,user)=>{
                if(err){
                    console.log(err);
                    return res.redirect('/login');
                }
                if(user){
                    bcrypt.compare(req.body.password, user.password)
                          .then( result => {
                            console.log(result);
                            console.log('Logging in');
                            req.session.user_id = user._id;
                            console.log(req.session.user_id);
                            return res.redirect('/dashboard');
                        })
                          .catch( error => {
                        })
                }
            });
        });
        app.post('/charge', (req,res)=>{
            const amount = 5000;
        
            stripe.customers.create({
                email: req.body.stripeEmail,
                source: req.body.stripeToken,
            })
            .then(customer => stripe.charges.create({
                amount,
                description:'Your Trip Details',
                currency:'usd',
                customer:customer.id
            })
            .catch(err=>{
                console.log(err);
            })
        )
            .then(charge => res.redirect('/success'))
            .catch(err=>{
                console.log(err);
            })
        })

        app.get('/success', (req,res)=>{
            console.log(req.session.user_id)
                User.findOne({_id: req.session.user_id}, function(err, user){
                    if(err){
                         console.log('error', err);
                          res.render('success');
                    }else{
                         console.log(user)
                          res.render('success', {user:user});
                }
            });
        });

        app.post('/send', (req,res)=>{
            const output = `
            <h2>You have a new contact request</h2>
            <h3>Contact Details</h3>
            <ul>
            <li> Name: ${req.body.name}</li>
            <li> Email: ${req.body.email}</li>
            </ul>
            <h3>Message</h3>
            <p>Message: ${req.body.message}</p>
        `;
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'nodemail124@gmail.com',
                    pass: 'Krazykilla'
                }
            });

            let mailOptions = {
                from: '"Bagz Contact" <nodemail124@gmail.com>',
                to: "armen@getmefamous.com",
                subject: 'Bagz Contact Form',
                text:'Hello world?',
                html: output
            };

            transporter.sendMail(mailOptions, (error,info)=>{
                if (error){
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                res.render('index');
            })
        });
    }
