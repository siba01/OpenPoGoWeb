# OpenPoGoBotWeb
**THIS FORK IS DISCONTINUED!**

Web View for ~~OpenPoGoBot~~ and PokemonGo-Bot (read note below)

**Note**: This is a fork of [OpenPoGo/OpenPoGoWeb](https://github.com/OpenPoGo/OpenPoGoWeb/) (wchill/refactor branch). This repo contains my personal modifications/optimizations. This repo was optimized to be used together with [PokemonGoF/PokemonGo-Bot](https://github.com/PokemonGoF/PokemonGo-Bot/). So it's very unlikely to work well with [OpenPoGo/OpenPoGoBot](https://github.com/OpenPoGo/OpenPoGoBot).

**Additional note:** If you want to see screenshots of some my modifications/optimizations, feel free to read the comments in every [commit](https://github.com/BobbyWibowo/OpenPoGoWeb/commits/wchill/refactor) which has comments.

## How to Use
To start the server in Linux, run the file: `run.sh` (with: `./run.sh`).

On Windows, supposedly you can just open `run.sh` file as well. If that doesn't work, you can create a new batch file called `run.bat` with these content:
```
@echo off

rem Starts PokemonGo-Web server
python -m SimpleHTTPServer
```
