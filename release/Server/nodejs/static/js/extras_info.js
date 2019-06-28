$(document).ready(function(){

    // SetUp TimeLine tab
    const target = document.URL.split("=")[1];
    $.getJSON("timeline", {"id": target}, function(infos){
        let date_starts = [];
        const len = infos.length;
        for(i=0; i<len; i++)
        {
            daTe = infos[i].date_start.split(" ")[0];
            time = infos[i].date_start.split(" ")[1];

            if(date_starts.indexOf(daTe) == -1)
            {
                date_starts.push(daTe);
                $("#timeline_body").append(`
                <!-- timeline time label -->
                  <li class="time-label">
                        <span class="bg-red">
                          `+daTe+`
                        </span>
                  </li>
                  <!-- /.timeline-label -->`);
            }

            let icon  = "";
            let color = "";
            if(infos[i].type === "msg_err")
            {
                icon = "fa fa-exclamation-circle";
                color = "bg-red";
            }
            else if(infos[i].type === "cnx_error")
            {    
                icon = "fa fa-exclamation-triangle";
                color = "bg-yellow";
            }
            else if(infos[i].type === "msg")
            {    
                icon = "fa fa-envelope-o";
                color = "bg-aqua"
            }
            else if(infos[i].type === "connect")
            { 
               icon = "fa fa-sign-in";
               color = "bg-green";
            }
            else if(infos[i].type === "disconnect")
            {
                icon = "fa fa-sign-out";
                color = "bg-gray";
            }

            $("#timeline_body").append(`
                  <!-- timeline item -->
                  <li>
                    <i class="`+icon+` `+ color+`"></i>

                    <div class="timeline-item">
                      <span class="time"><i class="fa fa-clock-o"></i> `+time+`</span>

                      <h3 class="timeline-header no-border"><a href="">`+target+`</a> `+infos[i].nb_type+` `+infos[i].type+`
                      </h3>
                    </div>
                  </li>
                  <!-- END timeline item -->
                `);
        }

        // end of timeline
        $("#timeline_body").append(`<li><i class="fa fa-power-off"></i></li>`);
    });
});