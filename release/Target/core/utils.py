from getpass import getuser
from time import ctime
from shutil import which
import psutil
import platform
import uuid
import subprocess
import re

def get_video_resolution(dev):

    reso_cmd = subprocess.run('ffmpeg -hide_banner -f dshow -list_options true -i video="{}"'.format(dev),\
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    reso = re.findall("\d+x\d+",reso_cmd.stdout.decode("utf8"))
    
    result = []
    for i in reso :
        if i not in result :
            result.append(i)

    return result

def get_ffmpeg_devs():

    result = {}
    result["video_devs"] = []
    result["audio_devs"] = []

    # check if ffmpeg exists
    if not which("ffmpeg"):
        return result

    ffmpeg_devs = subprocess.run("ffmpeg -hide_banner -list_devices true -f dshow -i dummy", stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    video_devs = re.search("DirectShow video devices.*DirectShow audio devices", ffmpeg_devs.stdout.decode("utf8"), re.S)
    audio_devs = re.search("DirectShow audio devices.*", ffmpeg_devs.stdout.decode("utf8"), re.S)

    # searching for viedo devices..
    if video_devs:
        devs = re.findall("\"[^\t\n\r]+\"", video_devs.group(), re.S)
        for i in devs :
            i = i.replace('"','')
            if not i.startswith("@"):
                # add video_dev and its resolution
                result["video_devs"].append( { i : get_video_resolution(i) } )

    # searching for audio devices..
    if audio_devs:
        devs = re.findall("\"[^\t\n\r]+\"", audio_devs.group(), re.S)
        for i in devs :
            i = i.replace('"','')
            if not i.startswith("@"):
                result["audio_devs"].append(i)

    return result

def get_machine_info():
    info = {}
    info["ffmpeg_devs"] = get_ffmpeg_devs()
    info["machine"] = platform.machine()
    try :
        info["name"] = platform.node() + "@" + getuser()
    except Exception as e:
        info["name"] = platform.node() + "@" + "unknown_user"

    info["platform"] = platform.platform()
    info["processor"] = platform.processor() + "__nb_" + str(psutil.cpu_count()) + "__nbLog_" + str(psutil.cpu_count(logical = False))
    info["ram"] = "{0:.2f}".format(psutil.virtual_memory().total / 1024**3)

    disk = ""
    for i in psutil.disk_partitions() :
        try:
            disk += "{0} = {1:.3f}__".format(i.mountpoint, psutil.disk_usage(i.mountpoint).total / 1024**3)
        except Exception as e:
            pass
            
    info["hard_disk"] = disk

    mac_num = hex(uuid.getnode()).replace('0x', '').upper()
    mac = '-'.join(mac_num[i : i + 2] for i in range(0, 11, 2))
    info["mac"] = mac

    return info

def get_boot_time():
    return ctime(psutil.boot_time())

def get_runing_procs():
    runing_procs = []

    for proc in psutil.process_iter():
        try:
            pinfo = proc.as_dict(attrs=['pid', 'name'])
            pinfo['create_time'] = ctime(proc.create_time())

        except psutil.NoSuchProcess:
            pass
        else:
            runing_procs.append(pinfo)

    return runing_procs

if __name__ == "__main__" :
    
    info = get_machine_info()
    print("This machine info = {} ".format(info))

    print("boot time is : {}".format( get_boot_time() ))

    #print("running processes : {}".format(get_runing_procs()))