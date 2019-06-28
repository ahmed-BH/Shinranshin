from os import name
import re, subprocess

class Info:
    @staticmethod
    def get_installed_softs():
        only_names = []
        softs      = []
        if name == "nt":
            # 32bit softs
            s = subprocess.check_output(r"reg query HKLM\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall /s /v DisplayName",\
                stderr=subprocess.STDOUT, shell=True)
            # 64 bit soft
            s += subprocess.check_output(r"reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall /s /v DisplayName",\
                stderr=subprocess.STDOUT, shell=True)

            softs = re.findall(" {4}.+\n", s.decode("utf8", "ignore"))
            only_names = []
            for i in softs :
                only_names.append(i)
        
        return only_names
