import core.utils as utils
from os import name as os_name

ID = utils.get_machine_info()["name"] + "_T101"

CUSTOM_COMMANDS ={
			"-get [filename]" : "Get a file from the Target",
			"-send [filename]" : "Send a file to the Target",
			"-keystroke [key_to_send]": "Send a keystroke to the Target",
			"-screenshot [type]" : "Get a screenshot with [Type=full_screen or Type=window [window_name] ]"
			}

#SOCK_SRV = "azerty2.duckdns.org"
SOCK_SRV = "127.0.0.1"
SOCK_PORT = 6824
SOCK_BF = 2048

FTP_PORT = 8642
STREAM_PORT = 4286

DEFAULT_SAVING_DIR = "files"

# windows encoding cmd is 850
if os_name == "nt" :
	ENCODING = "cp850"
else:
	ENCODING = "utf8"

if __name__ == "__main__":

	print("ID = {}".format(ID))
	print("CUSTOM_COMMANDS = {}".format(CUSTOM_COMMANDS))
	print("SOCK_SRV = {}".format(SOCK_SRV))
	print("SOCK_PORT = {}".format(SOCK_PORT))
	print("SOCK_BF = {}".format(SOCK_BF))