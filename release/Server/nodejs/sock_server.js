var net = require('net');
var util = require('util');
var colors = require('colors');
var fs = require('fs');
var path = require("path");

var core = require('./core');
var webSrv = require('./webSrv');

module.exports.send_cmd = function(cmd){
	cmd_obj = JSON.parse(cmd);
	target_index = webSrv.utils.sock_target_id_index(cmd_obj.target, targets)
	
	if( target_index > -1 )
	{
		if(cmd_obj.cmd.startsWith("-get"))
		{
			// test if we are getting a file or not at this moment for this target
			if (!targets[target_index].ftp_sock.WriteStream)
			{	
				tmp = cmd_obj.cmd.split(" ");
				
				// path indicates where to save donwloaded files
				file_path = (tmp.length == 2) ? path.join(core.config.DEFAULT_SAVING_DIR,targets[target_index].target_id) : path.normalize(tmp[2]);
				filename = path.basename(tmp[1]);
				targets[target_index].ftp_sock.save_loc = path.join(file_path, filename);
				targets[target_index].ftp_sock.requested_f = tmp[1];
				// save start date_time (needed for db_history)
				targets[target_index].ftp_sock.sdate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
				
				util.log("Sending get_cmd to target..")
				targets[target_index].write(cmd_obj.cmd);
			}
			else
			{
				util.log("Already getting a file from "+targets[target_index].target_id);
				targets[target_index].ftp_sock.to_get_queue.push(cmd_obj);
			}
			
		}
		else if(cmd_obj.cmd.startsWith("-send"))
		{
			// test if we are sending a file or not at this moment for this target
			if (!targets[target_index].ftp_sock.ReadStream)
			{
				cmd_args = cmd_obj.cmd.split(" ");
				//check if file that will be send exists
				if(fs.existsSync(cmd_args[1]) && fs.statSync(cmd_args[1]).isFile())
				{
					targets[target_index].ftp_sock.ReadStream = fs.createReadStream(cmd_args[1]);
					tmp_size = fs.statSync(cmd_args[1]).size;
					targets[target_index].ftp_sock.tosend_size = tmp_size;
					targets[target_index].ftp_sock.sent_size = 0;
					var tmp_percent = 0;
					// sending file..
					//targets[target_index].ftp_sock.ReadStream.pipe(targets[target_index].ftp_sock);
					targets[target_index].ftp_sock.ReadStream.on("data", function(data){
						tmp_len = data.length;
						targets[target_index].ftp_sock.write(data);
						targets[target_index].ftp_sock.sent_size = tmp_len + targets[target_index].ftp_sock.sent_size ;
						
						//notifying webUI
						tmp_percent = targets[target_index].ftp_sock.sent_size / targets[target_index].ftp_sock.tosend_size *100;
						tmp_body = tmp_percent.toFixed(2)+"%"+ path.basename(cmd_args[1])+"%upload";
						webSrv.utils.notify_webUI(targets[target_index].target_id,tmp_body,"task");
					});
					// finish sending
					targets[target_index].ftp_sock.ReadStream.on("end", function(){
						util.log("done__percent = "+tmp_percent);
						targets[target_index].ftp_sock.ReadStream.destroy();
						targets[target_index].ftp_sock.ReadStream = null;

						// add to ftp_history database
						edate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
						hist = {"target_id":targets[target_index].target_id,"Type":"send","state": "completed", "sdate":targets[target_index].ftp_sock.sdate,"edate":edate,"trecv":"-1","path":cmd_args[1], "tsnd":targets[target_index].ftp_sock.tosend_size};
						core.db_ops.add_to_ftp_history(hist, function(err){
							if(err)
							{
								util.log(("Failed to add to ftp_history database : " + err.message).red);
							}
						});
						// end adding to ftp history
					});
					util.log("Started sending '" + cmd_args[1] + "'..");
					
					// attach file's size to the cmd
					cmd_obj.cmd = cmd_obj.cmd + " _size==" + tmp_size;
					util.log("Sending send_cmd to target..")
					targets[target_index].write(cmd_obj.cmd);
					
					// save start date_time (needed for db_history)
					targets[target_index].ftp_sock.sdate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
				}
				else
				{
					webSrv.utils.notify_webUI(targets[target_index].target_id,"__err__trying to send a dir or file doesn't exist","msg_err")
					util.log("trying to send a dir or file that doesn't exist".yellow);
				}
			}
			else
			{
				util.log("Already sending a file to "+targets[target_index].target_id);
			}
		}
		else
		{
			util.log("Sending cmd to target..")
			targets[target_index].write(cmd_obj.cmd);
			// store cmd_text, cmd_start_date so save it to database when we get result
			targets[target_index].cmd_text = cmd_obj.cmd;
			targets[target_index].cmd_sdate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
		}
		
	}
	else
	{
		util.log(("trying to send cmd to disconnected target : " + cmd_obj.target).yellow);
		webSrv.utils.notify_webUI("SystemCtl", "Target is Not Connected", "msg_err");
	}
}

module.exports.start = function(){

	// connect to DB
	core.db_ops.connect();
	var sock_server = net.createServer();

	sock_server.on("connection", function(sock){
		sock.id = sock.remoteAddress+":"+sock.remotePort;
		util.log((sock.id + " Has Connected (didn't identify yet)").yellow);

		sock.on("data", function(data){
			handle_coming_msg(targets, sock, data);
		});

		sock.once("close", function(){
			tmp = sock.target_id||sock.id;
			webSrv.utils.notify_webUI(tmp, tmp+" disconnected", "notification");
			util.log(tmp + " Disconnected");

			webSrv.utils.delete_sock(sock.id, targets);
			util.log("Removed "+sock.id+" from targets");
		});

		sock.on("error", function(err){
			webSrv.utils.delete_sock(sock.id, targets);
			tmp = sock.target_id||sock.id;
			webSrv.utils.notify_webUI(tmp, tmp + " stopped", "notification");
		});
	});

	sock_server.listen(core.config.SOCK_PORT,  core.config.SOCK_SRV);
	util.log(("Listening for sockets targets on "+core.config.SOCK_SRV+":"+core.config.SOCK_PORT).cyan);
}

// handle coming data/msgs from targets/sockets
function handle_coming_msg(targets, sock, data){
	data = data.toString('utf8');

	if (data.startsWith("__ack__id__"))
	{
		target_id = data.split("__ack__id__")[1];
		sock.target_id = target_id;
		// save newly connected target to targets array
		targets.push(sock);
		util.log("Got ID_ACK : " + target_id);

		// notify web interface
		webSrv.utils.notify_webUI(target_id, target_id+" connected", "notification");

		core.db_ops.target_in_db(target_id, function(err, row){
			if(err)
				util.log(("[target_in_db] Error : "+ err.message).red);
			else
			{
				if(row)
				{
					util.log("Found Target in DB");
					sock.write("__ok__");
				}
				else
				{
					util.log(("Target Not Found in DB").yellow);
					sock.write("__ko__");
				}
			}
		});
	}
	else if(data.startsWith("__info__"))
	{
		util.log("Got INFO msg");

		target_info = data.split("__info__")[1];
		target_info = JSON.parse(target_info);

		core.db_ops.add_target(target_info, function(err){
			if(err)
				util.log(("[add_target] Error : " + err.message).red);
			else
				util.log("Added Target id= " + target_info.id);
		});
	}
	// got the total size of the file that will be downloaded
	else if (data.startsWith("__tSize__"))
	{
		ind = webSrv.utils.sock_id_index(sock.id, targets);
		t_size = parseInt(data.split("__tSize__")[1]);
		if ( t_size > -1 )
		{
			// preparing where to save downloaded file
			new_save_loc = core.ftp.prepare_saving_loc(targets[ind].target_id, targets[ind].ftp_sock.save_loc);
			targets[target_index].ftp_sock.WriteStream = fs.createWriteStream(new_save_loc);
			targets[ind].ftp_sock.tsize = t_size;
			targets[ind].ftp_sock.rsize = t_size;
			
			util.log("opening file write_Strm for "+new_save_loc);
			sock.write("_ok_tSize_");
		}
		else
		{
			util.log("Requested File does not exist '"+targets[target_index].ftp_sock.requested_f+"'");

			// notify webUI about the error
			tmp = sock.target_id||sock.id;
			webSrv.utils.notify_webUI(tmp, "__err__file path does not exist "+targets[target_index].ftp_sock.requested_f, "msg_err");
			
			targets[target_index].ftp_sock.save_loc = "";
			targets[target_index].ftp_sock.requested_f = "";
		}
		
		 
		
	}
	else
	{
		// notify web interface
		tmp = sock.target_id||sock.id;
		// edate = end_date 
		tmp_edate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
		
		if (data.startsWith("__sys__"))
		{
			util.log(data.split("__sys__")[1]);
			return;
		}
		else if(data.startsWith("__err__"))
		{
			// received err msg, wrong system command for example
			type_msg = "msg_err";
		}
		else
		{
			type_msg = "msg";
		}

		webSrv.utils.notify_webUI(tmp, String.raw`${data}`, type_msg);

		// store response in db if target exists
		target_index = webSrv.utils.sock_target_id_index(tmp, targets);
		if (target_index > -1 )
		{
			cmd_text = targets[target_index].cmd_text||"";
			hist = {"target_id": tmp, "cmd_text": cmd_text, "edate": tmp_edate, "sdate": targets[target_index].cmd_sdate,"Type": type_msg, "data": data};
			
			core.db_ops.add_to_history(hist, function(err){
				if(err)
				{
					util.log(("Failed to add to history database : " + err.message).red);
				}
			});
		}
	}
	
}
