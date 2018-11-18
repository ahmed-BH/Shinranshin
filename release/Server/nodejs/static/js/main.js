$(document).ready(function(){

// fixing the view
	// notification navbar 
/*	if(globals.nb_notif_msg == 0)
	{
		$("#notif_msg").removeClass("label label-success");
		$("#notif_msg").html("");
	}
	if(globals.nb_notification == 0)
	{
		$("#notification").removeClass("label label-warning");
		$("#notification").html("");
	}
	if(globals.nb_notif_task == 0)
	{
		$("#notif_task").removeClass("label label-danger");
		$("#notif_task").html("");
	}
*/
	// notification bar : if we have missed some notifs then view has n notifs while nb_notif variable is 0
	// we are fixing this
	m = parseInt($("#notif_msg").html())
	if(m)
	{
		globals.nb_notif_msg = m;
	}
	n = parseInt($("#notification").html())
	if(n)
	{
		globals.nb_notification = n;
	}
	t = parseInt($("#notif_task").html())
	if(t)
	{
		globals.nb_notif_task = t;
	}
	// Done

	// setting tab
	$("#set_video_quality_input").bind("change",function(){
		$("#set_video_quality_aff").html($(this).val());
	});

	$("#set_framerate_input").change(function(){
		$("#set_framerate_aff").html($(this).val());
	});

	// navigate btw tabs
	$("#settings, a[href='#tab3_content']").click(function(){
		$("#tab1").removeClass("active");
		$("#tab1_content").removeClass("active");
		$("#tab2").removeClass("active");
		$("#tab2_content").removeClass("active");

		$("#tab3").addClass("active");
		$("#tab3_content").addClass("active");

		if($("#set_device option").length <= 2)
	   	{
			//get target's video/audio devices
			target = document.URL.split("=")[1];
			$.getJSON("get_ffmpeg_devs",{"id":target}, function(devs){

				// set global value, we need it
				globals.video_devs = devs.video_devs;

				for (i in devs.video_devs){
					// add video devs
					video_dev = Object.keys(devs.video_devs[i]);
					$("#set_device").append("<option value='"+video_dev+"'>"+video_dev+"</option> ");
				}				
			});
	    }
	});

	// set resolution according to the device
	$("#set_device").change(function(){
		dev = $("#set_device").val();
		if(dev == "desktop")
		{
			// delete the existing and replace
			$("#set_resolution").html('<option value="">Supported Resolution</option>');
			$("#set_resolution").append("<option value='480x320'>480x320</option> ");
		}
		else if (dev != "")
		{
			// find device object
			for (i in globals.video_devs)
			{
				if (dev == Object.keys(globals.video_devs[i]) )
					break;
			}

			// add resolutions
			// delete the existing and replace
			$("#set_resolution").html('<option value="">Supported Resolution</option>');
			reso = globals.video_devs[i][dev];
			for (j in reso)
			{
				$("#set_resolution").append("<option value='"+reso[j]+"'>"+reso[j]+"</option> ");
			}
		}
	});

	// refreshing settings
	$("#refresh").click(function(){
		$("#tab3_content").append('<div class="overlay"><i class="fa fa-refresh fa-spin"></i></div>');
	});

	// getting custom commands list
	$("#input_cmd").focus(function(){
		
		if($("#commands_list").html().trim().length == 0)
		{
			$.getJSON("get_cmds",function(cmds){
			$("#commands_list").html('');
			for(i in cmds)
				$("#commands_list").append('<option>'+i+'</option>');
			});
		}
	});

});

