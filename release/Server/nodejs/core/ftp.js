var net = require('net');
var util = require('util');
var colors = require('colors');
var fs = require('fs');
var path = require('path');
var util = require('util');
var config = require('./config');
var webSrv = require('../webSrv');
var db_ops = require('./db_ops');


module.exports.prepare_saving_loc = prepare_saving_loc;

module.exports.start = function(){

	var ftp_srv = net.createServer();
	ftp_srv.listen(config.FTP_PORT, config.SOCK_SRV);
	util.log(("FTP Server on "+ config.SOCK_SRV +":"+config.FTP_PORT).cyan);

	ftp_srv.on("connection", function(ftp_client){
		util.log("ftp connection : " + ftp_client.remoteAddress);
		
		// add ftp_socket to the global target socket_obj
		var ind = webSrv.utils.sock_id_index(ftp_client.remoteAddress, targets)
		if (ind > -1 )
		{
			targets[ind].ftp_sock = ftp_client;
			// save -get cmd so we can get only one file from specific target at a time
			targets[ind].ftp_sock.to_get_queue = [];
			util.log("Attached ftp_client_sock to target global socket");
		}

		//ftp_client.pipe(targets[ind].ftp_sock.WriteStream);
		
		// getting files
		ftp_client.on("data", function(data){

			ind = webSrv.utils.sock_id_index(ftp_client.remoteAddress, targets)
			if (targets[ind].ftp_sock.WriteStream)
			{
				targets[ind].ftp_sock.WriteStream.write(data);
				tmp_data_len = data.length;
				targets[ind].ftp_sock.rsize = targets[ind].ftp_sock.rsize - tmp_data_len;//rsize = remainingSize

				tmp_percent = (targets[ind].ftp_sock.tsize - targets[ind].ftp_sock.rsize) / targets[ind].ftp_sock.tsize * 100;
				tmp_body = tmp_percent.toFixed(3) + "%" + path.basename(targets[ind].ftp_sock.save_loc) + "%download";
				webSrv.utils.notify_webUI(targets[ind].target_id, tmp_body, "task");
				
				if(targets[ind].ftp_sock.rsize <= 0)
				{
					targets[ind].ftp_sock.WriteStream.end();
					targets[ind].ftp_sock.WriteStream.close();
					targets[ind].ftp_sock.WriteStream = null;
					util.log("Downloaded file");

					// add to ftp_history database
					edate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
					hist = {"target_id":targets[ind].target_id,"Type":"get","sdate":targets[ind].ftp_sock.sdate,"edate":edate,"trecv":targets[ind].ftp_sock.tsize,"tsnd":"-1","state":"completed","path":targets[ind].ftp_sock.save_loc};
					db_ops.add_to_ftp_history(hist, function(err){
						if(err)
						{
							util.log(("Failed to add to ftp_history database : " + err.message).red);
						}
					});
					// end adding to ftp history

					// get/download next file from recently actif target
					pop_toGetQueue(targets[ind].ftp_sock.requested_f, targets[ind].ftp_sock.to_get_queue);
					if(targets[ind].ftp_sock.to_get_queue.length > 0)
					{
						next_file = targets[ind].ftp_sock.to_get_queue[0];
						download_evt.emit("finish", JSON.stringify(next_file));
					}
					else
					{
						util.log("Finished all downloading");
					}
				}
			}
			else
			{
				util.log("WriteStream is not defiend (ftp data event)");
			}
			
		});

		// handle socket error
		ftp_client.on("error", function(err){
			util.log(("FTP socket error : "+ err.message).red);

			// repport the error to ftp_history database
			ind = webSrv.utils.sock_id_index(ftp_client.remoteAddress, targets)
			if (ind > -1)
			{
				if(targets[ind].ftp_sock.WriteStream)
				{
					//it's a "get" ftp request
					remaining = targets[ind].ftp_sock.tsize - targets[ind].ftp_sock.rsize ;
					edate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
					hist = {"target_id":targets[ind].target_id,"Type":"get","sdate":targets[ind].ftp_sock.sdate,"edate":edate,"trecv":remaining,"tsnd":"-1","state":"error","path":targets[ind].ftp_sock.save_loc};
					
					db_ops.add_to_ftp_history(hist, function(err){
						if(err)
						{
							util.log(("Failed to add to ftp_history database : " + err.message).red);
						}
					});
				}
				else if (targets[ind].ftp_sock.ReadStream)
				{
					// it's a "send" ftp request
					edate = new Date().toISOString().replace("T"," ").replace(/\..+/, '');
					hist = {"target_id":targets[target_index].target_id,"Type":"send","state": "error", "sdate":targets[target_index].ftp_sock.sdate,"edate":edate,"trecv":"-1","path":cmd_args[1], "tsnd":targets[target_index].ftp_sock.sent_size};
					db_ops.add_to_ftp_history(hist, function(err){
						if(err)
						{
							util.log(("Failed to add to ftp_history database : " + err.message).red);
						}
					});
				}
			}
			// end adding to ftp_history
		});
	});
}

function prepare_saving_loc(target_id, save_path){
	// verify the existance of the path
	// return new path if path arg is invalid
	dirs = path.dirname(save_path);
	if(!fs.existsSync(dirs))
	{
		util.log(dirs + " Saving_path doesn't exist..");
		if(dirs.indexOf(path.join(config.DEFAULT_SAVING_DIR, target_id)) > -1)
		{
			// create all sub folders
			util.log("Creating non existing sub_folders..")

			tmp_path = "";
			tmp_dirs = dirs.split(path.sep);
			for(i=0 ; i < tmp_dirs.length; i++)
			{
				tmp_path = path.join(tmp_path, tmp_dirs[i]);
				if(!fs.existsSync(tmp_path))
				{
					fs.mkdir(tmp_path);
				}
			}
			util.log("Done creating sub_folders");

			// check if filename exists
			if(fs.existsSync(save_path))
			{
				util.log("Renaming file that will be Downloaded..");
				return path.join(dirs,Math.random()+"_"+path.basename(save_path));
			}

			return save_path;
		}
		else
		{
			util.log("rename Saving_path to default..");
			return prepare_saving_loc(target_id, path.join(config.DEFAULT_SAVING_DIR, target_id, path.basename(save_path)));
		}
	}
	else
	{
		// check if filename exists
		if(fs.existsSync(save_path))
		{
			util.log("Renaming file that will be Downloaded..");
			return path.join(dirs,Math.random()+path.basename(save_path));
		}
		else
		{
			return save_path;
		}
	}
}

function pop_toGetQueue(requested_file, queue)
{
	var j = 0;
	for(i=0; i < queue.length ; i++)
	{
		util.log("comparing : " + requested_file + " and " + queue[i].cmd.split(" ")[1]);
		if(requested_file === queue[i].cmd.split(" ")[1])
		{
			queue.slice(i, 1);
			j = j + 1;
		}
	}
	util.log("Poped " + j + " from to_get_queue");
}