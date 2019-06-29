$(document).ready(function(){
	$.getJSON("/total_msgs",function(msgs){
		if(!msgs.error)
			$("#total_msgs").html(msgs.data.nb);
		else
			console.log(msgs.error);
	});

	$.getJSON("nb_downloads",function(downloads){
		if(!downloads.error)
			$("#total_downloads").html(downloads.data.nb);
		else
			console.log(downloads.error);
	});

	$.getJSON("nb_targets",function(tg){
		if(!tg.error)
			$("#total_targets").html(tg.data.nb);
		else
			console.log(tg.error);
	});

	$.getJSON("nb_uploads",function(uploads){
		if(!uploads.error)
			$("#total_uploads").html(uploads.data.nb);
		else
			console.log(uploads.error);
	});
});