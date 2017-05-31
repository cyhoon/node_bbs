/*
* Copyright 20017 YoungH
*/

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

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


/**
 * BBS
 *  - list
 */
app.get('/bbs', function(req,res){
    res.redirect('/bbs/list');
});

app.get('/bbs/list', function(req,res){
    
    var query = "SELECT `b_id`, `title`,`user_id`,`views` FROM board ORDER BY b_id DESC";
    con.query(query, function(err, rows){
        if(err) throw err;
        console.log("rows : " + JSON.stringify(rows));

        res.render('list', {rows: rows});
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
    res.render('write');
});

app.post('/bbs/write', urlencodedParser ,function(req,res){
    
    /**
     * {title , name , content}
     *  -> POST REQUEST PARAMETER
     */

    var title = req.body.title;
    var name = req.body.name;
    var content = req.body.content;

    var data = [title,name,content];

    // var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES ("+title+","+name+","+content+");";
    var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES (?,?,?);";
    con.query(query, data ,function(err){
        if (err) throw err;
    });

    res.redirect('/bbs/list');

});

app.get('/bbs/modify', function(req,res){

    var b_id = req.query.bid;

    // views increment
    var views = "UPDATE `board` SET views = views + "+ 1 +" WHERE b_id = "+b_id+";";
    con.query(views);

    var query = "SELECT * FROM `board` WHERE b_id ="+b_id+";";
    con.query(query, function(err,rows){
        if(err) throw err;
        
        console.log(rows);
        res.render('modify', {rows : rows});
    });

});

app.post('/bbs/modify', urlencodedParser, function(req,res){
    /**
     * {title , name , content}
     *  -> POST REQUEST PARAMETER
     */

    var b_id = req.body.b_id;

    var title = req.body.title;
    var name = req.body.name;
    var content = req.body.content;

    var data = [title,name,content,b_id];

    // var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES ("+title+","+name+","+content+");";
    // var query = "INSERT INTO `board` (`title`,`user_id`,`content`) VALUES (?,?,?);";
    var query = "UPDATE `board` SET title = ?, user_id = ?, content = ? WHERE b_id = ?;";
    con.query(query,data,function(err){
        if (err) throw err;
    });

    res.redirect('/bbs/list');
});

app.get('/bbs/delete', function(req,res){
    
    var b_id = req.query.bid;

    var data = [b_id];

    var query = "DELETE FROM `board` WHERE b_id = ?";
    con.query(query,data,function(err){
        if (err) throw err;
    });

    res.redirect('/bbs/list');
});


app.listen(port, function(){
    console.log('YounH app listening on port ' + port);
});