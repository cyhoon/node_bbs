/*
* Copyright 20017 YoungH
*/

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session'); // express-session

var mysql = require('mysql');
var con = mysql.createConnection({
   host: "localhost",
   user: "root",
   password: "sisi",
   database: "bbs" 
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var port = process.env.PORT || 3000;

app.use('/assets' , express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use('/', function(req,res,next){
    console.log('Request url : ' + req.url);
    next();
});
app.use(session({
 secret: '@#@$MYSIGN#@$#$',
 resave: false,
 saveUninitialized: true
}));


/**
 * BBS
 *  - list
 */
app.get('/bbs', function(req,res){
    res.redirect('/bbs/list');
});

app.get('/bbs/list', function(req,res){
    
    var log = false;
    
    if(req.session.user_id){
        var log = true;
    }

    var user_id = req.session.user_id;
    var user_name = req.session.user_name;

    var query = "SELECT `b_id`, `title`,`user_id`,`views` FROM board ORDER BY b_id DESC";
    con.query(query, function(err, rows){
        if(err) throw err;
        // console.log("rows : " + JSON.stringify(rows));

        res.render('list', {rows: rows , user_id : user_id , user_name : user_name, log : log});
    });

});


/**
 * get QueryString
 */
app.get('/bbs/list/view', function(req,res){

    var b_id = req.query.bid; // get board id

    // views increment
    var views = "UPDATE `board` SET views = views + "+ 1 +" WHERE b_id = "+b_id+";";
    con.query(views);

    var query = "SELECT * FROM `board` WHERE b_id ="+b_id+";";
    con.query(query, function(err,rows){
        if(err) throw err;
        
        res.render('view', {rows : rows});
    });
    // res.send('<h1>'+req.query.bid+'</h1>');

});

app.get('/bbs/write', function(req,res){
    
    if(req.session.user_id){
        res.render('write');
    }else{
        res.redirect('/bbs/list');
    }

});

app.post('/bbs/write', urlencodedParser ,function(req,res){
    
    /**
     * {title , name , content}
     *  -> POST REQUEST PARAMETER
     */

    var title = req.body.title;
    // var name = req.body.name;
    var name = req.session.user_id;
    var content = req.body.content;

    // console.log("user name : " + name);

    var data = [title,name,content];

    // var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES ("+title+","+name+","+content+");";
    var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES (?,?,?);";
    con.query(query, data ,function(err){
        if (err) throw err;
    });

    res.redirect('/bbs/list');

});

app.get('/bbs/modify', function(req,res){

    
    if(!req.session.user_id){
        res.redirect('/bbs/list');
    }

    var b_id = req.query.bid;

    var user_id = req.session.user_id;


    var query = "SELECT * FROM `board` WHERE b_id ="+b_id+";";
    con.query(query, function(err,rows){
        if(err) throw err;
        
        var row_id = rows[0].user_id;

        if( row_id != user_id ){
            res.redirect('/bbs/list');
        }else{
            // console.log(rows);
            res.render('modify', {rows : rows});
        }
    });

});

app.post('/bbs/modify', urlencodedParser, function(req,res){
    /**
     * {title , name , content}
     *  -> POST REQUEST PARAMETER
     */

    var b_id = req.body.b_id;

    var title = req.body.title;
    // var name = req.body.name;
    var content = req.body.content;

    var data = [title,content,b_id];

    // var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES ("+title+","+name+","+content+");";
    // var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES (?,?,?);";
    var query = "UPDATE `board` SET title = ?, content = ? WHERE b_id = ?;";
    con.query(query,data,function(err){
        if (err) throw err;
    });

    res.redirect('/bbs/list');
});

app.get('/bbs/delete', function(req,res){

    if(!req.session.user_id){
        console.log("bbs list back");
    }else{

        var user_id = req.session.user_id;
    
        var b_id = req.query.bid;

        var data = [b_id];

        var query = "SELECT * FROM `board` WHERE b_id = ?";
        con.query(query, data , function(err,rows){

            if (err) throw err;

            console.log("Select board user id");
            console.log(row_id + " : " + user_id);

            var row_id = rows[0].user_id;
            
            if(row_id == user_id){
                var query = "DELETE FROM `board` WHERE b_id = ?";
                con.query(query,data,function(err){
                    if (err) throw err;
                    
                });   
            }
        });
    }

    res.redirect('/bbs/list');

});

app.get('/user/register', function(req,res){
    res.render('register');
});

app.post('/user/register', urlencodedParser , function(req,res){

    var id = req.body.id;
    var pass = req.body.pass;
    var name = req.body.name;
    var age = req.body.age;
    var phone = req.body.phone;
    

    var data = [id,pass,name,age,phone];

    var query = "INSERT INTO `users` VALUES (?,?,?,?,?);";
    con.query(query, data , function(err){
        if(err) throw err;
    });

    res.redirect('/bbs');

});

app.get('/user/login', function(req,res){
    var message = "login please";
    res.render('login', { notice : message });
});

app.post('/user/login', urlencodedParser , function(req,res){
    
    var id = req.body.id;
    var pass = req.body.pass;

    var data = [id,pass];

    var query = "SELECT * FROM `users` WHERE id=? AND pass=?;";
    con.query(query, data, function(err,rows){
        if(err) throw err;

        /**
         *  Selct users database 
         *      console.log(rows.length);
         * */
        if(rows.length){ // rows.length : empty : 0
            
            // Session Configuration
            var hour = 3600000;
            req.session.cookie.expires = new Date(Date.now() + hour);
            req.session.cookie.maxAge = hour;

            // Asign Session
            req.session.user_id = rows[0].id;
            req.session.user_name = rows[0].name;

            /*console.log(req.session.user_id);
            console.log(req.session.user_name);*/
            req.session.save(function(){
                res.redirect('/bbs/list');
            });

        }else{
            
            var message = "Try agin";
            res.render('login',{  notice : message });
            
        }

    });
});

app.get('/user/logout', function(req,res){
    delete req.session.user_id;
    delete req.session.user_name;
    res.redirect('/bbs/list');
});


app.listen(port, function(){
    console.log('YounH app listening on ports ' + port);
});