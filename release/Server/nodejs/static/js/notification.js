$(document).ready(function(){

	var web_sock = new WebSocket("ws://" + config.host + ":80/notifications");
    config.web_sock = web_sock;
    
    $("#send_cmd_btn").click(function(){
        // remove mutlipule extra space in the middle of string
        cmd = $("#input_cmd").val().trim().replace(/ +/, " ");
        if(cmd)
        {
            /*
            globals.msg_counter ++ ;
            globals.msg_ids.push(globals.msg_counter);
            globals.msg_ids_cmd.push(cmd);
            */
            $("#input_cmd").val("");
            target = document.URL.split("=")[1];
            web_sock.send('{"target": "'+target+'", "cmd" : "'+cmd+'"}');
        }
    });

    web_sock.onmessage = function (evt) {
        // cleaning result string in case target is wondows os
        var notification = JSON.parse(String.raw`${evt.data}`.replace(/\\/gi,"/").replace(/(\n)+/gi,"<br>").replace(/(\t|\r|<dir>)+/gi,""));

        // just enhance the view (time value)
        date = new Date(notification.time.replace("UTC","").trim());
        now = new Date();
        if(date.getYear() == now.getYear() && date.getMonth() == now.getMonth() && date.getDate() == now.getDate())
        {
            notification.time = "Today "+date.getHours()+":"+date.getMinutes();
        }
        // end time enhancement

        if(notification.type.startsWith("msg"))
        {
        	globals.nb_notif_msg = globals.nb_notif_msg + 1;
        	
            // update navbar
        	$("#notif_msg").attr("class","label label-success");
			$("#notif_msg").html(globals.nb_notif_msg);
			$("#snd_notif_msg")[0].play();
            $("#notif_msg_body").prepend(`
                <li>
                    <a href="">
                      <div class="pull-left">
                        <img src="static/img/user3-128x128.jpg" class="img-circle" alt="User Image">
                      </div>
                      <h4>
                        `+notification.sender.split("@")[1]+`
                      </h4>
                      <p class="notification_msg"> <small>`+notification.body.split("<br>")[0].trim()+`</small>... </p>
                      <div>
                        <center><small><i class="fa fa-clock-o"></i>  `+notification.time+`</small></center>
                      </div>
                    </a>
                  </li>
                `);
            // end navbar

            // update chat box
            // check if we are in communication page of the target
            if(document.URL.indexOf($("#id").html().trim()) > -1)
            {
                // we are in communication page, add chat item
                $("#chat-box").append(`
                    <div class="item">
                      <img src="static/img/target.jpg" alt="user image">
                      <p class="message">
                        <a class="name">
                          <small class="text-muted pull-right" ><i class="fa fa-clock-o"></i>`+notification.time+`</small>
                          `+notification.sender.split("_")[0].split("@")[1] +`
                        </a>
                        `+notification.body+`
                      </p>
                    </div>
                    `);

                // scroll down automaticlly
                height = $("#chat-box").get(0).scrollHeight;
                $("#chat-box").animate({scrollTop: height});
            }
            // end chat box
        }
        else if(notification.type == "notification")
        {
        	globals.nb_notification = globals.nb_notification + 1;

        	$("#notification").attr("class","label label-warning");
			$("#notification").html(globals.nb_notification);
			$("#snd_notification")[0].play();

            // set body content
            if(notification.body.endsWith("disconnected"))
            {
                // update notif bar
                $("#notification_body").prepend(`
                <li>
                    <a href="">
                      <i class="fa fa-user-times text-red"></i> Target : <b>`+ notification.body.replace("disconnected","") +`</b>
                      <div style="left:25px;position: relative;">
                        <small style="color:#3c8dbc;"><i class="fa fa-clock-o"></i> `+notification.time+`</small>
                      </div>
                    </a>
                </li>
                `);

                // update connected targets list
                target_id = notification.body.replace("disconnected","").trim();
                $("#nb_cnx_targets").html(parseInt($("#nb_cnx_targets").html())-1);
                $("li[id='"+target_id+"']").html("");
            }
            
            else if(notification.body.endsWith("connected"))
            {
                // update notif bar
                $("#notification_body").prepend(`
                <li>
                    <a href="">
                      <i class="fa fa-user-plus text-green"></i> Target : <b>`+ notification.body.replace("connected","") +`</b>
                      <div style="left:25px;position: relative;">
                        <small style="color:#3c8dbc;"><i class="fa fa-clock-o"></i> `+notification.time+`</small>
                      </div>
                    </a>
                </li>
                `);

                // update connected targets list
                target_id = notification.body.replace("connected","").trim();
                $("#nb_cnx_targets").html(parseInt($("#nb_cnx_targets").html())+1);
                $("#list_cnx_targets").append(`
                    <li id="`+ target_id +`">
                        <a href="communication?id=`+target_id+`">
                          <i class="fa fa-circle-o text-aqua"></i><small>`+target_id.split("_")[0]+`</small>
                        </a>
                    </li>
                    `);
            }
            else if(notification.body.endsWith("stopped"))
            {
                $("#notification_body").prepend(`
                <li>
                    <a href="">
                      <i class="fa fa-warning text-yellow"></i> Target : <b>`+ notification.body.replace("stopped","") +`</b>
                      <div style="left:25px;position: relative;">
                        <small style="color:#3c8dbc;"><i class="fa fa-clock-o"></i> `+notification.time+`</small>
                      </div>
                    </a>
                </li>
                `);
            }
        }
        else if (notification.type == "task")
        {
            tmp_attr = notification.body.split("%");
            id_attr = notification.sender.split("@")[1];
            icon = "";
            if(tmp_attr[2] == "download")
            {
                id_attr = id_attr+"_get";
                pg_bar_color = "aqua";
                icon = "fa fa-cloud-download";
            }
            else
            {
                id_attr = id_attr+"_send";
                pg_bar_color = "green";
                icon = "fa fa-share";
            }

            if ($("#"+id_attr).length == 0)
            {
                $("#notif_task_body").prepend(`
                    <!-- Task item -->
                    <li>
                        <a href="#">
                          <h3>
                            <i class="`+icon+`"></i> `+tmp_attr[1]+`
                            <small class="pull-right">`+tmp_attr[0]+`%</small>
                          </h3>
                          <div class="progress xs" id="`+id_attr+`">
                            <div class="progress-bar progress-bar-`+pg_bar_color+`" style="width: `+tmp_attr[0]+`%" role="progressbar" aria-valuenow="`+tmp_attr[0]+`" aria-valuemin="0" aria-valuemax="100">
                            </div>
                          </div>
                        </a>
                     </li>
                    <!-- end task item -->
                      `);
            }
            else
            {
                // just updating task element
                $("#"+id_attr+" div").width(tmp_attr[0]+"%");
                $("#"+id_attr+" div").attr("aria-valuenow", tmp_attr[0]);
                $("#"+id_attr).prev().find("small").html(tmp_attr[0]+"%");

            }
            if (tmp_attr[0] == 100.0)
            {
                globals.nb_notif_task = globals.nb_notif_task + 1;

                $("#notif_task").attr("class","label label-danger");
                $("#notif_task").html(globals.nb_notif_task);
                $("#snd_notif_task")[0].play();

                $("#"+id_attr).attr("id", "");
            }
        }
    };

});