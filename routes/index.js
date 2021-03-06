//var express = require('express');
//var router = express.Router();

/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});

var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

//module.exports = router;
module.exports = function (app) {
  app.get('/', function (req, res) {
    Post.getAll(null, function (err, posts) {
      if (err) {
        posts = [];
      }

      res.render('index', {
        title: '主页',
        user: req.session.user, posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString() 
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var password_re = req.body['password-repeat'];

    if (password_re != password) {
      req.flash('error', '两次输入的密码不一致');
      return res.redirect('/reg');
    }

    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });

    User.get(newUser.name, function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', '用户已存在');
        return res.redirect('/reg');
      }

      newUser.save(function (err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg');
        }
        req.session.user = user;
        req.flash('success', '注册成功');
        res.redirect('/');
      });
    });
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
      //paso: req.flash('paso').toString(),
      //past: req.flash('past').toString()
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');

    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');
      }

      //req.flash('paso', password);
      //req.flash('past', user.password);
      console.log("=========");
      console.log(user.name);
      console.log(user.password);
      if (user.password != password) {
        req.flash('error', '密码错误');
        return res.redirect('/login');
      }

      req.session.user = user;
      req.flash('success', '登陆成功');
      res.redirect('/');
    });
  });

  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.title, req.body.post);

    post.save( function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', '发布成功');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
  app.post('/upload', function (req, res) {
    req.flash('success', '文件上传成功');
    res.redirect('/upload');
  });

  app.get('/u/:name', function (req, res) {
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('/');
      }

      Post.getAll(user.name, function (err, posts) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }

        res.render('user', {
          title: user.name,
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });

  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }

      console.log(req.params.title);
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录');
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录');
      res.redirect('back');
    }
    next();
  }
};
