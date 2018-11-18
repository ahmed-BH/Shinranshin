$(document).ready(function(){
	var target = document.URL.split("=")[1];
	var canvas = document.getElementById('video_stream');
	var url = 'ws://127.0.0.1:80/stream';
	
	var player = new JSMpeg.Player(url, {canvas: canvas});
	player.stop();

	$("#play").click(function(){
		// send request to the target
		dev = $("#set_device option:selected").val() ? $("#set_device option:selected").val() : "desktop";
		reso = $("#set_resolution option:selected").val() ? $("#set_resolution option:selected").val() : "480x320";
		quality = $("#set_video_quality_input").val();
		frate = $("#set_framerate_input").val();

		
		//cmd='__stream__{"dev":"'+dev+'", "reso":"'+reso+'", "frate":"'+frate+'", "q":"'+quality+'"}';
		cmd="__stream__{'dev':'"+dev+"', 'reso':'"+reso+"', 'frate':'"+frate+"', 'q':'"+quality+"'}";
		config.web_sock.send('{"target": "'+target+'", "cmd" : "'+cmd+'"}');

		// change canvas accoording to resolution
		$("#video_stream").css("width", reso.split("x")[0]);
		$("#video_stream").css("height", reso.split("x")[1]);

		player.play();
	});

	$("#stop").click(function(){
		config.web_sock.send('{"target": "'+target+'", "cmd" : "__stopStream__"}');
		player.stop();
		
		// clean jsmpeg player
		player = new JSMpeg.Player(url, {canvas: canvas});
		player.stop();
	});

	$("#pause").click(function(){
		player.pause();
	});

});
