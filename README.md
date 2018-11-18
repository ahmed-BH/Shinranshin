# Shinranshin

A RAT, script that controls other pcs remotly, for educational purposes only  :smiling_imp: .

## Getting Started

This project contains two folders : Server and Target, for admin and the pc to control remotly respectively.

### Prerequisites

For educational purposes and experiencing new programming language, the *server* is developed using **NodeJs** and the *target* with **Python 3**

### Installing (Server)

- Install [nodejs](https://nodejs.org/en/download/)

- Open terminal

```shell
$ git clone https://github.com/ahmed-BH/shinranshin.git
$ cd shinranshin/server
$ npm install
```

To test, run :

```shell
$ node app.js
```
Then open browser http://localhost/


### Installing (Target)

- The target was mainly tested on windows OS, works on other platforms just some features were not tested.
 
- Install [python-3.6](https://www.python.org/ftp/python/3.6.4/python-3.6.4.exe) on target's machine

- Install needed python modules : 

```shell
$ cd shinranshin/target
$ pip install -r requirements.txt
```

- Download [ffmpeg](https://www.ffmpeg.org/download.html) on target's machine in **shinranshin/target/deps**

- Add ffmpeg to **PATH** (windows)

```shell
set PATH=%PATH%;full/path/to/shinranshin/target/deps 
```

- Target connects to Server through it's @IP, so we need to make @IP dynamic, [DuckDNS](https://www.duckdns.org) offers a free and simple way (or any other No-ip service).

- Follow the instructions to get DuckDns domain, like **querty.duckdns.org** and then change **SOCKSRV** variable in **settings.py** file with that domain.

- Change script extension **.py** to **.pyw** to run in background

- Create shortcut from python script, then add it to startup folder : C:\Users\ **username**\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup


## Demo

[![demo](scrot/dash.PNG?raw=true "demo")](https://vimeo.com/301485531)


## Built With

* [express](http://expressjs.com) - The Nodejs web framework used
* [AdminLTE](https://adminlte.io/) - Bootstrap Control Panel Template
* [ejs](http://ejs.co/) - Simple template engine

## To Do List 

- [x] Send basic commands, OS related commands
- [x] Send and receive files
- [x] Stream Desktop or WebCam 
- [x] Collect System information
- [x] Collect Browser activity, done but not included yet
- [ ] Clean up web pages
- [ ] Analyse Browser activity
- [ ] Secure communication
- [ ] Recover erased image, still in developping and not included yet
- [ ] Keylogging, done but not included yet
- [ ] Add Home page, only communication page is ready now
- [ ] List installed softwares
- [ ] Some functions work only in windows, adapt them to linux machine

** This project is still under development, more features will be added **



