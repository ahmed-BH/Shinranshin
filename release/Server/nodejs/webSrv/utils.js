var util = require("util");

module.exports.notify_webUI = function(sender, body, notif_type)
{
	tmp_time = new Date().toISOString().replace("T"," ").replace(/\..+/, '')+" UTC";
	notif = '{"type": "'+notif_type+'","body": "'+body+'", "time": "'+tmp_time+'", "sender": "'+sender+'"}';
	try
	{
		global.ws.send(notif);
	}
	catch(ex)
	{
		global.missed_notifs.push(JSON.parse(notif));
		if (ex instanceof TypeError)
		{	
			util.log("webUI is closed, Refresh it!".yellow);
		}
		else
		{
			util.log(("Error : "+ ex.message).red);
		}
	}
}

// delete socket_object from connected targets
module.exports.delete_sock = function(sock_id, targets)
{
	index = module.exports.sock_id_index(sock_id, targets);

	// remove sock object
	if (index > -1)
	{
		targets.splice(i,1);
	}
}

// find a sock_obj in targets-connected-array given sock_target_id
module.exports.sock_target_id_index = function (target_id, targets)
{
	for (i=0; i<targets.length; i++)
	{
		if(targets[i].target_id === target_id)
			{
				return i;
			}
	}
	return -1;
}

// find a sock_obj in targets-connected-array given sock_id
module.exports.sock_id_index = function (sock_id, targets)
{
	var ip = sock_id.split(":")[0];

	for (i=0; i<targets.length; i++)
	{
		if(targets[i].id === sock_id || targets[i].id.split(":")[0] === ip )
			{
				return i;
			}
	}
	return -1;
}

module.exports.nb_msg_notifs = function(notifs_array){
	var count = 0;
	for(i=0; i < notifs_array.length; i++)
	{
		if(notifs_array[i].type === "msg")
			count = count + 1 ;
	}

	return count;
}

module.exports.nb_notifs = function(notifs_array){
	var count = 0;
	for(i=0; i < notifs_array.length; i++)
	{
		if(notifs_array[i].type === "notification")
			count = count + 1 ;
	}

	return count;
}

// This function is entended to avoid "ejs" from doing complex testing/work (ejs isn't so flexible!)
module.exports.enhance_var = function(target_info){

	if(!target_info)
	{
		target_info = {};
		target_info.id = "Unknow Target !";
		target_info.platform = "Undefined Value";
		target_info.machine = "Undefined Value";
		target_info.processor = "Undefined Value";
		target_info.ram = "Undefined Value";
		target_info.hard_disk = "Undefined Value";
		target_info.mac = "Undefined Value";
	}

	return target_info;
}