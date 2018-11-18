import threading, logging, socket, time
from core.settings import SOCK_BF

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def read_stream(path):
	f = open(path, "rb")
	while True :
		data = f.read(SOCK_BF)
		if not data:
			f.close()
			break
		
		yield data

def send_sync(ftp_sock, path):
	for data in read_stream(path):
		ftp_sock.send(data)
		time.sleep(2)
	else:
		logger.info("Completed sending '{}'".format(path))

def get_sync(ftp_sock, path, size):
	f = open(path, "wb")
	recv_bytes = 0

	while recv_bytes < size:
		data = ftp_sock.recv(SOCK_BF)
		if not data :
			raise RuntimeError("ftp socket connection broken")
		recv_bytes += len(data)
		f.write(data)
	f.close()

class Ftp :

	__slots__ = ["srv_ip", "srv_port", "ftp_sock", "thread", "to_send_file_path","to_get_file_sLoc","to_get_file_size"]
	
	def __init__(self, srv_ip, srv_port):
		self.srv_ip = srv_ip
		self.srv_port = srv_port
		self.ftp_sock = socket.socket()
		self.ftp_sock.connect((srv_ip, srv_port))

	def send_async(self):
		thread = threading.Thread(target = send_sync, args = (self.ftp_sock, self.to_send_file_path))
		thread.start()
		logger.info("Started sending thread");

	def get_async(self):
		thread = threading.Thread(target = get_sync, args = (self.ftp_sock, self.to_get_file_sLoc, self.to_get_file_size))
		thread.start()
		logger.info("Started getting thread");
		