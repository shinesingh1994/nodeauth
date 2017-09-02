var express = require('express');
var router = express.Router();

var multer = require('multer');
var uploads = multer({ dest: './uploads' });

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {
  	'title': 'Register'
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', {
  	'title': 'Login'
  });
});


router.post('/register', uploads.single('profileimg'), function(req, res, next){
	// Get Form Values
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Check for Image Field
	if(req.files){
		console.log('Uploading File...');

		//File Info
		var profileImageOriginalName = req.files.originalname;
		var profileImageName = req.files.name;
		var profileImageMime = req.files.mimetype;
		var profileImagePath = req.files.path;
		var profileImageExt = req.files.extension;
		var profileImageSize = req.files.size;
	} else{
		// Set Default Image
		var profileImageName = 'noimage.png';
	}

	// From Validation
	req.checkBody('name','Name field is required').notEmpty();
	req.checkBody('email','Email field is required').notEmpty();
	req.checkBody('email','Email not valid').isEmail();
	req.checkBody('username','Username field is required').notEmpty();
	req.checkBody('password','Password field is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password);

	// Check fo rerrors
	var errors = req.validationErrors();

	if(errors){
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
	}
	else{
		var newUser =  new User({
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			profileimage: profileImageName
		});

		// Create User
		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});
		console.log('Registration Successful');
		req.flash('success', 'Registration Successful');
		//res.location('/');
		res.redirect('/');
	}
});

//Passport user validation
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
	function(username, password, done){
		User.getUserByUsername(username, function(err, user){
			if(err) throw err;
			if(!user){
				console.log('Unknown User');
				return done(null, false, {message:'Unknown User'});
			}

			User.comparePassword(password, user.password, function(err, isMatch){
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				} else{
					console.log('Invalid Password');
					return done(null, false, {message:'Invalid Password'});
				}
			});
		});
	}
));

router.post('/login', passport.authenticate('local', {failureRedirect: '/users/login', failureFlash:'Invalid Username or Password'}), function(req, res){
	console.log('Authentication Successful');
	req.flash('success', 'You are Logged in');
	res.redirect('/');
});

router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You have logged out');
	res.redirect('/users/login');
});

module.exports = router;
